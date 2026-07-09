export type WeddingType = "traditional" | "destination" | "simple" | "grand";

export type WeddingEventType =
  | "engagement"
  | "haldi"
  | "mehendi"
  | "sangeet"
  | "wedding"
  | "reception"
  | "housewarming"
  | "other";

export interface WeddingEventTemplate {
  type: WeddingEventType;
  label: string;
  budgetPercent: number;
  defaultCategories: Array<{
    slug: string;
    name: string;
    requiredCount: number;
  }>;
  defaultTasks: string[];
}

export const WEDDING_BUDGET_RANGES = [
  { label: "Under INR 5L", value: "under-5l", amount: 500000 },
  { label: "INR 5L - 10L", value: "5l-10l", amount: 1000000 },
  { label: "INR 10L - 20L", value: "10l-20l", amount: 2000000 },
  { label: "INR 20L - 35L", value: "20l-35l", amount: 3500000 },
  { label: "INR 35L+", value: "35l-plus", amount: 5000000 },
] as const;

export const WEDDING_TYPES: Array<{ label: string; value: WeddingType }> = [
  { label: "Traditional", value: "traditional" },
  { label: "Destination", value: "destination" },
  { label: "Simple", value: "simple" },
  { label: "Grand", value: "grand" },
];

export const EVENT_TEMPLATES: WeddingEventTemplate[] = [
  {
    type: "engagement",
    label: "Engagement",
    budgetPercent: 10,
    defaultCategories: [
      { slug: "photography", name: "Photographers", requiredCount: 1 },
      { slug: "decoration", name: "Decorators", requiredCount: 1 },
      { slug: "catering", name: "Caterers", requiredCount: 1 },
      { slug: "makeup", name: "Makeup Artists", requiredCount: 1 },
    ],
    defaultTasks: ["Finalize venue", "Shortlist photographer", "Confirm guest list"],
  },
  {
    type: "haldi",
    label: "Haldi",
    budgetPercent: 8,
    defaultCategories: [
      { slug: "photography", name: "Photographers", requiredCount: 1 },
      { slug: "decoration", name: "Decorators", requiredCount: 1 },
      { slug: "catering", name: "Caterers", requiredCount: 1 },
    ],
    defaultTasks: ["Order flowers", "Confirm haldi decor", "Plan family seating"],
  },
  {
    type: "mehendi",
    label: "Mehendi",
    budgetPercent: 8,
    defaultCategories: [
      { slug: "mehandi", name: "Mehendi Artists", requiredCount: 1 },
      { slug: "photography", name: "Photographers", requiredCount: 1 },
      { slug: "decoration", name: "Decorators", requiredCount: 1 },
      { slug: "catering", name: "Caterers", requiredCount: 1 },
    ],
    defaultTasks: ["Lock mehendi artist", "Finalize favors", "Confirm song list"],
  },
  {
    type: "sangeet",
    label: "Sangeet",
    budgetPercent: 12,
    defaultCategories: [
      { slug: "photography", name: "Photographers", requiredCount: 1 },
      { slug: "event-managers", name: "Event Managers", requiredCount: 1 },
      { slug: "decoration", name: "Decorators", requiredCount: 1 },
      { slug: "catering", name: "Caterers", requiredCount: 1 },
    ],
    defaultTasks: ["Finalize performance lineup", "Book emcee", "Confirm sound check"],
  },
  {
    type: "wedding",
    label: "Wedding",
    budgetPercent: 40,
    defaultCategories: [
      { slug: "photography", name: "Photographers", requiredCount: 1 },
      { slug: "decoration", name: "Decorators", requiredCount: 1 },
      { slug: "catering", name: "Caterers", requiredCount: 1 },
      { slug: "poojari", name: "Poojari", requiredCount: 1 },
      { slug: "makeup", name: "Makeup Artists", requiredCount: 2 },
      { slug: "function-halls", name: "Function Halls", requiredCount: 1 },
    ],
    defaultTasks: ["Book hall", "Confirm rituals", "Print invitations", "Pay hall advance"],
  },
  {
    type: "reception",
    label: "Reception",
    budgetPercent: 18,
    defaultCategories: [
      { slug: "photography", name: "Photographers", requiredCount: 1 },
      { slug: "decoration", name: "Decorators", requiredCount: 1 },
      { slug: "catering", name: "Caterers", requiredCount: 1 },
      { slug: "event-managers", name: "Event Managers", requiredCount: 1 },
      { slug: "function-halls", name: "Function Halls", requiredCount: 1 },
    ],
    defaultTasks: ["Finalize stage design", "Confirm reception menu", "Review arrival flow"],
  },
  {
    type: "housewarming",
    label: "Housewarming",
    budgetPercent: 4,
    defaultCategories: [
      { slug: "poojari", name: "Poojari", requiredCount: 1 },
      { slug: "decoration", name: "Decorators", requiredCount: 1 },
      { slug: "catering", name: "Caterers", requiredCount: 1 },
    ],
    defaultTasks: ["Confirm auspicious muhurat", "Arrange puja samagri", "Invite family elders"],
  },
  {
    type: "other",
    label: "Other",
    budgetPercent: 0,
    defaultCategories: [],
    defaultTasks: ["Define scope", "Set budget", "Assign owners"],
  },
];

export function getBudgetRangeByValue(value: string) {
  return WEDDING_BUDGET_RANGES.find((range) => range.value === value) ?? WEDDING_BUDGET_RANGES[0];
}

export function getEventTemplate(type: string) {
  return EVENT_TEMPLATES.find((event) => event.type === type) ?? EVENT_TEMPLATES[EVENT_TEMPLATES.length - 1];
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function createWeddingTitle(brideName: string, groomName: string) {
  const bride = brideName.trim().split(" ")[0] || "Bride";
  const groom = groomName.trim().split(" ")[0] || "Groom";
  return `${bride} & ${groom}'s Wedding`;
}
