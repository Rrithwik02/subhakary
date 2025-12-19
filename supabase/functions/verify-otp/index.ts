import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  code: string;
  purpose: "login" | "enable_2fa" | "disable_2fa";
}

// Rate limiting constants
const MAX_VERIFICATION_ATTEMPTS_PER_HOUR = 10;
const LOCKOUT_THRESHOLD = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, purpose }: VerifyOTPRequest = await req.json();

    if (!email || !code || !purpose) {
      return new Response(
        JSON.stringify({ error: "Email, code, and purpose are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate code format (must be exactly 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Count failed verification attempts in the last hour
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    // Get all OTP records for this email in the last hour to check for failed attempts
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from("email_otp_codes")
      .select("id, code, used, expires_at")
      .eq("email", email)
      .eq("purpose", purpose)
      .gte("created_at", oneHourAgo);

    if (attemptsError) {
      console.error("Error checking verification attempts:", attemptsError);
    }

    // Count how many used OTPs there are (indicates previous verification attempts)
    const usedAttempts = recentAttempts?.filter(a => a.used).length || 0;
    
    if (usedAttempts >= MAX_VERIFICATION_ATTEMPTS_PER_HOUR) {
      console.log(`Too many verification attempts for email: ${email}. Attempts: ${usedAttempts}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many verification attempts. Please wait before trying again.",
          retryAfter: 3600,
          locked: usedAttempts >= LOCKOUT_THRESHOLD
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "3600"
          } 
        }
      );
    }

    // Get the OTP record - use timing-safe comparison approach
    const { data: otpRecords, error: otpError } = await supabase
      .from("email_otp_codes")
      .select("*")
      .eq("email", email)
      .eq("purpose", purpose)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const otpRecord = otpRecords?.[0];

    // Check if we have a valid OTP record
    if (otpError || !otpRecord) {
      console.log("OTP verification failed: No valid OTP found");
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      console.log("OTP verification failed: Code expired");
      // Mark as used to count against rate limit
      await supabase
        .from("email_otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id);
        
      return new Response(
        JSON.stringify({ error: "Verification code has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Constant-time comparison to prevent timing attacks
    const codeMatch = timingSafeEqual(code, otpRecord.code);
    
    if (!codeMatch) {
      console.log("OTP verification failed: Code mismatch");
      // Mark this OTP as used to count against rate limit
      await supabase
        .from("email_otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id);
        
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as used
    await supabase
      .from("email_otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Handle 2FA enable/disable
    if (purpose === "enable_2fa") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ two_factor_enabled: true })
        .eq("id", otpRecord.user_id);

      if (updateError) {
        console.error("Failed to enable 2FA:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to enable two-factor authentication" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`2FA enabled for user ${otpRecord.user_id}`);
    } else if (purpose === "disable_2fa") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ two_factor_enabled: false })
        .eq("id", otpRecord.user_id);

      if (updateError) {
        console.error("Failed to disable 2FA:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to disable two-factor authentication" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`2FA disabled for user ${otpRecord.user_id}`);
    }

    console.log(`OTP verified successfully for ${email} (Purpose: ${purpose})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: purpose === "login" 
          ? "Login verified" 
          : purpose === "enable_2fa"
          ? "Two-factor authentication enabled"
          : "Two-factor authentication disabled"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(handler);
