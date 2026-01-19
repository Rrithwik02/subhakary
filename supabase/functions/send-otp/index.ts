import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  purpose: "login" | "enable_2fa" | "disable_2fa";
}

// Rate limiting constants
const MAX_OTP_REQUESTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, purpose }: SendOTPRequest = await req.json();

    if (!email || !purpose) {
      return new Response(
        JSON.stringify({ error: "Email and purpose are required" }),
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check recent OTP requests for this email
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    const { count: recentRequestCount, error: countError } = await supabase
      .from("email_otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Error checking rate limit:", countError);
    }

    if (recentRequestCount && recentRequestCount >= MAX_OTP_REQUESTS_PER_HOUR) {
      console.log(`Rate limit exceeded for email: ${email}. Requests in last hour: ${recentRequestCount}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many OTP requests. Please try again later.",
          retryAfter: 3600 // seconds
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

    // Get profile by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile) {
      // Generate dummy OTP and add delay to prevent timing-based email enumeration
      // This ensures response time is similar whether user exists or not
      const dummyArray = new Uint32Array(1);
      crypto.getRandomValues(dummyArray);
      const dummyCode = String(100000 + (dummyArray[0] % 900000));
      
      // Add artificial delay to match the timing of successful OTP generation/sending
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
      
      console.log("Profile not found or error:", profileError?.message || "Not found");
      return new Response(
        JSON.stringify({ success: true, message: "If this email exists, an OTP has been sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP using crypto for better randomness
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = String(100000 + (array[0] % 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTP codes for this user and purpose
    await supabase
      .from("email_otp_codes")
      .update({ used: true })
      .eq("user_id", profile.id)
      .eq("purpose", purpose)
      .eq("used", false);

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("email_otp_codes")
      .insert({
        user_id: profile.id,
        email: email,
        code: code,
        purpose: purpose,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to send email via Resend if API key is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        const purposeText = purpose === "login" 
          ? "login to your account" 
          : purpose === "enable_2fa" 
          ? "enable two-factor authentication"
          : "disable two-factor authentication";

        await resend.emails.send({
          from: "Subhakary <noreply@subhakary.com>",
          to: [email],
          subject: `Your verification code: ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #D4A853;">Subhakary Verification Code</h1>
              <p>You requested to ${purposeText}. Use the code below to verify:</p>
              <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
              </div>
              <p style="color: #666;">This code expires in 10 minutes.</p>
              <p style="color: #666;">If you didn't request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">© Subhakary - Your trusted cultural services platform</p>
            </div>
          `,
        });

        console.log(`OTP email sent successfully to ${email}`);
      } catch (emailError) {
        console.error("Failed to send email via Resend:", emailError);
        // Continue - OTP is still valid, just not sent via email
      }
    } else {
      // Log OTP to console for testing when Resend is not configured
      console.log(`[TEST MODE] OTP for ${email}: ${code} (Purpose: ${purpose})`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: resendApiKey ? "OTP sent to your email" : "OTP generated (check server logs for testing)"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
