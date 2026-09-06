import type { ServiceCategoryRecord, ServiceQuestionConfig, ServiceQuestionType, WhatsappServiceRequirementRecord } from "../../types/service.ts";
import type { SupabaseService } from "../supabase/client.ts";
import type { Json } from "../../types/database.ts";

type CatalogQuestionRow = {
  service_slug: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  sort_order: number;
  options: Json | null;
};

function toQuestionType(value: string): ServiceQuestionType {
  switch (value) {
    case "text":
    case "select":
    case "number":
    case "date":
    case "multiselect":
      return value;
    default:
      throw new Error(`Unsupported WhatsApp question type: ${value}`);
  }
}

function toStringOptions(value: Json | null): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options: string[] = [];
  for (const option of value) {
    if (typeof option !== "string") return undefined;
    options.push(option);
  }
  return options;
}

export async function listWhatsappServices(supabase: SupabaseService): Promise<ServiceCategoryRecord[]> {
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
  supabase: SupabaseService,
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

  return [...(genericResult.data ?? []), ...(serviceResult.data ?? [])].map((item: CatalogQuestionRow) => ({
    key: item.key,
    label: item.label,
    type: toQuestionType(item.type),
    required: item.required,
    order: item.sort_order,
    options: toStringOptions(item.options),
  }));
}

export async function listWhatsappRequirements(
  supabase: SupabaseService,
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
