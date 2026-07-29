import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createSupabaseServiceClient,
  createSupabaseUserClient,
} from "../_shared/google-calendar.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const userClient = createSupabaseUserClient(supabaseUrl, authHeader);
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createSupabaseServiceClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const providerId = body?.providerId as string | undefined;

    if (!providerId) {
      return new Response(JSON.stringify({ error: "Provider is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: provider, error: providerError } = await serviceClient
      .from("service_providers")
      .select("id,user_id")
      .eq("id", providerId)
      .maybeSingle();

    if (providerError) throw providerError;
    if (!provider || provider.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: tokenDeleteError } = await serviceClient
      .schema("private")
      .from("provider_google_calendar_tokens")
      .delete()
      .eq("provider_id", providerId);

    if (tokenDeleteError) throw tokenDeleteError;

    const { error: syncJobError } = await serviceClient
      .from("provider_calendar_sync_jobs")
      .insert({
        job_key: `${providerId}:calendar:disconnect:${Date.now()}`,
        provider_id: providerId,
        entity_type: "calendar",
        operation: "refresh",
        payload: { reason: "disconnect" },
      });

    if (syncJobError) throw syncJobError;

    const { error: integrationError } = await serviceClient
      .from("provider_calendar_integrations")
      .upsert(
        {
          provider_id: providerId,
          sync_status: "disconnected",
          google_account_email: null,
          google_account_name: null,
          google_calendar_id: null,
          google_calendar_name: null,
          google_calendar_timezone: null,
          google_connected_at: null,
          google_access_token_expires_at: null,
          last_error: null,
        },
        { onConflict: "provider_id" }
      );

    if (integrationError) throw integrationError;

    return new Response(JSON.stringify({ success: true, disconnected: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
