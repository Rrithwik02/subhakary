export const BOT_CONFIG = {
  defaultPageSize: Number(Deno.env.get("BOT_DEFAULT_PAGE_SIZE") ?? "5"),
  maxSelectedProviders: Number(Deno.env.get("BOT_MAX_SELECTED_PROVIDERS") ?? "3"),
  maxPortfolioImages: Number(Deno.env.get("BOT_MAX_PORTFOLIO_IMAGES") ?? "4"),
  source: "whatsapp" as const,
  supportLabel: "Talk to Subhakary",
  recommendationLabel: "Let Subhakary Recommend",
  mainMenu: [
    { id: "find_service", label: "Find a Service" },
    { id: "my_requests", label: "My Requests" },
    { id: "talk_to_subhakary", label: "Talk to Subhakary" },
    { id: "help", label: "Help" },
  ],
  requestStatuses: [
    "NEW",
    "CONTACTED",
    "FOLLOW_UP",
    "CUSTOMER_INTERESTED",
    "PROVIDER_CONTACTED",
    "BOOKED",
    "COMPLETED",
    "CANCELLED",
    "NEEDS_MANUAL_MATCHING",
  ],
  conversationStates: [
    "welcome",
    "main_menu",
    "service_category",
    "requirements",
    "location",
    "event_details",
    "customer_name",
    "provider_results",
    "provider_details",
    "request_review",
    "my_requests",
    "support",
    "help",
  ],
} as const;

export type BotMenuItem = (typeof BOT_CONFIG.mainMenu)[number];

