type WeddingBasics = {
  event_date?: string | null;
  city?: string | null;
  total_budget?: number | null;
  wedding_style?: string | null;
};

type PlanningTask = {
  status: string;
  due_date?: string | null;
};

type PlanningBooking = {
  status: string;
  service_providers?: {
    business_name?: string | null;
    category?: { name?: string | null } | null;
  } | null;
};

type PlanningBudgetRow = {
  category: string;
  planned: number;
  actual: number;
};

export type VendorLane = {
  label: string;
  matchers: string[];
  search: string;
  targetCount: number;
};

export type VendorStatusRow = VendorLane & {
  activeCount: number;
  acceptedCount: number;
  pendingCount: number;
  coverage: number;
  status: "booked" | "shortlisted" | "pending" | "not started";
  bookingName: string | null;
};

export const VENDOR_LANES: VendorLane[] = [
  { label: "Venue", matchers: ["venue", "hall", "function"], search: "function hall", targetCount: 1 },
  { label: "Catering", matchers: ["cater"], search: "catering", targetCount: 2 },
  { label: "Photography", matchers: ["photo", "video", "cinema"], search: "photography", targetCount: 2 },
  { label: "Decor", matchers: ["decor", "floral", "stage"], search: "decor", targetCount: 2 },
  { label: "Makeup and Mehndi", matchers: ["makeup", "mehndi"], search: "makeup", targetCount: 2 },
  { label: "Music and Entertainment", matchers: ["music", "dj", "band", "mangala"], search: "dj", targetCount: 2 },
  { label: "Pandit", matchers: ["pandit", "priest", "pooj"], search: "pandit", targetCount: 1 },
];

export const normalizePlanningCategory = (name?: string | null) => {
  const value = (name || "").toLowerCase();
  const match = VENDOR_LANES.find((lane) => lane.matchers.some((matcher) => value.includes(matcher)));
  return match?.label ?? (name || "Other vendors");
};

export const computeVendorStatusRows = (bookings: PlanningBooking[]): VendorStatusRow[] =>
  VENDOR_LANES.map((lane) => {
    const matching = bookings.filter(
      (booking) => normalizePlanningCategory(booking.service_providers?.category?.name) === lane.label,
    );
    const accepted = matching.filter((booking) => ["accepted", "completed"].includes(booking.status));
    const pending = matching.filter((booking) => booking.status === "pending");
    const activeCount = matching.length;
    const coverage = Math.min(activeCount / lane.targetCount, 1);
    const status: VendorStatusRow["status"] = accepted.length
      ? "booked"
      : activeCount >= lane.targetCount
        ? "shortlisted"
        : pending.length
          ? "pending"
          : "not started";

    return {
      ...lane,
      activeCount,
      acceptedCount: accepted.length,
      pendingCount: pending.length,
      coverage,
      status,
      bookingName: matching[0]?.service_providers?.business_name || null,
    };
  });

export const computePlanningProgress = ({
  event,
  tasks,
  vendorStatusRows,
  budgetRows,
}: {
  event: WeddingBasics | null;
  tasks: PlanningTask[];
  vendorStatusRows: VendorStatusRow[];
  budgetRows: PlanningBudgetRow[];
}) => {
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const checklistCompletion = tasks.length ? completedTasks / tasks.length : 0;
  const vendorCoverage = vendorStatusRows.length
    ? vendorStatusRows.reduce((sum, lane) => {
        if (lane.acceptedCount > 0) return sum + 1;
        if (lane.status === "shortlisted") return sum + 0.8;
        if (lane.pendingCount > 0) return sum + Math.max(lane.coverage, 0.45);
        return sum;
      }, 0) / vendorStatusRows.length
    : 0;
  const budgetCoverage = budgetRows.length
    ? budgetRows.filter((row) => row.planned > 0 || row.actual > 0).length / budgetRows.length
    : 0;
  const basicsScore = event
    ? [event.event_date, event.city, event.total_budget, event.wedding_style].filter(Boolean).length / 4
    : 0;

  return {
    completedTasks,
    checklistCompletion,
    vendorCoverage,
    budgetCoverage,
    basicsScore,
    progressPercent: Math.round(
      Math.min(
        100,
        basicsScore * 20 +
          checklistCompletion * 35 +
          vendorCoverage * 30 +
          budgetCoverage * 15,
      ),
    ),
  };
};

export const findOverdueTask = <T extends PlanningTask>(tasks: T[]) =>
  tasks.find((task) => task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date());
