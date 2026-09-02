import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
].join(" ");

export interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  tokenType?: string | null;
  scopes?: string[] | null;
}

export interface GoogleUserInfo {
  email?: string | null;
  name?: string | null;
  timezone?: string | null;
}

export interface GoogleCalendarListItem {
  id: string;
  summary?: string | null;
  primary?: boolean;
  timeZone?: string | null;
}

export interface GoogleStoredTokens {
  id: string;
  provider_id: string;
  google_account_email: string | null;
  google_access_token_ciphertext: string;
  google_refresh_token_ciphertext: string | null;
  access_token_expires_at: string | null;
  token_scopes: string[] | null;
  calendar_id: string | null;
  token_type: string | null;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const getSecret = () =>
  Deno.env.get("GOOGLE_CALENDAR_ENCRYPTION_KEY") ||
  Deno.env.get("GOOGLE_OAUTH_ENCRYPTION_KEY") ||
  Deno.env.get("CRON_SECRET_TOKEN") ||
  "";

const toBase64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));

const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function getCryptoKey(secret: string) {
  const hash = await crypto.subtle.digest("SHA-256", textEncoder.encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptGoogleSecret(value: string) {
  const secret = getSecret();
  if (!secret) {
    throw new Error("Google calendar encryption key is missing");
  }

  const key = await getCryptoKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(value)
  );

  return `v1:${toBase64(iv.buffer)}:${toBase64(encrypted)}`;
}

export async function decryptGoogleSecret(ciphertext: string) {
  const secret = getSecret();
  if (!secret) {
    throw new Error("Google calendar encryption key is missing");
  }

  const [, ivBase64, encryptedBase64] = ciphertext.split(":");
  if (!ivBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted Google token format");
  }

  const key = await getCryptoKey(secret);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivBase64) },
    key,
    fromBase64(encryptedBase64)
  );

  return textDecoder.decode(decrypted);
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google userinfo request failed (${response.status})`);
  }

  const json = await response.json();
  return {
    email: json.email ?? null,
    name: json.name ?? null,
    timezone: json.timezone ?? null,
  };
}

export async function fetchGoogleCalendarList(accessToken: string): Promise<GoogleCalendarListItem[]> {
  const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=owner&showHidden=true", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google calendar list request failed (${response.status})`);
  }

  const json = await response.json();
  return (json.items ?? []).map((item: any) => ({
    id: item.id,
    summary: item.summary ?? null,
    primary: Boolean(item.primary),
    timeZone: item.timeZone ?? null,
  }));
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth client credentials are missing");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token refresh failed (${response.status}): ${text}`);
  }

  const json = await response.json();
  return {
    accessToken: json.access_token as string,
    refreshToken: (json.refresh_token as string | undefined) ?? null,
    expiresIn: Number(json.expires_in ?? 3600),
    tokenType: (json.token_type as string | undefined) ?? "Bearer",
    scopes: typeof json.scope === "string" ? json.scope.split(" ") : [],
  };
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  options: {
    timeMin?: string;
    timeMax?: string;
    pageToken?: string;
    singleEvents?: boolean;
    orderBy?: "startTime" | "updated";
  } = {},
) {
  const params = new URLSearchParams({
    singleEvents: String(options.singleEvents ?? true),
    orderBy: options.orderBy ?? "startTime",
    maxResults: "2500",
  });

  if (options.timeMin) params.set("timeMin", options.timeMin);
  if (options.timeMax) params.set("timeMax", options.timeMax);
  if (options.pageToken) params.set("pageToken", options.pageToken);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google calendar events request failed (${response.status}): ${text}`);
  }

  return await response.json();
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventPayload: Record<string, unknown>,
) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google calendar create failed (${response.status}): ${text}`);
  }

  return await response.json();
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  eventPayload: Record<string, unknown>,
) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google calendar update failed (${response.status}): ${text}`);
  }

  return await response.json();
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`Google calendar delete failed (${response.status}): ${text}`);
  }
}

export async function loadGoogleCalendarTokens(
  serviceClient: SupabaseClient,
  providerId: string,
) {
  const { data, error } = await serviceClient
    .schema("private")
    .from("provider_google_calendar_tokens")
    .select("*")
    .eq("provider_id", providerId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as GoogleStoredTokens | null;
}

export function createSupabaseUserClient(url: string, authHeader: string) {
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ||
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
    "";

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseServiceClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function addDaysToIsoDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function toGoogleDateTime(date: string, time: string, timeZone: string) {
  return {
    dateTime: `${date}T${time.length === 5 ? `${time}:00` : time}`,
    timeZone,
  };
}

export function normalizeTimeValue(value?: string | null) {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
}

export function buildGoogleEventPayload(
  event: {
    title: string;
    event_date: string;
    start_time?: string | null;
    end_time?: string | null;
    all_day?: boolean;
    notes?: string | null;
    location?: string | null;
    event_type?: string;
    provider_id?: string;
    booking_id?: string | null;
    external_source_id?: string | null;
    source?: string;
  },
  timeZone: string,
) {
  const allDay = Boolean(event.all_day);
  const startTime = normalizeTimeValue(event.start_time) ?? "09:00:00";
  const endTime = normalizeTimeValue(event.end_time) ?? "17:00:00";

  return {
    summary: event.title,
    description: event.notes ?? undefined,
    location: event.location ?? undefined,
    transparency: "opaque",
    visibility: "default",
    start: allDay
      ? { date: event.event_date }
      : toGoogleDateTime(event.event_date, startTime, timeZone),
    end: allDay
      ? { date: addDaysToIsoDate(event.event_date, 1) }
      : toGoogleDateTime(event.event_date, endTime, timeZone),
    extendedProperties: {
      private: {
        subhakary_provider_id: event.provider_id ?? "",
        subhakary_event_type: event.event_type ?? "",
        subhakary_booking_id: event.booking_id ?? "",
        subhakary_external_source_id: event.external_source_id ?? "",
        subhakary_source: event.source ?? "",
      },
    },
  };
}

export function mapGoogleEventToProviderEvent(providerId: string, googleEvent: any) {
  const isAllDay = Boolean(googleEvent?.start?.date && !googleEvent?.start?.dateTime);
  const startDate = googleEvent?.start?.date ?? googleEvent?.start?.dateTime?.slice(0, 10);
  const endDateRaw = googleEvent?.end?.date ?? googleEvent?.end?.dateTime?.slice(0, 10) ?? startDate;
  const endDate = isAllDay ? addDaysToIsoDate(endDateRaw, -1) : endDateRaw;

  return {
    provider_id: providerId,
    title: googleEvent?.summary || "Google Calendar Event",
    event_type: "external_booking",
    event_date: startDate,
    end_date: endDate,
    start_time: googleEvent?.start?.dateTime ? googleEvent.start.dateTime.slice(11, 19) : null,
    end_time: googleEvent?.end?.dateTime ? googleEvent.end.dateTime.slice(11, 19) : null,
    all_day: isAllDay,
    notes: googleEvent?.description ?? null,
    location: googleEvent?.location ?? null,
    source: "google_calendar",
    external_source_id: googleEvent?.id,
    external_source_payload: googleEvent ?? {},
    booking_id: null,
    booking_status: null,
    sync_status: googleEvent?.status === "cancelled" ? "deleted" : "synced",
    sync_error: null,
    last_synced_at: new Date().toISOString(),
  };
}

export async function upsertGoogleIntegrationState(
  serviceClient: SupabaseClient,
  providerId: string,
  state: {
    syncStatus: "disconnected" | "connected" | "syncing" | "error";
    accountEmail?: string | null;
    accountName?: string | null;
    calendarId?: string | null;
    calendarName?: string | null;
    timezone?: string | null;
    lastSyncedAt?: string | null;
    lastImportedAt?: string | null;
    lastExportedAt?: string | null;
    lastError?: string | null;
    importExternal?: boolean;
    autoSync?: boolean;
    syncScope?: "all" | "bookings_only";
  }
) {
  const { error } = await serviceClient
    .from("provider_calendar_integrations")
    .upsert(
      {
        provider_id: providerId,
        integration_name: "google_calendar",
        google_account_email: state.accountEmail ?? null,
        google_account_name: state.accountName ?? null,
        google_calendar_id: state.calendarId ?? null,
        google_calendar_name: state.calendarName ?? null,
        google_calendar_timezone: state.timezone ?? null,
        sync_status: state.syncStatus,
        sync_scope: state.syncScope ?? "all",
        auto_sync: state.autoSync ?? true,
        import_external: state.importExternal ?? true,
        google_connected_at: state.syncStatus === "connected" ? new Date().toISOString() : null,
        last_synced_at: state.lastSyncedAt ?? null,
        last_imported_at: state.lastImportedAt ?? null,
        last_exported_at: state.lastExportedAt ?? null,
        last_error: state.lastError ?? null,
      },
      { onConflict: "provider_id" }
    );

  if (error) {
    throw error;
  }
}
