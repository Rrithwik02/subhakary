import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  encryptGoogleSecret,
  fetchGoogleCalendarList,
  fetchGoogleUserInfo,
  createSupabaseServiceClient,
  createSupabaseUserClient,
  upsertGoogleIntegrationState,
  GOOGLE_CALENDAR_SCOPES,
} from "../_shared/google-calendar.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ConnectRequest = {
  providerId: string;
  providerToken: string;
  providerRefreshToken?: string | null;
  providerTokenExpiresAt?: string | null;
  providerScopes?: string[] | string | null;
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
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    const { providerId, providerToken, providerRefreshToken, providerTokenExpiresAt, providerScopes } =
      (await req.json()) as ConnectRequest;

    if (!providerId || !providerToken) {
      return new Response(JSON.stringify({ error: "Provider and Google token are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: provider, error: providerError } = await serviceClient
      .from("service_providers")
      .select("id,user_id,business_name,status")
      .eq("id", providerId)
      .maybeSingle();

    if (providerError) throw providerError;
    if (!provider || provider.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Provider not found or not owned by current user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [userInfo, calendarList] = await Promise.all([
      fetchGoogleUserInfo(providerToken),
      fetchGoogleCalendarList(providerToken),
    ]);

    const primaryCalendar = calendarList.find((calendar) => calendar.primary) ?? calendarList[0] ?? null;
    const encryptedAccessToken = await encryptGoogleSecret(providerToken);
    const encryptedRefreshToken = providerRefreshToken ? await encryptGoogleSecret(providerRefreshToken) : null;
    const scopes = Array.isArray(providerScopes)
      ? providerScopes
      : typeof providerScopes === "string"
        ? providerScopes.split(" ").filter(Boolean)
        : GOOGLE_CALENDAR_SCOPES.split(" ");

    const { error: tokenError } = await serviceClient
      .schema("private")
      .from("provider_google_calendar_tokens")
      .upsert(
        {
          provider_id: providerId,
          google_account_email: userInfo.email ?? null,
          google_access_token_ciphertext: encryptedAccessToken,
          google_refresh_token_ciphertext: encryptedRefreshToken,
          access_token_expires_at: providerTokenExpiresAt ?? null,
          token_scopes: scopes,
          calendar_id: primaryCalendar?.id ?? "primary",
          token_type: "Bearer",
        },
        { onConflict: "provider_id" }
      );

    if (tokenError) throw tokenError;

    await upsertGoogleIntegrationState(serviceClient, providerId, {
      syncStatus: "connected",
      accountEmail: userInfo.email ?? null,
      accountName: userInfo.name ?? null,
      calendarId: primaryCalendar?.id ?? "primary",
      calendarName: primaryCalendar?.summary ?? "Primary calendar",
      timezone: primaryCalendar?.timeZone ?? userInfo.timezone ?? null,
      lastSyncedAt: new Date().toISOString(),
      importExternal: true,
      autoSync: true,
      syncScope: "all",
    });

    const { error: queueError } = await serviceClient.rpc("queue_provider_calendar_sync_job", {
      p_provider_id: providerId,
      p_entity_type: "calendar",
      p_operation: "import",
      p_entity_id: null,
      p_google_event_id: null,
      p_payload: {
        reason: "initial_connect",
        account_email: userInfo.email ?? null,
      },
    });

    if (queueError) throw queueError;

    return new Response(
      JSON.stringify({
        success: true,
        connected: true,
        providerId,
        accountEmail: userInfo.email ?? null,
        calendarId: primaryCalendar?.id ?? "primary",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
