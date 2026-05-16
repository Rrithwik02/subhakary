import { computeTrustInsight } from "@/lib/vendorInsights";
import {
  getEstimatedProviderPrice,
  getStyleAlignment,
  type SimulationBundle,
  type SimulationProvider,
  type SimulationSelection,
  type SimulationTemplate,
} from "@/lib/weddingSimulation";
import { normalizePlanningCategory } from "@/lib/weddingPlanning";

type ShortlistInput = {
  lane: string;
  providers: SimulationProvider[];
  bundles: SimulationBundle[];
  weddingStyle?: string | null;
  totalBudget?: number | null;
  budgetCap?: number | null;
  priorities?: string[] | null;
};

export type AiShortlistCandidate = {
  provider: SimulationProvider;
  estimatedPrice: number;
  bundleName?: string | null;
  trustLabel: string;
  confidence: number;
  reason: string;
  whyNot?: string;
};

export type AiShortlistResult = {
  lane: string;
  budgetCap: number | null;
  summary: string;
  candidates: AiShortlistCandidate[];
};

type RebalanceInput = {
  selectedProviders: Record<string, string>;
  providers: SimulationProvider[];
  bundles: SimulationBundle[];
  totalBudget?: number | null;
  weddingStyle?: string | null;
  priorities?: string[] | null;
  template: SimulationTemplate;
};

export type AiRebalanceChange = {
  lane: string;
  fromProvider: string;
  toProvider: string;
  savings: number;
  reason: string;
};

export type AiRebalanceResult = {
  projectedSelections: Record<string, string>;
  projectedTotal: number;
  savedAmount: number;
  withinBudget: boolean;
  confidence: number;
  summary: string;
  changes: AiRebalanceChange[];
};

const PRIORITY_TO_LANE: Record<string, string> = {
  photography: "Photography",
  decor: "Decor",
  catering: "Catering",
  venue: "Venue",
  makeup: "Makeup and Mehndi",
  mehndi: "Makeup and Mehndi",
  "music/dj": "Music and Entertainment",
  music: "Music and Entertainment",
  dj: "Music and Entertainment",
  pandit: "Pandit",
};

const toPriorityLane = (priority: string) => PRIORITY_TO_LANE[priority.toLowerCase()] || priority;

const getPriorityWeight = (lane: string, priorities?: string[] | null) =>
  (priorities || []).map(toPriorityLane).includes(lane) ? 1.25 : 1;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getLaneTargetBudget = ({
  lane,
  totalBudget,
  template,
  priorities,
}: {
  lane: string;
  totalBudget?: number | null;
  template: SimulationTemplate;
  priorities?: string[] | null;
}) => {
  if (!totalBudget) return null;
  const base = totalBudget * (template.weights[lane] || 0.08);
  const weighted = base * getPriorityWeight(lane, priorities);
  return Math.round(weighted);
};

export const shortlistProvidersForLane = ({
  lane,
  providers,
  bundles,
  weddingStyle,
  totalBudget,
  budgetCap,
  priorities,
  template,
}: ShortlistInput & { template: SimulationTemplate }): AiShortlistResult => {
  const laneCap = budgetCap || getLaneTargetBudget({ lane, totalBudget, template, priorities });
  const candidates = providers
    .filter((provider) => normalizePlanningCategory(provider.category?.name) === lane)
    .map((provider) => {
      const price = getEstimatedProviderPrice({ provider, bundles });
      const styleScore = getStyleAlignment({ provider, weddingStyle });
      const trust = computeTrustInsight({
        isVerified: (provider as { is_verified?: boolean | null }).is_verified,
        isPremium: (provider as { is_premium?: boolean | null }).is_premium,
        rating: provider.rating,
        totalReviews: provider.total_reviews,
        experienceYears: (provider as { experience_years?: number | null }).experience_years,
      });
      const priceScore =
        !laneCap || !price.estimatedPrice
          ? 62
          : price.estimatedPrice <= laneCap
            ? 92
            : price.estimatedPrice <= laneCap * 1.15
              ? 68
              : 35;
      const confidence = clamp(
        45 +
          (price.estimatedPrice > 0 ? 18 : 0) +
          (provider.total_reviews ? Math.min(12, provider.total_reviews / 2) : 0) +
          (provider.specializations?.length ? 10 : 0) +
          (styleScore >= 80 ? 10 : 0),
        45,
        94,
      );
      const score = styleScore * 0.34 + trust.score * 0.28 + priceScore * 0.24 + (provider.rating || 0) * 2.8;
      const fitsCap = laneCap ? price.estimatedPrice <= laneCap : true;
      const reasonParts = [
        fitsCap && laneCap ? `Fits the Rs ${laneCap.toLocaleString("en-IN")} lane target` : null,
        styleScore >= 80 ? `Strong ${weddingStyle || "wedding"} style match` : styleScore >= 68 ? "Reasonable style fit" : null,
        trust.label === "Excellent proof" ? "High proof profile" : trust.label === "Strong proof" ? "Solid trust signals" : null,
      ].filter(Boolean);
      const whyNot =
        laneCap && price.estimatedPrice > laneCap
          ? `Above the current lane budget by about Rs ${(price.estimatedPrice - laneCap).toLocaleString("en-IN")}.`
          : trust.label === "Building proof"
            ? "Still needs a bit more proof before it feels low-risk."
            : undefined;

      return {
        provider,
        estimatedPrice: price.estimatedPrice,
        bundleName: price.bundleName,
        trustLabel: trust.label,
        confidence,
        reason: reasonParts.join(". ") || "Balanced mix of fit, proof, and pricing.",
        whyNot,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    lane,
    budgetCap: laneCap,
    summary: candidates.length
      ? `Picked the top ${candidates.length} ${lane.toLowerCase()} options using style fit, trust signals, and lane budget discipline.`
      : `No strong ${lane.toLowerCase()} options surfaced yet for this plan.`,
    candidates,
  };
};

export const rebalanceWeddingPlan = ({
  selectedProviders,
  providers,
  bundles,
  totalBudget,
  weddingStyle,
  priorities,
  template,
}: RebalanceInput): AiRebalanceResult => {
  const currentSelections = Object.entries(selectedProviders).flatMap(([lane, providerId]) => {
    const provider = providers.find((item) => item.id === providerId);
    if (!provider) return [];
    const price = getEstimatedProviderPrice({ provider, bundles });
    return [{
      lane,
      provider,
      estimatedPrice: price.estimatedPrice,
      source: price.source,
      bundleName: price.bundleName,
    } satisfies SimulationSelection];
  });

  const currentTotal = currentSelections.reduce((sum, selection) => sum + selection.estimatedPrice, 0);
  const targetBudget = totalBudget || currentTotal;

  if (currentTotal <= targetBudget) {
    return {
      projectedSelections: selectedProviders,
      projectedTotal: currentTotal,
      savedAmount: 0,
      withinBudget: true,
      confidence: 86,
      summary: "Your current build is already inside the budget target, so no rebalance was needed.",
      changes: [],
    };
  }

  const nextSelections = { ...selectedProviders };
  const changes: AiRebalanceChange[] = [];
  let projectedTotal = currentTotal;

  const lanesBySwapPotential = currentSelections
    .map((selection) => {
      const laneCandidates = providers
        .filter((provider) => normalizePlanningCategory(provider.category?.name) === selection.lane && provider.id !== selection.provider.id)
        .map((provider) => {
          const price = getEstimatedProviderPrice({ provider, bundles });
          const styleScore = getStyleAlignment({ provider, weddingStyle });
          const trust = computeTrustInsight({
            isVerified: (provider as { is_verified?: boolean | null }).is_verified,
            isPremium: (provider as { is_premium?: boolean | null }).is_premium,
            rating: provider.rating,
            totalReviews: provider.total_reviews,
            experienceYears: (provider as { experience_years?: number | null }).experience_years,
          });
          return {
            provider,
            estimatedPrice: price.estimatedPrice,
            savings: selection.estimatedPrice - price.estimatedPrice,
            score:
              trust.score * 0.4 +
              styleScore * 0.4 +
              clamp(100 - Math.max(0, selection.estimatedPrice - price.estimatedPrice) / 1000, 35, 100) * 0.2,
          };
        })
        .filter((candidate) => candidate.savings > 0)
        .sort((a, b) => {
          const laneWeight = getPriorityWeight(selection.lane, priorities);
          const qualityPenaltyA = a.score / laneWeight;
          const qualityPenaltyB = b.score / laneWeight;
          return (b.savings + qualityPenaltyB * 20) - (a.savings + qualityPenaltyA * 20);
        });

      return {
        selection,
        alternatives: laneCandidates,
        protectedLane: getPriorityWeight(selection.lane, priorities) > 1,
      };
    })
    .sort((a, b) => {
      if (a.protectedLane !== b.protectedLane) return a.protectedLane ? 1 : -1;
      return b.selection.estimatedPrice - a.selection.estimatedPrice;
    });

  lanesBySwapPotential.forEach((lanePlan) => {
    if (projectedTotal <= targetBudget) return;
    const alternative = lanePlan.alternatives[0];
    if (!alternative) return;

    nextSelections[lanePlan.selection.lane] = alternative.provider.id;
    projectedTotal -= alternative.savings;
    changes.push({
      lane: lanePlan.selection.lane,
      fromProvider: lanePlan.selection.provider.business_name,
      toProvider: alternative.provider.business_name,
      savings: alternative.savings,
      reason: lanePlan.protectedLane
        ? "Even after protecting your priorities, this lane had the cleanest savings without collapsing fit."
        : "This lane was the most expensive relative to the rest of the plan, so it was the best place to save first.",
    });
  });

  const savedAmount = currentTotal - projectedTotal;
  const withinBudget = projectedTotal <= targetBudget;

  return {
    projectedSelections: nextSelections,
    projectedTotal,
    savedAmount,
    withinBudget,
    confidence: clamp(72 + Math.min(18, changes.length * 6), 70, 92),
    summary: withinBudget
      ? `Rebalanced the build by saving Rs ${Math.round(savedAmount).toLocaleString("en-IN")} without touching the core shape of the wedding.`
      : `Found Rs ${Math.round(savedAmount).toLocaleString("en-IN")} in savings, but you may still need a smaller guest scope or a lower target budget in one major lane.`,
    changes,
  };
};
