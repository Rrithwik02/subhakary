import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireBotSecret } from "../../../whatsapp-bot/services/whatsapp/auth.ts";
import { findOrCreateWhatsappCustomer, findWhatsappCustomerByPhone } from "../../../whatsapp-bot/services/customer/index.ts";

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
  if (!requireBotSecret(req)) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Missing Supabase configuration" }, 500);

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (req.method === "GET") {
      const query = new URL(req.url);
      const phone = query.searchParams.get("phone");
      if (!phone) return json({ error: "phone is required" }, 400);
      const customer = await findWhatsappCustomerByPhone(supabase, phone);
      return json({ customer });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (body.phone) {
        const customer = await findOrCreateWhatsappCustomer(supabase, body.phone, body.displayName ?? null, body.profileId ?? null);
        return json({ customer });
      }
      if (body.customerId) {
        const { data } = await supabase.from("whatsapp_customers").select("*").eq("id", body.customerId).maybeSingle();
        return json({ customer: data ?? null });
      }
      return json({ error: "phone or customerId is required" }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Customer lookup failed" }, 500);
  }
});

