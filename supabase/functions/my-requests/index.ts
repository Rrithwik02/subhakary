import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireBotSecret } from "../../../whatsapp-bot/services/whatsapp/auth.ts";
import { createServiceClient } from "../../../whatsapp-bot/services/supabase/client.ts";
import { findWhatsappCustomerByPhone } from "../../../whatsapp-bot/services/customer/index.ts";
import { listRequestsByCustomer } from "../../../whatsapp-bot/services/request-management/index.ts";

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
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!requireBotSecret(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const supabase = createServiceClient();
    const query = req.method === "GET" ? new URL(req.url) : null;
    const body = req.method === "POST" ? await req.json() : {};
    const customerId = body.customerId ?? query?.searchParams.get("customerId");
    const phone = body.phone ?? query?.searchParams.get("phone");

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && phone) {
      const customer = await findWhatsappCustomerByPhone(supabase, phone);
      resolvedCustomerId = customer?.id ?? null;
    }

    if (!resolvedCustomerId) {
      return json({ error: "customerId or phone is required" }, 400);
    }

    const requests = await listRequestsByCustomer(supabase, resolvedCustomerId);
    return json({ requests });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Request lookup failed" }, 500);
  }
});
