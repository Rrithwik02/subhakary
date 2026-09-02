export async function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  const secret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!secret) return true;
  if (!signatureHeader) return false;

  const [, providedSignature] = signatureHeader.split("=");
  if (!providedSignature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expectedSignature = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === providedSignature.toLowerCase();
}

export function requireBotSecret(request: Request): boolean {
  const expected = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
  if (!expected) return true;
  return request.headers.get("x-whatsapp-bot-secret") === expected;
}

