import type { ProviderSearchResult } from "../types/provider.ts";
import type { WhatsappRequestRecord } from "../types/request.ts";
import { BOT_CONFIG } from "../config/bot-config.ts";

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatProviderCard(provider: ProviderSearchResult): string {
  const location = provider.city ?? provider.secondary_city ?? "Location not listed";
  const services = provider.matched_services.length ? provider.matched_services.join(" • ") : "Services matched";
  return [
    provider.is_premium ? "🏆" : "📸",
    provider.business_name,
    `⭐ ${Number(provider.rating ?? 0).toFixed(1)}`,
    `📍 ${location}`,
    services,
  ].join("\n");
}

export function formatRequestSummary(request: WhatsappRequestRecord): string {
  const selectedProviders = request.selected_provider_ids.length
    ? request.selected_provider_ids.map((providerId, index) => `${index + 1}. ${providerId}`).join("\n")
    : "None";

  return [
    `Request ID: ${request.request_code}`,
    `Service: ${request.service_category_name ?? "Support"}`,
    `Status: ${request.status}`,
    `Source: ${BOT_CONFIG.source}`,
    `Selected Providers:\n${selectedProviders}`,
  ].join("\n");
}

