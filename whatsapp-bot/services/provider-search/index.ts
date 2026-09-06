import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ProviderSearchResult, ProviderSummary } from "../../types/provider.ts";
import type { ServiceCategoryRecord } from "../../types/service.ts";
import { BOT_CONFIG } from "../../config/bot-config.ts";
import { paginateProviders, rankProviders, type ProviderSearchFilters } from "../provider-matching/index.ts";
import { listWhatsappServices } from "../catalog/index.ts";
import { safeMediaUrls } from "../../utils/security.ts";

export async function listServiceCategories(
  supabase: SupabaseClient,
): Promise<ServiceCategoryRecord[]> {
  return listWhatsappServices(supabase);
}

export async function searchProviders(
  supabase: SupabaseClient,
  filters: ProviderSearchFilters,
): Promise<{
  providers: ProviderSearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  categories: ServiceCategoryRecord[];
}> {
  const categories = await listServiceCategories(supabase);
  const serviceQuery = supabase
    .from("service_providers")
    .select(
      [
        "id",
        "business_name",
        "city",
        "secondary_city",
        "service_cities",
        "description",
        "rating",
        "total_reviews",
        "is_verified",
        "is_premium",
        "base_price",
        "category_id",
        "service_type",
        "subcategory",
        "portfolio_images",
        "logo_url",
        "url_slug",
        "availability_status",
      ].join(","),
    )
    .eq("status", "approved");

  if (filters.categoryId) {
    serviceQuery.eq("category_id", filters.categoryId);
  }

  if (filters.location) {
    serviceQuery.or(
      `city.ilike.%${filters.location}%,secondary_city.ilike.%${filters.location}%,service_cities.cs.{${filters.location}}`,
    );
  }

  const { data, error } = await serviceQuery.limit(200);

  if (error) {
    throw new Error(`Failed to search providers: ${error.message}`);
  }

  const ranked = rankProviders((data ?? []) as ProviderSummary[], filters, categories);
  const page = filters.page ?? 1;
  const limit = filters.limit ?? BOT_CONFIG.defaultPageSize;
  const paginated = paginateProviders(ranked, page, limit);
  const publicProviders = paginated.items.map((provider) => ({
    id: provider.id,
    business_name: provider.business_name,
    city: provider.city ?? null,
    rating: provider.rating ?? null,
    total_reviews: provider.total_reviews ?? null,
    is_verified: provider.is_verified ?? false,
    is_premium: provider.is_premium ?? false,
    category_id: provider.category_id ?? null,
    service_type: provider.service_type ?? null,
    subcategory: provider.subcategory ?? null,
    portfolio_thumbnail: safeMediaUrls([provider.portfolio_thumbnail, provider.logo_url, ...(provider.portfolio_images ?? [])], 1)[0] ?? null,
    match_score: provider.match_score,
    recommendation_reason: provider.recommendation_reason,
    matched_services: provider.matched_services,
  }));

  return {
    providers: publicProviders,
    total: paginated.total,
    page: paginated.page,
    limit: paginated.limit,
    hasMore: paginated.hasMore,
    categories,
  };
}

export async function getProviderDetails(
  supabase: SupabaseClient,
  providerId: string,
): Promise<Record<string, unknown>> {
  const { data: provider, error } = await supabase
    .from("service_providers")
    .select(
      [
        "id",
        "business_name",
        "description",
        "city",
        "secondary_city",
        "service_cities",
        "rating",
        "total_reviews",
        "is_verified",
        "is_premium",
        "service_type",
        "subcategory",
        "category_id",
        "portfolio_images",
        "logo_url",
        "url_slug",
      ].join(","),
    )
    .eq("id", providerId)
    .eq("status", "approved")
    .single();

  if (error) {
    throw new Error(`Failed to fetch provider details: ${error.message}`);
  }

  const { data: services } = await supabase
    .from("additional_services")
    .select("id, service_type, description, min_price, max_price, subcategory, specialization")
    .eq("provider_id", providerId)
    .limit(10);

  const { data: availability } = await supabase
    .from("service_provider_availability")
    .select("id, day_of_week, start_time, end_time, is_available, specific_date, is_blocked")
    .eq("provider_id", providerId)
    .order("specific_date", { ascending: false })
    .limit(7);

  return {
    provider: {
      id: provider.id,
      business_name: provider.business_name,
      description: provider.description,
      city: provider.city,
      secondary_city: provider.secondary_city,
      service_cities: provider.service_cities,
      rating: provider.rating,
      total_reviews: provider.total_reviews,
      is_verified: provider.is_verified,
      is_premium: provider.is_premium,
      service_type: provider.service_type,
      subcategory: provider.subcategory,
      category_id: provider.category_id,
      portfolio_images: safeMediaUrls(provider.portfolio_images),
      logo_url: safeMediaUrls([provider.logo_url], 1)[0] ?? null,
      url_slug: provider.url_slug,
    },
    additional_services: services ?? [],
    availability: availability ?? [],
  };
}
