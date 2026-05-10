import { VENDOR_LANES, normalizePlanningCategory } from "@/lib/weddingPlanning";

export type SimulationProvider = {
  id: string;
  business_name: string;
  category?: { name?: string | null } | null;
  base_price?: number | null;
  rating?: number | null;
  total_reviews?: number | null;
  city?: string | null;
  specializations?: string[] | null;
  portfolio_tags?: { label?: string; wedding_type?: string; budget?: string; size?: string }[] | null;
  url_slug?: string | null;
};

export type SimulationBundle = {
  id: string;
  provider_id: string;
  bundle_name: string;
  discounted_price: number;
  max_guests?: number | null;
};

export type SimulationSelection = {
  lane: string;
  provider: SimulationProvider;
  estimatedPrice: number;
  source: "bundle" | "base_price";
  bundleName?: string | null;
};

export type SimulationTemplate = {
  id: string;
  name: string;
  description: string;
  minBudget: number;
  maxBudget: number;
  style: string[];
  weights: Record<string, number>;
};

export const SIMULATION_TEMPLATES: SimulationTemplate[] = [
  {
    id: "traditional-3l",
    name: "₹3L Traditional Wedding",
    description: "Lean traditional setup focused on ceremony essentials, strong photo coverage, and practical catering.",
    minBudget: 200000,
    maxBudget: 400000,
    style: ["traditional", "royal"],
    weights: {
      Venue: 0.25,
      Catering: 0.24,
      Photography: 0.18,
      Decor: 0.12,
      "Makeup and Mehndi": 0.09,
      "Music and Entertainment": 0.06,
      Pandit: 0.06,
    },
  },
  {
    id: "minimal-8l",
    name: "₹8L Premium Minimal Wedding",
    description: "Higher-spend build that prioritizes venue quality, polished decor, and stronger visual consistency.",
    minBudget: 550000,
    maxBudget: 1000000,
    style: ["modern", "minimalist", "destination"],
    weights: {
      Venue: 0.28,
      Catering: 0.2,
      Photography: 0.16,
      Decor: 0.18,
      "Makeup and Mehndi": 0.08,
      "Music and Entertainment": 0.05,
      Pandit: 0.05,
    },
  },
  {
    id: "intimate-5l",
    name: "₹5L Intimate Story-First Wedding",
    description: "Balanced build with more room for decor and photography while keeping guest flow manageable.",
    minBudget: 350000,
    maxBudget: 650000,
    style: ["intimate", "traditional", "modern"],
    weights: {
      Venue: 0.24,
      Catering: 0.2,
      Photography: 0.2,
      Decor: 0.16,
      "Makeup and Mehndi": 0.08,
      "Music and Entertainment": 0.06,
      Pandit: 0.06,
    },
  },
];

export const getTemplateForWedding = ({
  totalBudget,
  weddingStyle,
}: {
  totalBudget?: number | null;
  weddingStyle?: string | null;
}) => {
  const style = (weddingStyle || "").toLowerCase();
  return (
    SIMULATION_TEMPLATES.find(
      (template) =>
        (!!totalBudget ? totalBudget >= template.minBudget && totalBudget <= template.maxBudget : true) &&
        (!style || template.style.includes(style)),
    ) ||
    SIMULATION_TEMPLATES.find((template) =>
      !!totalBudget ? totalBudget >= template.minBudget && totalBudget <= template.maxBudget : false,
    ) ||
    SIMULATION_TEMPLATES[0]
  );
};

export const getEstimatedProviderPrice = ({
  provider,
  bundles,
}: {
  provider: SimulationProvider;
  bundles: SimulationBundle[];
}) => {
  const providerBundles = bundles
    .filter((bundle) => bundle.provider_id === provider.id)
    .sort((a, b) => a.discounted_price - b.discounted_price);
  if (providerBundles[0]) {
    return {
      estimatedPrice: providerBundles[0].discounted_price,
      source: "bundle" as const,
      bundleName: providerBundles[0].bundle_name,
    };
  }
  return {
    estimatedPrice: provider.base_price || 0,
    source: "base_price" as const,
    bundleName: null,
  };
};

export const getStyleAlignment = ({
  provider,
  weddingStyle,
}: {
  provider: SimulationProvider;
  weddingStyle?: string | null;
}) => {
  const target = (weddingStyle || "").toLowerCase();
  if (!target) return 60;

  const terms = [
    ...(provider.specializations || []),
    ...(provider.portfolio_tags || []).flatMap((tag) => [tag.label, tag.wedding_type, tag.budget, tag.size].filter(Boolean) as string[]),
  ]
    .join(" ")
    .toLowerCase();

  if (!terms) return 55;
  if (terms.includes(target)) return 88;
  if (target === "traditional" && (terms.includes("royal") || terms.includes("temple") || terms.includes("classic"))) return 80;
  if (target === "modern" && (terms.includes("minimal") || terms.includes("contemporary"))) return 80;
  if (target === "intimate" && (terms.includes("small") || terms.includes("boutique"))) return 78;
  return 62;
};

export const buildSimulationSelections = ({
  providers,
  bundles,
  weddingStyle,
}: {
  providers: SimulationProvider[];
  bundles: SimulationBundle[];
  weddingStyle?: string | null;
}) => {
  const selections: SimulationSelection[] = [];

  VENDOR_LANES.forEach((lane) => {
    const candidates = providers
      .filter((provider) => normalizePlanningCategory(provider.category?.name) === lane.label)
      .map((provider) => {
        const price = getEstimatedProviderPrice({ provider, bundles });
        return {
          provider,
          ...price,
          styleAlignment: getStyleAlignment({ provider, weddingStyle }),
          score:
            (provider.rating || 0) * 12 +
            (provider.total_reviews || 0) * 0.4 +
            (price.estimatedPrice > 0 ? 30 : 0) +
            getStyleAlignment({ provider, weddingStyle }),
        };
      })
      .sort((a, b) => b.score - a.score);

    if (candidates[0]) {
      selections.push({
        lane: lane.label,
        provider: candidates[0].provider,
        estimatedPrice: candidates[0].estimatedPrice,
        source: candidates[0].source,
        bundleName: candidates[0].bundleName,
      });
    }
  });

  return selections;
};

export const computeSimulationSummary = ({
  selections,
  totalBudget,
  weddingStyle,
  template,
}: {
  selections: SimulationSelection[];
  totalBudget?: number | null;
  weddingStyle?: string | null;
  template: SimulationTemplate;
}) => {
  const totalCost = selections.reduce((sum, selection) => sum + selection.estimatedPrice, 0);
  const remainingBudget = (totalBudget || 0) - totalCost;
  const budgetFit =
    !totalBudget || totalBudget <= 0
      ? "Set budget"
      : remainingBudget >= 0
        ? "Within budget"
        : "Over budget";

  const styleScore = selections.length
    ? Math.round(
        selections.reduce((sum, selection) => sum + getStyleAlignment({ provider: selection.provider, weddingStyle }), 0) /
          selections.length,
      )
    : 0;

  const categoryBreakdown = VENDOR_LANES.map((lane) => {
    const selection = selections.find((item) => item.lane === lane.label);
    const amount = selection?.estimatedPrice || 0;
    return {
      lane: lane.label,
      amount,
      share: totalCost > 0 ? amount / totalCost : 0,
      targetShare: template.weights[lane.label] || 0,
      providerName: selection?.provider.business_name || null,
    };
  }).filter((row) => row.amount > 0 || row.targetShare > 0);

  return {
    totalCost,
    remainingBudget,
    budgetFit,
    styleScore,
    coverage: selections.length / VENDOR_LANES.length,
    categoryBreakdown,
  };
};
