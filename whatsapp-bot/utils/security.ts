export function isApprovedMediaUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;

    const configuredHosts = (Deno.env.get("WHATSAPP_ALLOWED_MEDIA_HOSTS") ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const projectHost = supabaseUrl ? new URL(supabaseUrl).hostname.toLowerCase() : null;

    return Boolean(projectHost && [projectHost, ...configuredHosts].includes(parsed.hostname.toLowerCase()));
  } catch {
    return false;
  }
}

export function safeMediaUrls(values: unknown, max = 4): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((value): value is string => isApprovedMediaUrl(value)).slice(0, max);
}
