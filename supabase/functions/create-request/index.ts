import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireBotSecret } from "../../../whatsapp-bot/services/whatsapp/auth.ts";
import { createWhatsappRequest, addRequestProviders } from "../../../whatsapp-bot/services/request-management/index.ts";
import { findOrCreateWhatsappCustomer } from "../../../whatsapp-bot/services/customer/index.ts";

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
    const customerId = body.customerId
      || (body.phone ? (await findOrCreateWhatsappCustomer(supabase, body.phone, body.displayName ?? null, body.profileId ?? null)).id : null);

    if (!customerId) {
      return json({ error: "customerId or phone is required" }, 400);
    }

    const request = await createWhatsappRequest(supabase, {
      customerId,
      requestType: body.requestType ?? "service_request",
      status: body.status ?? "NEW",
      serviceCategoryId: body.serviceCategoryId ?? null,
      serviceCategoryName: body.serviceCategoryName ?? null,
      serviceCategorySlug: body.serviceCategorySlug ?? null,
      locationName: body.locationName ?? null,
      eventType: body.eventType ?? null,
      eventDate: body.eventDate ?? null,
      guestCount: body.guestCount ?? null,
      budgetRange: body.budgetRange ?? null,
      selectedRequirementIds: body.selectedRequirementIds ?? [],
      selectedProviderIds: body.selectedProviderIds ?? [],
      recommendationRequested: Boolean(body.recommendationRequested),
      serviceAnswers: body.serviceAnswers ?? {},
      notes: body.notes ?? null,
    });

    await addRequestProviders(supabase, request.id, body.selectedProviderIds ?? [], Boolean(body.recommendationRequested));
    return json(request);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Request creation failed" }, 500);
  }
});

