type WeddingBasics = {
  event_date?: string | null;
  city?: string | null;
  total_budget?: number | null;
  wedding_style?: string | null;
  wedding_size?: string | null;
};

type PlanningTask = {
  title?: string;
  status: string;
  due_date?: string | null;
};

type PlanningBooking = {
  status: string;
  total_amount?: number | null;
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
  dependencyNotes?: string[];
  dueWeeksBefore?: number;
};

export type VendorStatusRow = VendorLane & {
  activeCount: number;
  acceptedCount: number;
  pendingCount: number;
  coverage: number;
  status: "booked" | "shortlisted" | "pending" | "not started";
  bookingName: string | null;
};

export type WeddingHealth = {
  score: number;
  label: "At risk" | "Needs attention" | "Steady" | "Strong";
  summary: string;
  risks: string[];
  subscores: {
    basics: number;
    checklist: number;
    vendors: number;
    budget: number;
    timeline: number;
  };
};

export type TimelineStep = {
  id: string;
  title: string;
  dueDate: string | null;
  status: "done" | "in_progress" | "upcoming" | "at_risk";
  detail: string;
  actionHref: string;
};

export const VENDOR_LANES: VendorLane[] = [
  {
    label: "Venue",
    matchers: ["venue", "hall", "function"],
    search: "function hall",
    targetCount: 1,
    dueWeeksBefore: 24,
  },
  {
    label: "Catering",
    matchers: ["cater"],
    search: "catering",
    targetCount: 2,
    dependencyNotes: ["Venue shortlist helps lock guest flow and kitchen setup."],
    dueWeeksBefore: 16,
  },
  {
    label: "Photography",
    matchers: ["photo", "video", "cinema"],
    search: "photography",
    targetCount: 2,
    dueWeeksBefore: 20,
  },
  {
    label: "Decor",
    matchers: ["decor", "floral", "stage"],
    search: "decor",
    targetCount: 2,
    dependencyNotes: ["Venue layout usually needs to be clear before decor styling lands."],
    dueWeeksBefore: 14,
  },
  {
    label: "Makeup and Mehndi",
    matchers: ["makeup", "mehndi"],
    search: "makeup",
    targetCount: 2,
    dueWeeksBefore: 10,
  },
  {
    label: "Music and Entertainment",
    matchers: ["music", "dj", "band", "mangala"],
    search: "dj",
    targetCount: 2,
    dueWeeksBefore: 8,
  },
  {
    label: "Pandit",
    matchers: ["pandit", "priest", "pooj"],
    search: "pandit",
    targetCount: 1,
    dueWeeksBefore: 8,
  },
];

const addDays = (input: Date, days: number) => {
  const next = new Date(input);
  next.setDate(next.getDate() + days);
  return next;
};

const ratioToPercent = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 100);

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
      Math.min(100, basicsScore * 20 + checklistCompletion * 35 + vendorCoverage * 30 + budgetCoverage * 15),
    ),
  };
};

export const findOverdueTask = <T extends PlanningTask>(tasks: T[]) =>
  tasks.find((task) => task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date());

export const computeTimelineSteps = ({
  event,
  vendorStatusRows,
  tasks,
}: {
  event: WeddingBasics | null;
  vendorStatusRows: VendorStatusRow[];
  tasks: PlanningTask[];
}): TimelineStep[] => {
  const eventDate = event?.event_date ? new Date(event.event_date) : null;
  if (!eventDate || Number.isNaN(eventDate.getTime())) return [];

  const overdueCount = tasks.filter((task) => task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date()).length;

  const steps: TimelineStep[] = [
    {
      id: "venue",
      title: "Lock the venue",
      dueDate: addDays(eventDate, -7 * 24).toISOString(),
      status: vendorStatusRows.find((row) => row.label === "Venue")?.acceptedCount ? "done" : "in_progress",
      detail: "Venue is the anchor decision for decor, catering, and guest movement.",
      actionHref: `/providers?service=${encodeURIComponent("function hall")}`,
    },
    {
      id: "photo",
      title: "Shortlist photographers",
      dueDate: addDays(eventDate, -7 * 20).toISOString(),
      status:
        vendorStatusRows.find((row) => row.label === "Photography")?.activeCount
          ? vendorStatusRows.find((row) => row.label === "Photography")?.acceptedCount
            ? "done"
            : "in_progress"
          : "upcoming",
      detail: "Photo and video teams tend to get booked early around peak dates.",
      actionHref: `/providers?service=${encodeURIComponent("photography")}`,
    },
    {
      id: "guestflow",
      title: "Confirm catering and guest flow",
      dueDate: addDays(eventDate, -7 * 16).toISOString(),
      status: vendorStatusRows.find((row) => row.label === "Catering")?.acceptedCount ? "done" : "upcoming",
      detail: "Once venue is clear, catering can map service style and headcount movement.",
      actionHref: `/providers?service=${encodeURIComponent("catering")}`,
    },
    {
      id: "checklist",
      title: "Keep checklist debt low",
      dueDate: addDays(new Date(), 7).toISOString(),
      status: overdueCount > 0 ? "at_risk" : tasks.some((task) => task.status !== "completed") ? "in_progress" : "done",
      detail: overdueCount > 0 ? `${overdueCount} tasks are slipping right now.` : "Clear the live tasks so the final month stays calm.",
      actionHref: "/wedding-dashboard",
    },
  ];

  return steps.map((step) => {
    if (step.status !== "upcoming") return step;
    if (new Date(step.dueDate || "").getTime() < Date.now()) return { ...step, status: "at_risk" };
    return step;
  });
};

export const computeWeddingHealth = ({
  event,
  tasks,
  vendorStatusRows,
  budgetRows,
}: {
  event: WeddingBasics | null;
  tasks: PlanningTask[];
  vendorStatusRows: VendorStatusRow[];
  budgetRows: PlanningBudgetRow[];
}): WeddingHealth => {
  const planning = computePlanningProgress({ event, tasks, vendorStatusRows, budgetRows });
  const overdueTasks = tasks.filter((task) => task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date()).length;
  const totalPlanned = budgetRows.reduce((sum, row) => sum + row.planned, 0);
  const totalActual = budgetRows.reduce((sum, row) => sum + row.actual, 0);
  const overBudgetRows = budgetRows.filter((row) => row.planned > 0 && row.actual > row.planned).length;
  const missingCriticalVendor = vendorStatusRows.some((row) => ["Venue", "Photography", "Catering"].includes(row.label) && row.acceptedCount === 0);
  const eventDate = event?.event_date ? new Date(event.event_date) : null;
  const daysToGo = eventDate ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const timelineBase = overdueTasks === 0 ? 1 : Math.max(0.2, 1 - overdueTasks * 0.18);
  const timelineUrgencyPenalty =
    daysToGo !== null && daysToGo < 45 && missingCriticalVendor
      ? 0.25
      : daysToGo !== null && daysToGo < 21 && overdueTasks > 0
        ? 0.35
        : 0;
  const timelineScore = Math.max(0, timelineBase - timelineUrgencyPenalty);

  const budgetScore =
    totalPlanned <= 0
      ? 0.35
      : totalActual <= totalPlanned
        ? Math.max(0.45, 1 - (totalActual / Math.max(totalPlanned, 1)) * 0.15)
        : Math.max(0.1, 1 - (totalActual - totalPlanned) / Math.max(totalPlanned, 1));

  const score = Math.round(
    Math.min(
      100,
      planning.basicsScore * 15 +
        planning.checklistCompletion * 25 +
        planning.vendorCoverage * 25 +
        budgetScore * 20 +
        timelineScore * 15,
    ),
  );

  const risks: string[] = [];
  if (!event?.event_date || !event.city || !event.total_budget || !event.wedding_style) {
    risks.push("Your core wedding basics are still incomplete.");
  }
  if (missingCriticalVendor) {
    risks.push("One of the critical lanes is still not booked.");
  }
  if (overdueTasks > 0) {
    risks.push(`${overdueTasks} checklist item${overdueTasks === 1 ? " is" : "s are"} overdue.`);
  }
  if (overBudgetRows > 0) {
    risks.push(`${overBudgetRows} budget categor${overBudgetRows === 1 ? "y is" : "ies are"} over plan.`);
  }

  const label: WeddingHealth["label"] =
    score >= 80 ? "Strong" : score >= 65 ? "Steady" : score >= 45 ? "Needs attention" : "At risk";

  const summary =
    risks[0] ||
    (score >= 80
      ? "Your plan has good structure and very few active risks."
      : "The plan is moving, but there are still a few soft spots to tighten.");

  return {
    score,
    label,
    summary,
    risks,
    subscores: {
      basics: ratioToPercent(planning.basicsScore),
      checklist: ratioToPercent(planning.checklistCompletion),
      vendors: ratioToPercent(planning.vendorCoverage),
      budget: ratioToPercent(budgetScore),
      timeline: ratioToPercent(timelineScore),
    },
  };
};
