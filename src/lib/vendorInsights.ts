type ProviderLike = {
  id: string;
  city?: string | null;
  category_id?: string | null;
  base_price?: number | null;
  business_name?: string | null;
};

type WeddingFitContext = {
  totalBudget?: number | null;
  city?: string | null;
  plannedCategoryBudget?: number | null;
};

export type PriceBenchmark = {
  low: number | null;
  high: number | null;
  median: number | null;
  label: "Great deal" | "Fair price" | "Premium pricing" | "Contact for quote";
  detail: string;
};

export type BudgetFit = {
  label: "YES" | "STRETCH" | "NO" | "UNKNOWN";
  detail: string;
};

export type TrustInsight = {
  score: number;
  label: "Excellent proof" | "Strong proof" | "Building proof";
  summary: string;
  highlights: string[];
  concerns: string[];
};

export type ProviderBookingSignal = {
  status?: string | null;
  service_date?: string | null;
  completion_confirmed_by_customer?: boolean | null;
  completion_confirmed_by_provider?: boolean | null;
  completion_status?: string | null;
  cancelled_at?: string | null;
};

export type ReliabilityInsight = {
  score: number;
  label: "Highly reliable" | "Reliable" | "Emerging";
  summary: string;
  completedCount: number;
  acceptedCount: number;
  recentSuccessCount: number;
  cancellationRate: number;
  platformProof: string;
  strengths: string[];
  cautions: string[];
};

const categoryShareFallback = (categoryName?: string | null) => {
  const value = (categoryName || "").toLowerCase();
  if (value.includes("venue") || value.includes("hall")) return 0.3;
  if (value.includes("cater")) return 0.22;
  if (value.includes("photo") || value.includes("video")) return 0.16;
  if (value.includes("decor")) return 0.14;
  if (value.includes("makeup") || value.includes("mehndi")) return 0.08;
  if (value.includes("music") || value.includes("dj") || value.includes("band")) return 0.06;
  return 0.1;
};

const percentile = (values: number[], target: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(target * (sorted.length - 1))));
  return sorted[index];
};

export const computePriceBenchmark = (
  provider: ProviderLike,
  providers: ProviderLike[],
): PriceBenchmark => {
  const scoped = providers.filter(
    (candidate) =>
      candidate.category_id === provider.category_id &&
      candidate.base_price &&
      (!provider.city || candidate.city?.toLowerCase() === provider.city?.toLowerCase()),
  );
  const prices = scoped.map((candidate) => Number(candidate.base_price)).filter((value) => Number.isFinite(value));
  if (!provider.base_price || prices.length < 3) {
    return {
      low: null,
      high: null,
      median: null,
      label: provider.base_price ? "Fair price" : "Contact for quote",
      detail: provider.base_price
        ? "There is not enough same-city pricing data yet, so this is treated as a neutral benchmark."
        : "The provider has not shared a starting price yet.",
    };
  }

  const low = percentile(prices, 0.25);
  const high = percentile(prices, 0.75);
  const median = percentile(prices, 0.5);
  const amount = Number(provider.base_price);

  const label =
    low !== null && amount < low
      ? "Great deal"
      : high !== null && amount > high
        ? "Premium pricing"
        : "Fair price";
  const detail =
    label === "Great deal"
      ? `Priced below the usual ${Math.round(low ?? amount).toLocaleString("en-IN")}-${Math.round(high ?? amount).toLocaleString("en-IN")} range for this lane.`
      : label === "Premium pricing"
        ? `Priced above the usual ${Math.round(low ?? amount).toLocaleString("en-IN")}-${Math.round(high ?? amount).toLocaleString("en-IN")} range for this lane.`
        : `Sits inside the usual ${Math.round(low ?? amount).toLocaleString("en-IN")}-${Math.round(high ?? amount).toLocaleString("en-IN")} range for this lane.`;

  return { low, high, median, label, detail };
};

export const computeBudgetFit = ({
  providerPrice,
  categoryName,
  context,
}: {
  providerPrice?: number | null;
  categoryName?: string | null;
  context?: WeddingFitContext | null;
}): BudgetFit => {
  if (!providerPrice || !context) {
    return { label: "UNKNOWN", detail: "Add your wedding budget to score fit." };
  }

  const ceiling =
    context.plannedCategoryBudget && context.plannedCategoryBudget > 0
      ? context.plannedCategoryBudget
      : context.totalBudget
        ? context.totalBudget * categoryShareFallback(categoryName)
        : null;

  if (!ceiling) {
    return { label: "UNKNOWN", detail: "Set a category or total budget to score fit." };
  }

  const ratio = providerPrice / ceiling;
  if (ratio <= 0.95) {
    return { label: "YES", detail: `Fits comfortably inside your ${Math.round(ceiling).toLocaleString("en-IN")} planning target.` };
  }
  if (ratio <= 1.2) {
    return { label: "STRETCH", detail: `Possible, but it will stretch this category beyond the current plan.` };
  }
  return { label: "NO", detail: `This is well above the current budget target for this lane.` };
};

export const computeTrustInsight = ({
  isVerified,
  isPremium,
  rating,
  totalReviews,
  experienceYears,
  responseTimeHours,
  publishedPackages,
  packagesWithDisclosure,
  storyCount,
}: {
  isVerified?: boolean | null;
  isPremium?: boolean | null;
  rating?: number | null;
  totalReviews?: number | null;
  experienceYears?: number | null;
  responseTimeHours?: number | null;
  publishedPackages?: number | null;
  packagesWithDisclosure?: number | null;
  storyCount?: number | null;
}): TrustInsight => {
  const highlights: string[] = [];
  const concerns: string[] = [];

  let score = 34;

  if (isVerified) {
    score += 18;
    highlights.push("Verified profile");
  } else {
    concerns.push("Not verified yet");
  }

  if (isPremium) {
    score += 6;
    highlights.push("Premium listing");
  }

  if (typeof rating === "number" && rating > 0) {
    score += Math.min(15, Math.round((rating / 5) * 15));
    if (rating >= 4.7) highlights.push("Excellent average rating");
    else if (rating < 4) concerns.push("Rating trend is not especially strong");
  } else {
    concerns.push("No rating history yet");
  }

  if (typeof totalReviews === "number" && totalReviews > 0) {
    score += Math.min(12, Math.round(Math.log10(totalReviews + 1) * 8));
    if (totalReviews >= 20) highlights.push("Healthy review volume");
    else if (totalReviews < 5) concerns.push("Limited review history");
  } else {
    concerns.push("No review proof yet");
  }

  if (typeof experienceYears === "number" && experienceYears > 0) {
    score += Math.min(8, Math.round(experienceYears / 2));
    if (experienceYears >= 5) highlights.push("Experienced operator");
  }

  if (typeof responseTimeHours === "number" && responseTimeHours > 0) {
    if (responseTimeHours <= 6) {
      score += 5;
      highlights.push("Fast stated response time");
    } else if (responseTimeHours <= 24) {
      score += 3;
      highlights.push("Reasonable response time");
    } else {
      concerns.push("Slow stated response time");
    }
  } else {
    concerns.push("No response-time commitment shared");
  }

  if (typeof publishedPackages === "number" && publishedPackages > 0) {
    score += Math.min(5, publishedPackages);
    highlights.push("Structured packages published");
  } else {
    concerns.push("No structured packages published");
  }

  if (typeof packagesWithDisclosure === "number" && packagesWithDisclosure > 0) {
    score += Math.min(5, packagesWithDisclosure * 2);
    highlights.push("Scope and terms disclosed");
  } else {
    concerns.push("Package terms are still thin");
  }

  if (typeof storyCount === "number" && storyCount > 0) {
    score += Math.min(4, storyCount * 2);
    highlights.push("Real wedding proof shared");
  }

  score = Math.max(18, Math.min(100, score));

  const label =
    score >= 80 ? "Excellent proof" : score >= 62 ? "Strong proof" : "Building proof";
  const summary =
    label === "Excellent proof"
      ? "This profile has enough visible proof to feel low-friction for decision-making."
      : label === "Strong proof"
        ? "This provider looks solid, with a few areas you should still validate in chat."
        : "There are promising signals here, but you will want to confirm scope and operating reliability."
  ;

  return {
    score,
    label,
    summary,
    highlights: highlights.slice(0, 4),
    concerns: concerns.slice(0, 3),
  };
};

export const buildTradeoffNotes = ({
  benchmark,
  budgetFit,
  trust,
  responseTimeHours,
  packageCount,
}: {
  benchmark: PriceBenchmark;
  budgetFit: BudgetFit;
  trust: TrustInsight;
  responseTimeHours?: number | null;
  packageCount?: number | null;
}) => {
  const notes: string[] = [];

  if (budgetFit.label === "YES" && benchmark.label === "Great deal") {
    notes.push("Strong value against your current plan.");
  } else if (budgetFit.label === "NO") {
    notes.push("This will likely push the category over plan unless you rebalance elsewhere.");
  } else if (benchmark.label === "Premium pricing") {
    notes.push("You are paying a premium, so the proof and package clarity should justify it.");
  }

  if (trust.score >= 80) {
    notes.push("Operational trust signals are unusually strong for a marketplace profile.");
  } else if (trust.score < 62) {
    notes.push("Ask for a tighter scope, references, and written terms before deciding.");
  }

  if (!responseTimeHours) {
    notes.push("Reply speed is unclear, which matters if you need a quick lock-in.");
  } else if (responseTimeHours > 24) {
    notes.push("Response timing may feel slow if you're comparing active shortlists.");
  }

  if (!packageCount) {
    notes.push("Expect more back-and-forth because pricing still depends on custom scoping.");
  }

  return notes.slice(0, 3);
};

export const computeReliabilityInsight = ({
  bookings,
  responseTimeHours,
  trust,
}: {
  bookings?: ProviderBookingSignal[] | null;
  responseTimeHours?: number | null;
  trust?: TrustInsight | null;
}): ReliabilityInsight => {
  const allBookings = bookings || [];
  const completedCount = allBookings.filter((booking) => booking.status === "completed").length;
  const acceptedCount = allBookings.filter((booking) => ["accepted", "completed"].includes(booking.status || "")).length;
  const cancelledCount = allBookings.filter((booking) => booking.status === "cancelled" || booking.cancelled_at).length;
  const recentSuccessCount = allBookings.filter((booking) => {
    if (booking.status !== "completed" || !booking.service_date) return false;
    const serviceDate = new Date(booking.service_date);
    if (Number.isNaN(serviceDate.getTime())) return false;
    const daysAgo = (Date.now() - serviceDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 180;
  }).length;
  const cancellationRate = acceptedCount > 0 ? cancelledCount / Math.max(acceptedCount + cancelledCount, 1) : 0;

  const strengths: string[] = [];
  const cautions: string[] = [];
  let score = 40 + Math.min(20, completedCount * 2) + Math.min(12, recentSuccessCount * 3);

  if (acceptedCount >= 5) strengths.push("Healthy volume of tracked bookings");
  if (completedCount >= 10) strengths.push("Substantial completion history");
  if (recentSuccessCount >= 3) strengths.push("Recent successful weddings on platform");

  if (cancellationRate <= 0.08 && acceptedCount >= 3) {
    score += 10;
    strengths.push("Low cancellation trend");
  } else if (cancellationRate >= 0.2) {
    score -= 10;
    cautions.push("Cancellation trend is worth checking");
  }

  if (responseTimeHours && responseTimeHours <= 6) {
    score += 6;
    strengths.push("Fast stated response rhythm");
  } else if (!responseTimeHours) {
    cautions.push("Reply expectations are still unclear");
  }

  if (trust) {
    score += Math.round((trust.score - 50) * 0.18);
  }

  if (!completedCount) {
    cautions.push("No completed bookings visible on platform yet");
  }
  if (acceptedCount < 3) {
    cautions.push("Operational history is still thin");
  }

  score = Math.max(25, Math.min(100, score));

  const label =
    score >= 80 ? "Highly reliable" : score >= 62 ? "Reliable" : "Emerging";
  const summary =
    label === "Highly reliable"
      ? "This vendor shows strong follow-through and enough tracked history to feel dependable."
      : label === "Reliable"
        ? "This vendor looks steady, though a couple of operating details may still need confirmation."
        : "This vendor may still be good, but the platform has limited delivery history to prove it yet.";
  const platformProof =
    completedCount > 0
      ? `Delivered ${completedCount} tracked booking${completedCount === 1 ? "" : "s"} on Subhakary`
      : "No completed platform bookings visible yet";

  return {
    score,
    label,
    summary,
    completedCount,
    acceptedCount,
    recentSuccessCount,
    cancellationRate,
    platformProof,
    strengths: strengths.slice(0, 4),
    cautions: cautions.slice(0, 3),
  };
};
