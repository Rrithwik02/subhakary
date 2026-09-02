import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireBotSecret } from "../../../whatsapp-bot/services/whatsapp/auth.ts";
import { sendWhatsAppMessage } from "../../../whatsapp-bot/services/whatsapp/send-message.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-whatsapp-bot-secret",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!requireBotSecret(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json();
    const result = await sendWhatsAppMessage({
      to: body.to,
      text: body.text,
      imageUrl: body.imageUrl ?? null,
      caption: body.caption ?? undefined,
    });
    return json(result, result.ok ? 200 : 502);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Message send failed" }, 500);
  }
});

