import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ServiceCategoryRecord, ServiceQuestionConfig, WhatsappServiceRequirementRecord } from "../../types/service.ts";

type CatalogQuestion = ServiceQuestionConfig & { service_slug: string };

export async function listWhatsappServices(supabase: SupabaseClient): Promise<ServiceCategoryRecord[]> {
  const { data, error } = await supabase
    .from("whatsapp_services")
    .select("id, category_id, name, slug, description, icon, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load WhatsApp services: ${error.message}`);
  return (data ?? []).map((item) => ({
    id: item.category_id ?? item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    icon: item.icon,
  })) as ServiceCategoryRecord[];
}

export async function listWhatsappQuestions(
  supabase: SupabaseClient,
  serviceSlug: string | null | undefined,
): Promise<ServiceQuestionConfig[]> {
  const query = supabase
    .from("whatsapp_service_questions")
    .select("service_slug, key, label, type, required, sort_order, options")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const genericResult = await query.eq("service_slug", "_generic");
  if (genericResult.error) throw new Error(`Failed to load generic WhatsApp questions: ${genericResult.error.message}`);
  const serviceResult = serviceSlug
    ? await supabase.from("whatsapp_service_questions").select("service_slug, key, label, type, required, sort_order, options").eq("service_slug", serviceSlug).eq("is_active", true).order("sort_order", { ascending: true })
    : { data: [], error: null };
  if (serviceResult.error) throw new Error(`Failed to load WhatsApp questions: ${serviceResult.error.message}`);

  return [...(genericResult.data ?? []), ...(serviceResult.data ?? [])].map((item: CatalogQuestion) => ({
    key: item.key,
    label: item.label,
    type: item.type,
    required: item.required,
    order: item.sort_order,
    options: item.options ?? undefined,
  }));
}

export async function listWhatsappRequirements(
  supabase: SupabaseClient,
  serviceSlug: string,
): Promise<WhatsappServiceRequirementRecord[]> {
  const { data, error } = await supabase
    .from("whatsapp_service_requirements")
    .select("id, service_slug, requirement_id, label, description, sort_order")
    .eq("service_slug", serviceSlug)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load WhatsApp requirements: ${error.message}`);
  return (data ?? []) as WhatsappServiceRequirementRecord[];
}
