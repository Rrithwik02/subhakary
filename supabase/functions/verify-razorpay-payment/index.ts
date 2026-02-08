import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// HMAC SHA256 verification
async function verifySignature(
  orderId: string,
  paymentIdRazorpay: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const message = `${orderId}|${paymentIdRazorpay}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  return expectedSignature === signature;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Parse request body
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentId 
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the payment belongs to user
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select(`
        *,
        booking:bookings(user_id, provider_id)
      `)
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payment.booking?.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!RAZORPAY_KEY_SECRET) {
      console.error("RAZORPAY_KEY_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      console.error("Invalid Razorpay signature");
      
      // Update payment as failed
      await supabase
        .from("payments")
        .update({ 
          status: "failed",
          payment_description: `Payment verification failed. Order: ${razorpay_order_id}`
        })
        .eq("id", paymentId);

      return new Response(
        JSON.stringify({ error: "Payment verification failed", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment verified successfully - update status
    const { error: updateError } = await supabase
      .from("payments")
      .update({ 
        status: "completed",
        payment_description: `Razorpay Payment: ${razorpay_payment_id} | Order: ${razorpay_order_id}`
      })
      .eq("id", paymentId);

    if (updateError) {
      console.error("Failed to update payment status:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update payment status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification for provider
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get provider profile_id for notification
    const { data: provider } = await adminSupabase
      .from("service_providers")
      .select("profile_id, business_name")
      .eq("id", payment.booking?.provider_id)
      .single();

    if (provider?.profile_id) {
      await adminSupabase
        .from("notifications")
        .insert({
          user_id: provider.profile_id,
          title: "Payment Received",
          message: `Payment of ₹${payment.amount} received for booking.`,
          type: "payment",
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
