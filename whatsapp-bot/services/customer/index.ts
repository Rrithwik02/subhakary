import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizePhone } from "../../utils/validation.ts";

export async function findWhatsappCustomerByPhone(
  supabase: SupabaseClient,
  phone: string,
) {
  const normalizedPhone = normalizePhone(phone);
  const { data, error } = await supabase
    .from("whatsapp_customers")
    .select("*")
    .eq("normalized_phone", normalizedPhone)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load WhatsApp customer: ${error.message}`);
  }

  return data;
}

export async function findOrCreateWhatsappCustomer(
  supabase: SupabaseClient,
  phone: string,
  displayName?: string | null,
  profileId?: string | null,
) {
  const normalizedPhone = normalizePhone(phone);
  const { data, error } = await supabase
    .from("whatsapp_customers")
    .upsert(
      {
        whatsapp_phone: phone,
        normalized_phone: normalizedPhone,
        display_name: displayName ?? null,
        profile_id: profileId ?? null,
        source: "whatsapp",
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "normalized_phone" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert WhatsApp customer: ${error.message}`);
  }

  return data;
}

