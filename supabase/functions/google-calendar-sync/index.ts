import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  buildGoogleEventPayload,
  createGoogleCalendarEvent,
  createSupabaseServiceClient,
  encryptGoogleSecret,
  decryptGoogleSecret,
  fetchGoogleCalendarEvents,
  loadGoogleCalendarTokens,
  mapGoogleEventToProviderEvent,
  refreshGoogleAccessToken,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  upsertGoogleIntegrationState,
} from "../_shared/google-calendar.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TIME_MIN = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const DEFAULT_TIME_MAX = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

const loadAccessToken = async (serviceClient: ReturnType<typeof createSupabaseServiceClient>, providerId: string) => {
  const tokenRow = await loadGoogleCalendarTokens(serviceClient, providerId);
  if (!tokenRow) {
    throw new Error("Google Calendar is not connected for this provider");
  }

  let accessToken = await decryptGoogleSecret(tokenRow.google_access_token_ciphertext);
  const expiresAt = tokenRow.access_token_expires_at ? new Date(tokenRow.access_token_expires_at).getTime() : 0;
  const needsRefresh = !expiresAt || expiresAt - Date.now() < 2 * 60 * 1000;

  if (needsRefresh) {
    if (!tokenRow.google_refresh_token_ciphertext) {
      throw new Error("Google refresh token is missing");
    }

    const refreshToken = await decryptGoogleSecret(tokenRow.google_refresh_token_ciphertext);
    const refreshed = await refreshGoogleAccessToken(refreshToken);
    accessToken = refreshed.accessToken;

    await serviceClient
      .schema("private")
      .from("provider_google_calendar_tokens")
      .update({
        google_access_token_ciphertext: await encryptGoogleSecret(accessToken),
        access_token_expires_at: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
        token_scopes: refreshed.scopes ?? tokenRow.token_scopes ?? [],
        token_type: refreshed.tokenType ?? tokenRow.token_type ?? "Bearer",
        google_refresh_token_ciphertext: refreshed.refreshToken
          ? await encryptGoogleSecret(refreshed.refreshToken)
          : tokenRow.google_refresh_token_ciphertext,
        updated_at: new Date().toISOString(),
      })
      .eq("provider_id", providerId);
  }

  return { tokenRow, accessToken };
};

const processImportJob = async (
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  providerId: string,
  payload: Record<string, unknown>,
) => {
  const { tokenRow, accessToken } = await loadAccessToken(serviceClient, providerId);
  const calendarId = tokenRow.calendar_id ?? "primary";
  const timeMin = typeof payload.timeMin === "string" ? payload.timeMin : DEFAULT_TIME_MIN;
  const timeMax = typeof payload.timeMax === "string" ? payload.timeMax : DEFAULT_TIME_MAX;
  const googleCalendar = await fetchGoogleCalendarEvents(accessToken, calendarId, {
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  const importedEvents = Array.isArray(googleCalendar.items) ? googleCalendar.items : [];
  for (const googleEvent of importedEvents) {
    if (!googleEvent?.id) continue;
    if (googleEvent.status === "cancelled") {
      await serviceClient
        .from("provider_events")
        .delete()
        .eq("provider_id", providerId)
        .eq("source", "google_calendar")
        .eq("external_source_id", googleEvent.id);
      continue;
    }

    const mapped = mapGoogleEventToProviderEvent(providerId, googleEvent);
    const { error } = await serviceClient
      .from("provider_events")
      .upsert(mapped, { onConflict: "provider_id,source,external_source_id" });

    if (error) throw error;
  }

  await upsertGoogleIntegrationState(serviceClient, providerId, {
    syncStatus: "connected",
    lastSyncedAt: new Date().toISOString(),
    lastImportedAt: new Date().toISOString(),
    accountEmail: tokenRow.google_account_email ?? null,
    calendarId,
    importExternal: true,
    autoSync: true,
    syncScope: "all",
  });
};

const processExportJob = async (
  serviceClient: ReturnType<typeof createSupabaseServiceClient>,
  providerId: string,
  entityId: string | null,
  operation: string,
) => {
  const { tokenRow, accessToken } = await loadAccessToken(serviceClient, providerId);
  const calendarId = tokenRow.calendar_id ?? "primary";

  const { data: providerEvent, error } = entityId
    ? await serviceClient
        .from("provider_events")
        .select("*")
        .eq("provider_id", providerId)
        .eq("id", entityId)
        .maybeSingle()
    : { data: null, error: null };

  if (error) throw error;
  if (!providerEvent) return;

  if (operation === "delete") {
    if (providerEvent.external_source_id) {
      await deleteGoogleCalendarEvent(accessToken, calendarId, providerEvent.external_source_id);
    }
    return;
  }

  const payload = buildGoogleEventPayload(providerEvent, tokenRow.google_calendar_timezone ?? "Asia/Kolkata");
  const imported = providerEvent.external_source_id
    ? await updateGoogleCalendarEvent(accessToken, calendarId, providerEvent.external_source_id, payload)
    : await createGoogleCalendarEvent(accessToken, calendarId, payload);

  await serviceClient
    .from("provider_events")
    .update({
      external_source_id: imported.id ?? providerEvent.external_source_id,
      external_source_payload: imported,
      sync_status: "synced",
      sync_error: null,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", providerEvent.id);

  await upsertGoogleIntegrationState(serviceClient, providerId, {
    syncStatus: "connected",
    lastSyncedAt: new Date().toISOString(),
    lastExportedAt: new Date().toISOString(),
    accountEmail: tokenRow.google_account_email ?? null,
    calendarId,
    importExternal: true,
    autoSync: true,
    syncScope: "all",
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase configuration");
    }

    const serviceClient = createSupabaseServiceClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const providerId = body?.providerId as string | undefined;
    const limit = Number(body?.limit ?? 10);

    let jobQuery = serviceClient
      .from("provider_calendar_sync_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(Math.max(1, Math.min(limit, 25)));

    if (providerId) {
      jobQuery = jobQuery.eq("provider_id", providerId);
    }

    const { data: jobs, error: jobError } = await jobQuery;
    if (jobError) throw jobError;

    for (const job of jobs ?? []) {
      await serviceClient
        .from("provider_calendar_sync_jobs")
        .update({ status: "processing", attempts: (job.attempts ?? 0) + 1 })
        .eq("id", job.id);

      try {
        if (job.operation === "import" || job.entity_type === "calendar") {
          await processImportJob(serviceClient, job.provider_id, job.payload ?? {});
        } else {
          await processExportJob(serviceClient, job.provider_id, job.entity_id ?? null, job.operation);
        }

        await serviceClient
          .from("provider_calendar_sync_jobs")
          .update({
            status: "succeeded",
            processed_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      } catch (jobError) {
        await serviceClient
          .from("provider_calendar_sync_jobs")
          .update({
            status: "failed",
            last_error: jobError instanceof Error ? jobError.message : "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
