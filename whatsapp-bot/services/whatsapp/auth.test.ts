import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { requireBotSecret, verifyMetaWebhookSignature } from "./auth.ts";

async function signature(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.test("webhook signature requires the app secret and exact sha256 prefix", async () => {
  const body = '{"entry":[]}';
  Deno.env.set("WHATSAPP_APP_SECRET", "test-app-secret");
  const digest = await signature(body, "test-app-secret");

  assert(await verifyMetaWebhookSignature(body, `sha256=${digest}`));
  assert(!await verifyMetaWebhookSignature(body, digest));
  assert(!await verifyMetaWebhookSignature(body, `sha1=${digest}`));
  Deno.env.delete("WHATSAPP_APP_SECRET");
  assert(!await verifyMetaWebhookSignature(body, `sha256=${digest}`));
});

Deno.test("internal requests require the configured shared secret", () => {
  Deno.env.set("WHATSAPP_WEBHOOK_SECRET", "internal-test-secret");
  assert(requireBotSecret(new Request("https://example.test", { headers: { "x-whatsapp-bot-secret": "internal-test-secret" } })));
  assert(!requireBotSecret(new Request("https://example.test")));
  assert(!requireBotSecret(new Request("https://example.test", { headers: { "x-whatsapp-bot-secret": "wrong" } })));
  Deno.env.delete("WHATSAPP_WEBHOOK_SECRET");
  assertEquals(requireBotSecret(new Request("https://example.test")), false);
});
