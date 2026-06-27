import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request using CRON_SECRET_TOKEN
    const authHeader = req.headers.get("authorization");
    const expectedToken = Deno.env.get("CRON_SECRET_TOKEN");

    if (!expectedToken) {
      console.error("CRON_SECRET_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.error("Unauthorized request - invalid or missing token");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Request authenticated successfully");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find bookings that should be auto-completed
    // These are bookings where:
    // 1. Provider has requested completion
    // 2. Customer hasn't confirmed
    // 3. 7 days have passed since request (auto_complete_at has passed)
    const { data: bookingsToComplete, error: fetchError } = await supabase
      .from("bookings")
      .select("id, provider_id, user_id")
      .eq("status", "accepted")
      .eq("completion_confirmed_by_provider", true)
      .or("completion_confirmed_by_customer.is.null,completion_confirmed_by_customer.eq.false")
      .lte("auto_complete_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching bookings:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${bookingsToComplete?.length || 0} bookings to auto-complete`);

    let completedCount = 0;

    for (const booking of bookingsToComplete || []) {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "completed",
          completion_confirmed_by_customer: true,
          completion_status: "auto_completed",
        })
        .eq("id", booking.id);

      if (updateError) {
        console.error(`Error auto-completing booking ${booking.id}:`, updateError);
        continue;
      }

      completedCount++;
      console.log(`Auto-completed booking ${booking.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-completed ${completedCount} bookings`,
        count: completedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in auto-complete function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
