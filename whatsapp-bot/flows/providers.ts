import type { ProviderSearchResult } from "../types/provider.ts";
import { formatProviderCard } from "../utils/formatting.ts";

export function renderProviderBatch(providers: ProviderSearchResult[], page: number, hasMore: boolean) {
  return {
    text: providers.length
      ? `Showing recommended providers ${page}`
      : "No provider matches right now.",
    cards: providers.map((provider) => formatProviderCard(provider)),
    hasMore,
  };
}

