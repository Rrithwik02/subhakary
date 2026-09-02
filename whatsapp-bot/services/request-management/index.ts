import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { WhatsappRequestRecord, WhatsappRequestType } from "../../types/request.ts";
import { BOT_CONFIG } from "../../config/bot-config.ts";

export type CreateWhatsappRequestInput = {
  customerId: string;
  requestType: WhatsappRequestType;
  status?: WhatsappRequestRecord["status"];
  serviceCategoryId?: string | null;
  serviceCategoryName?: string | null;
  serviceCategorySlug?: string | null;
  locationName?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  budgetRange?: string | null;
  selectedRequirementIds?: string[];
  selectedProviderIds?: string[];
  recommendationRequested?: boolean;
  serviceAnswers?: Record<string, unknown>;
  notes?: string | null;
};

export async function createWhatsappRequest(
  supabase: SupabaseClient,
  input: CreateWhatsappRequestInput,
): Promise<WhatsappRequestRecord> {
  const payload = {
    customer_id: input.customerId,
    request_type: input.requestType,
    status: input.status ?? "NEW",
    source: BOT_CONFIG.source,
    service_category_id: input.serviceCategoryId ?? null,
    service_category_name: input.serviceCategoryName ?? null,
    service_category_slug: input.serviceCategorySlug ?? null,
    location_name: input.locationName ?? null,
    event_type: input.eventType ?? null,
    event_date: input.eventDate ?? null,
    guest_count: input.guestCount ?? null,
    budget_range: input.budgetRange ?? null,
    selected_requirement_ids: input.selectedRequirementIds ?? [],
    selected_provider_ids: input.selectedProviderIds ?? [],
    recommendation_requested: Boolean(input.recommendationRequested),
    service_answers: input.serviceAnswers ?? {},
    notes: input.notes ?? null,
  };

  const { data, error } = await supabase
    .from("whatsapp_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create WhatsApp request: ${error.message}`);
  }

  return data as WhatsappRequestRecord;
}

export async function addRequestProviders(
  supabase: SupabaseClient,
  requestId: string,
  providerIds: string[],
  recommendationRequested = false,
) {
  if (providerIds.length === 0) return;

  const rows = providerIds.map((providerId, index) => ({
    request_id: requestId,
    provider_id: providerId,
    selection_rank: index + 1,
    is_recommended: recommendationRequested,
  }));

  const { error } = await supabase
    .from("whatsapp_request_providers")
    .upsert(rows, { onConflict: "request_id,provider_id" });

  if (error) {
    throw new Error(`Failed to add request providers: ${error.message}`);
  }
}

export async function listRequestsByCustomer(
  supabase: SupabaseClient,
  customerId: string,
): Promise<WhatsappRequestRecord[]> {
  const { data, error } = await supabase
    .from("whatsapp_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list WhatsApp requests: ${error.message}`);
  }

  return (data ?? []) as WhatsappRequestRecord[];
}

