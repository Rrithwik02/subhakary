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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the OTP record
    const { data: otpRecord, error: otpError } = await supabase
      .from("email_otp_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("purpose", purpose)
      .eq("used", false)
      .maybeSingle();

    if (otpError || !otpRecord) {
      console.log("OTP verification failed: Invalid or expired code");
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      console.log("OTP verification failed: Code expired");
      return new Response(
        JSON.stringify({ error: "Verification code has expired" }),
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
