import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireBotSecret } from "../../../whatsapp-bot/services/whatsapp/auth.ts";
import { searchProviders } from "../../../whatsapp-bot/services/provider-search/index.ts";

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

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "Missing Supabase configuration" }, 500);

  const body = await req.json();
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const result = await searchProviders(supabase, {
      categoryId: body.categoryId ?? null,
      categorySlug: body.categorySlug ?? null,
      location: body.location ?? null,
      eventDate: body.eventDate ?? null,
      budgetMin: body.budgetMin ?? null,
      budgetMax: body.budgetMax ?? null,
      page: body.page ?? 1,
      limit: body.limit ?? 5,
    });

    return json(result);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Search failed" }, 500);
  }
});

