import type { ProviderSearchResult } from "../types/provider.ts";

export function renderProviderDetails(provider: ProviderSearchResult, selectedRequirements: string[]) {
  return {
    text: [
      `${provider.business_name}`,
      `⭐ ${Number(provider.rating ?? 0).toFixed(1)}`,
      `📍 ${provider.city ?? "Location not listed"}`,
      `Services: ${provider.matched_services.length ? provider.matched_services.join(" • ") : "Available on request"}`,
      `Your selected requirements: ${selectedRequirements.length ? selectedRequirements.join(" • ") : "None yet"}`,
    ].join("\n"),
    portfolio: provider.portfolio_thumbnail,
  };
}

