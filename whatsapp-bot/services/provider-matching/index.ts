import type { ProviderSearchResult, ProviderSummary } from "../../types/provider.ts";
import type { ServiceCategoryRecord } from "../../types/service.ts";
import { BOT_CONFIG } from "../../config/bot-config.ts";
import { formatCurrency } from "../../utils/formatting.ts";

export type ProviderSearchFilters = {
  categoryId?: string | null;
  categorySlug?: string | null;
  requirementIds?: string[];
  location?: string | null;
  eventDate?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  page?: number;
  limit?: number;
};

function scoreLocation(provider: ProviderSummary, location: string | null): number {
  if (!location) return 0;
  const normalized = location.toLowerCase();
  const pool = [provider.city, provider.secondary_city, ...(provider.service_cities ?? [])]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase());

  if (pool.some((item) => item === normalized)) return 18;
  if (pool.some((item) => item.includes(normalized) || normalized.includes(item))) return 12;
  return 0;
}

function scoreAvailability(provider: ProviderSummary): number {
  const availability = (provider.availability_status ?? "").toLowerCase();
  if (availability.includes("available")) return 10;
  if (availability.includes("limited")) return 4;
  return 0;
}

function scoreRating(provider: ProviderSummary): number {
  return Math.round(Number(provider.rating ?? 0) * 8);
}

function scorePrice(provider: ProviderSummary, filters: ProviderSearchFilters): number {
  if (!provider.base_price) return 0;
  const price = Number(provider.base_price);
  const budgetMin = filters.budgetMin ?? null;
  const budgetMax = filters.budgetMax ?? null;

  if (budgetMax !== null && price <= budgetMax) return 10;
  if (budgetMin !== null && price >= budgetMin * 0.5) return 5;
  return 0;
}

function scorePremium(provider: ProviderSummary): number {
  return provider.is_premium ? 12 : 0;
}

function scoreVerification(provider: ProviderSummary): number {
  return provider.is_verified ? 10 : 0;
}

function scoreServiceMatch(provider: ProviderSummary, categoryId?: string | null): number {
  if (!categoryId) return 0;
  return provider.category_id === categoryId ? 25 : 0;
}

function buildReason(provider: ProviderSummary, filters: ProviderSearchFilters): string {
  const pieces: string[] = [];
  if (provider.is_verified) pieces.push("verified");
  if (provider.is_premium) pieces.push("premium");
  if (provider.rating) pieces.push(`rated ${Number(provider.rating).toFixed(1)}`);
  if (filters.location && scoreLocation(provider, filters.location) > 0) pieces.push(`serves ${filters.location}`);
  if (filters.budgetMax && provider.base_price && provider.base_price <= filters.budgetMax) {
    pieces.push(`fits your ${formatCurrency(filters.budgetMax)} budget cap`);
  }
  return pieces.length ? `Recommended because it is ${pieces.slice(0, 3).join(", ")}.` : "Recommended based on service fit and quality signals.";
}

function matchServices(provider: ProviderSummary, categorySlug: string | null | undefined): string[] {
  const values = [provider.service_type, provider.subcategory, provider.description]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const slug = (categorySlug ?? "").toLowerCase();
  if (!slug) return [];

  return values.filter((value) => value.includes(slug) || slug.includes(value));
}

export function rankProviders(
  providers: ProviderSummary[],
  filters: ProviderSearchFilters,
  categories: ServiceCategoryRecord[] = [],
): ProviderSearchResult[] {
  const category = categories.find((item) => item.id === filters.categoryId || item.slug === filters.categorySlug);

  return providers
    .map((provider) => {
      const matchScore =
        scoreServiceMatch(provider, filters.categoryId) +
        scoreLocation(provider, filters.location ?? null) +
        scoreAvailability(provider) +
        scoreRating(provider) +
        scorePrice(provider, filters) +
        scorePremium(provider) +
        scoreVerification(provider);

      return {
        ...provider,
        match_score: matchScore,
        matched_services: matchServices(provider, category?.slug ?? filters.categorySlug ?? null),
        portfolio_thumbnail: provider.logo_url ?? provider.portfolio_images?.[0] ?? null,
        recommendation_reason: buildReason(provider, filters),
      };
    })
    .sort((left, right) => {
      if (right.match_score !== left.match_score) return right.match_score - left.match_score;
      if (Boolean(right.is_premium) !== Boolean(left.is_premium)) return Number(Boolean(right.is_premium)) - Number(Boolean(left.is_premium));
      return Number(right.rating ?? 0) - Number(left.rating ?? 0);
    });
}

export function paginateProviders<T>(items: T[], page = 1, limit = BOT_CONFIG.defaultPageSize) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const start = (safePage - 1) * safeLimit;
  return {
    page: safePage,
    limit: safeLimit,
    total: items.length,
    hasMore: start + safeLimit < items.length,
    items: items.slice(start, start + safeLimit),
  };
}

