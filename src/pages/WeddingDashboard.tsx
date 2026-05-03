import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWeddingEvent } from "@/hooks/useWeddingEvent";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import {
  computePlanningProgress,
  computeVendorStatusRows,
  findOverdueTask,
  normalizePlanningCategory,
} from "@/lib/weddingPlanning";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Heart,
  IndianRupee,
  MapPin,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  category: string | null;
  due_date: string | null;
  status: string;
  sort_order: number;
  is_default?: boolean;
};

type Booking = {
  id: string;
  status: string;
  service_date: string;
  total_amount: number | null;
  provider_id: string;
  service_providers?: {
    business_name: string;
    category_id: string | null;
    category?: { name: string | null } | null;
  } | null;
};

type BudgetCategory = {
  id: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
};

const formatCurrency = (value: number) => `Rs ${Math.round(value).toLocaleString("en-IN")}`;

const isOverdue = (date?: string | null) => !!date && new Date(date) < new Date();

const WeddingDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { event, loading: eventLoading, refetch } = useWeddingEvent(searchParams.get("event"));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed" | "overdue">("pending");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("planning");
  const [editingBudget, setEditingBudget] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/wedding-dashboard");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!event || !user) return;
    (async () => {
      const [{ data: taskData }, { data: bookingData }, { data: budgetData }] = await Promise.all([
        supabase.from("wedding_tasks").select("*").eq("event_id", event.id).order("sort_order"),
        supabase
          .from("bookings")
          .select("id,status,service_date,total_amount,provider_id,service_providers(business_name,category_id,category:service_categories(name))")
          .eq("user_id", user.id)
          .eq("event_id", event.id),
        supabase.from("wedding_budget_categories").select("*").eq("event_id", event.id).order("planned_amount", { ascending: false }),
      ]);

      setTasks((taskData as Task[]) ?? []);
      setBookings((bookingData as Booking[]) ?? []);
      setBudgetCategories((budgetData as BudgetCategory[]) ?? []);
    })();
  }, [event, user]);

  const acceptedBookings = useMemo(
    () => bookings.filter((booking) => ["accepted", "completed"].includes(booking.status)),
    [bookings],
  );

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "pending"),
    [bookings],
  );

  const budgetSpent = useMemo(
    () => acceptedBookings.reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0),
    [acceptedBookings],
  );

  const vendorStatusRows = useMemo(() => computeVendorStatusRows(bookings), [bookings]);

  const budgetRows = useMemo(() => {
    const rows = new Map<string, { category: string; planned: number; actual: number; id?: string }>();

    budgetCategories.forEach((category) => {
      rows.set(category.category, {
        category: category.category,
        planned: Number(category.planned_amount) || 0,
        actual: Number(category.actual_amount) || 0,
        id: category.id,
      });
    });

    acceptedBookings.forEach((booking) => {
      const category = normalizePlanningCategory(booking.service_providers?.category?.name);
      const current = rows.get(category) ?? { category, planned: 0, actual: 0 };
      current.actual += Number(booking.total_amount) || 0;
      rows.set(category, current);
    });

    return Array.from(rows.values()).sort((a, b) => (b.planned + b.actual) - (a.planned + a.actual));
  }, [acceptedBookings, budgetCategories]);

  const overdueTasks = useMemo(() => tasks.filter((task) => task.status !== "completed" && isOverdue(task.due_date)), [tasks]);

  const tasksDueSoon = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.status === "completed" || !task.due_date) return false;
        const diff = new Date(task.due_date).getTime() - Date.now();
        return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
      }),
    [tasks],
  );

  const planningSummary = useMemo(
    () => computePlanningProgress({ event, tasks, vendorStatusRows, budgetRows }),
    [event, tasks, vendorStatusRows, budgetRows],
  );
  const completedTasks = planningSummary.completedTasks;
  const planningProgress = planningSummary.progressPercent;
  const vendorCoverage = planningSummary.vendorCoverage;
  const budgetCoverage = planningSummary.budgetCoverage;
  const basicsScore = planningSummary.basicsScore;

  const totalPlannedBudget = budgetRows.reduce((sum, row) => sum + row.planned, 0);
  const overBudgetRows = budgetRows.filter((row) => row.planned > 0 && row.actual > row.planned);
  const budgetHealthPct = totalPlannedBudget ? Math.min(100, Math.round((budgetSpent / totalPlannedBudget) * 100)) : 0;

  const nextStep = useMemo(() => {
    if (!event?.event_date || !event.city || !event.total_budget || !event.wedding_style) {
      return {
        title: "Tighten your wedding basics",
        detail: "Add the missing date, city, budget, or style details so planning recommendations stay grounded.",
        href: "/plan-wedding",
        cta: "Finish setup",
      };
    }
    const venueLane = vendorStatusRows.find((row) => row.label === "Venue");
    if (!venueLane || venueLane.acceptedCount < venueLane.targetCount) {
      return {
        title: "Lock in your venue first",
        detail: "Venue choice unlocks a lot of your downstream decisions, so it is the best next move.",
        href: `/providers?service=${encodeURIComponent(venueLane?.search || "function hall")}`,
        cta: "Find venues",
      };
    }
    const overdueTask = findOverdueTask(tasks);
    if (overdueTask) {
      return {
        title: `Catch up on ${overdueTask.title}`,
        detail: "You have an overdue checklist item. Clearing it will keep the rest of the timeline honest.",
        href: "/wedding-dashboard",
        cta: "Resolve overdue task",
      };
    }
    const unstartedVendor = vendorStatusRows.find((row) => row.activeCount < row.targetCount);
    if (unstartedVendor) {
      return {
        title: `Start your ${unstartedVendor.label} shortlist`,
        detail: `This lane works best with about ${unstartedVendor.targetCount} vendors in motion, so there is still planning room here.`,
        href: `/providers?service=${encodeURIComponent(unstartedVendor.search)}`,
        cta: `Browse ${unstartedVendor.label}`,
      };
    }
    if (overBudgetRows[0]) {
      return {
        title: `Rebalance ${overBudgetRows[0].category}`,
        detail: "That category has already crossed its planned number, so this is a good time to reset expectations.",
        href: "/wedding-dashboard",
        cta: "Review budget",
      };
    }
    const openTask = tasks.find((task) => task.status !== "completed");
    if (openTask) {
      return {
        title: openTask.title,
        detail: "Your checklist is in pretty good shape. Knocking out the next live task will keep momentum up.",
        href: "/wedding-dashboard",
        cta: "Open checklist",
      };
    }
    return {
      title: "Review your full journey",
      detail: "You have the foundation in place. Now is a good moment to sense-check the whole plan.",
      href: "/journey",
      cta: "See journey",
    };
  }, [event, overBudgetRows, tasks, vendorStatusRows]);

  const visibleTasks = tasks
    .filter((task) => {
      if (taskFilter === "all") return true;
      if (taskFilter === "overdue") return task.status !== "completed" && isOverdue(task.due_date);
      return task.status === taskFilter;
    })
    .slice(0, 12);

  useEffect(() => {
    if (!event || planningProgress === event.progress_percent) return;
    void supabase.from("wedding_events").update({ progress_percent: planningProgress }).eq("id", event.id).then(() => {
      refetch();
    });
  }, [event, planningProgress, refetch]);

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    const { error } = await supabase
      .from("wedding_tasks")
      .update({ status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null })
      .eq("id", task.id);

    if (error) {
      toast.error("Could not update task");
      return;
    }

    const updatedTasks = tasks.map((current) => (current.id === task.id ? { ...current, status: newStatus } : current));
    setTasks(updatedTasks);
  };

  const addTask = async () => {
    if (!event || !newTaskTitle.trim()) return;

    const { data, error } = await supabase
      .from("wedding_tasks")
      .insert({
        event_id: event.id,
        title: newTaskTitle.trim(),
        category: newTaskCategory || null,
        due_date: newTaskDueDate || null,
        sort_order: tasks.length + 1,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      toast.error("Could not add task");
      return;
    }

    const updatedTasks = [...tasks, data as Task];
    setTasks(updatedTasks);
    setNewTaskTitle("");
    setNewTaskDueDate("");
  };

  const deleteTask = async (taskId: string) => {
    if (!event) return;

    const { error } = await supabase.from("wedding_tasks").delete().eq("id", taskId);
    if (error) {
      toast.error("Could not delete task");
      return;
    }

    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  };

  const saveBudget = async (category: BudgetCategory) => {
    const plannedAmount = Number(editingBudget[category.id] ?? category.planned_amount);
    const safeAmount = Number.isFinite(plannedAmount) ? plannedAmount : 0;
    const { error } = await supabase
      .from("wedding_budget_categories")
      .update({ planned_amount: safeAmount })
      .eq("id", category.id);

    if (error) {
      toast.error("Could not update budget");
      return;
    }

    setBudgetCategories((current) =>
      current.map((row) => (row.id === category.id ? { ...row, planned_amount: safeAmount } : row)),
    );
    toast.success("Budget updated");
  };

  const syncActualSpend = async () => {
    const updates = budgetCategories.map((category) => {
      const actualAmount = acceptedBookings
        .filter((booking) => normalizePlanningCategory(booking.service_providers?.category?.name) === category.category)
        .reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0);

      return supabase.from("wedding_budget_categories").update({ actual_amount: actualAmount }).eq("id", category.id);
    });

    await Promise.all(updates);

    setBudgetCategories((current) =>
      current.map((category) => ({
        ...category,
        actual_amount: acceptedBookings
          .filter((booking) => normalizePlanningCategory(booking.service_providers?.category?.name) === category.category)
          .reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0),
      })),
    );

    toast.success("Actual spend synced from accepted bookings");
  };

  if (authLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Wedding Dashboard | Subhakary" description="Your single source of truth for planning your wedding." />
        <Navbar />
        <main className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-3xl font-bold">Start your Wedding Plan</h1>
          <p className="mb-6 text-muted-foreground">
            Tell us a bit about your wedding and we will set up your dashboard, checklist, and budget.
          </p>
          <Button size="lg" onClick={() => navigate("/plan-wedding")}>
            Plan my wedding <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const daysAway = event.event_date
    ? Math.max(0, Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <SEOHead title={`${event.name} | Wedding Dashboard`} description="Manage vendors, budget, and tasks for your wedding." />
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-28">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Wedding OS</Badge>
              <Badge variant="outline">{planningProgress}% on track</Badge>
            </div>
            <h1 className="mb-2 text-3xl font-bold">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {event.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.event_date).toLocaleDateString()}
                </span>
              )}
              {daysAway !== null && <span>{daysAway} days to go</span>}
              {event.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.city}
                </span>
              )}
              {event.wedding_style && <span className="capitalize">{event.wedding_style}</span>}
            </div>
          </div>

          <Button asChild variant="outline">
            <Link to="/journey">
              Open guided journey <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Planning overview</p>
                  <h2 className="text-3xl font-bold">{planningProgress}% complete</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Progress now weighs your planning basics, checklist movement, vendor coverage, and budget setup.
                  </p>
                </div>
                <div className="grid min-w-[220px] grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border bg-background/80 p-3">
                    <div className="text-muted-foreground">Checklist</div>
                    <div className="mt-1 text-xl font-semibold">{completedTasks}/{tasks.length || 0}</div>
                  </div>
                  <div className="rounded-lg border bg-background/80 p-3">
                    <div className="text-muted-foreground">Healthy lanes</div>
                    <div className="mt-1 text-xl font-semibold">
                      {vendorStatusRows.filter((row) => row.activeCount >= row.targetCount).length}/{vendorStatusRows.length}
                    </div>
                  </div>
                </div>
              </div>
              <Progress value={planningProgress} className="h-3" />
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-background/80 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Basics
                  </div>
                  <p className="text-lg font-semibold">{Math.round(basicsScore * 100)}%</p>
                </div>
                <div className="rounded-lg border bg-background/80 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Vendor coverage
                  </div>
                  <p className="text-lg font-semibold">{Math.round(vendorCoverage * 100)}%</p>
                </div>
                <div className="rounded-lg border bg-background/80 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <IndianRupee className="h-4 w-4" />
                    Budget setup
                  </div>
                  <p className="text-lg font-semibold">{Math.round(budgetCoverage * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-background shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What should I do next?
              </CardTitle>
              <CardDescription>The dashboard is choosing the next move based on gaps, urgency, and planning coverage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-lg font-semibold">{nextStep.title}</p>
              <p className="mb-5 text-sm text-muted-foreground">{nextStep.detail}</p>
              <Button asChild className="w-full">
                <Link to={nextStep.href}>
                  {nextStep.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Booked vendors</CardDescription>
              <CardTitle className="text-2xl">{acceptedBookings.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{pendingBookings.length} pending requests</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Overdue tasks</CardDescription>
              <CardTitle className="text-2xl">{overdueTasks.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {overdueTasks[0] ? overdueTasks[0].title : "Nothing slipping right now"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Budget spent</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(budgetSpent)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {totalPlannedBudget ? `${budgetHealthPct}% of planned category budget` : "Planned budgets not filled yet"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Due this week</CardDescription>
              <CardTitle className="text-2xl">{tasksDueSoon.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {tasksDueSoon[0] ? tasksDueSoon[0].title : "A nice calm patch"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Action lane
                </CardTitle>
                <CardDescription>Keep the checklist alive with custom tasks, due dates, and quick filters.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-[1fr_140px_140px_auto]">
                  <Input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder="Add a custom task" />
                  <Input value={newTaskCategory} onChange={(event) => setNewTaskCategory(event.target.value)} placeholder="Category" />
                  <Input type="date" value={newTaskDueDate} onChange={(event) => setNewTaskDueDate(event.target.value)} />
                  <Button onClick={addTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["pending", "overdue", "completed", "all"] as const).map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={taskFilter === filter ? "default" : "outline"}
                      onClick={() => setTaskFilter(filter)}
                      className="capitalize"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>

                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                ) : (
                  <div className="space-y-3">
                    {visibleTasks.map((task) => {
                      const overdue = task.status !== "completed" && isOverdue(task.due_date);
                      return (
                        <div key={task.id} className="flex items-start gap-3 rounded-lg border p-3 transition hover:bg-accent/40">
                          <Checkbox checked={task.status === "completed"} onCheckedChange={() => toggleTask(task)} className="mt-1" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{task.title}</p>
                              {task.category && <Badge variant="outline">{task.category}</Badge>}
                              {overdue && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Clock3 className="h-3 w-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                              <span className="capitalize">{task.status}</span>
                            </div>
                          </div>
                          {!task.is_default && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteTask(task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {tasks.length > visibleTasks.length && (
                      <p className="text-center text-xs text-muted-foreground">
                        Showing {visibleTasks.length} of {tasks.length} tasks
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Budget tracker</CardTitle>
                <CardDescription>Planned category budget against accepted-booking spend, with warnings where things drift.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall budget health</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(budgetSpent)} spent {totalPlannedBudget ? `of ${formatCurrency(totalPlannedBudget)}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={syncActualSpend}>
                    Sync actuals
                  </Button>
                </div>

                {budgetRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Accepted bookings will appear here as actual spend.</p>
                ) : (
                  budgetRows.map((row) => {
                    const categoryRecord = budgetCategories.find((category) => category.category === row.category);
                    const planned = row.planned || 0;
                    const actual = row.actual || 0;
                    const percent = planned ? Math.min(100, Math.round((actual / planned) * 100)) : 0;
                    const isOverBudget = planned > 0 && actual > planned;

                    return (
                      <div key={row.category} className="rounded-lg border p-4">
                        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{row.category}</p>
                              {isOverBudget && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Over budget
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatCurrency(actual)} actual {planned ? `vs ${formatCurrency(planned)} planned` : "with no planned amount yet"}
                            </p>
                          </div>

                          {categoryRecord ? (
                            <div className="grid gap-2 sm:grid-cols-[170px_auto]">
                              <div>
                                <Label className="text-xs">Planned amount</Label>
                                <Input
                                  type="number"
                                  value={editingBudget[categoryRecord.id] ?? categoryRecord.planned_amount}
                                  onChange={(event) =>
                                    setEditingBudget((current) => ({ ...current, [categoryRecord.id]: event.target.value }))
                                  }
                                />
                              </div>
                              <Button className="sm:self-end" size="sm" variant="outline" onClick={() => saveBudget(categoryRecord)}>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </Button>
                            </div>
                          ) : null}
                        </div>

                        <Progress value={percent} className="h-2" />
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Vendor coverage</CardTitle>
                <CardDescription>See which planning lanes are booked, in motion, or still waiting for attention.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {vendorStatusRows.map((row) => (
                  <div key={row.label} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{row.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {row.bookingName || "No vendor selected yet"}
                        </p>
                      </div>
                      <Badge
                        variant={row.status === "booked" ? "default" : row.status === "pending" || row.status === "shortlisted" ? "secondary" : "outline"}
                        className="capitalize"
                      >
                        {row.status}
                      </Badge>
                    </div>
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{row.activeCount}/{row.targetCount} vendors in motion</span>
                      <span>{row.acceptedCount} booked</span>
                    </div>
                    <Progress value={Math.round(row.coverage * 100)} className="mb-3 h-2" />
                    <Button asChild variant="ghost" className="h-auto px-0 text-sm">
                      <Link to={`/providers?service=${encodeURIComponent(row.search)}`}>
                        {row.status === "booked" ? "Review more options" : `Browse ${row.label}`}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Bookings for this wedding</CardTitle>
                <CardDescription>Everything attached to the selected wedding event, not your whole account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bookings.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="mb-3 text-sm text-muted-foreground">No vendors booked yet</p>
                    <Button asChild size="sm">
                      <Link to="/providers">
                        <Plus className="mr-2 h-4 w-4" />
                        Browse vendors
                      </Link>
                    </Button>
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <Link
                      key={booking.id}
                      to={`/booking/${booking.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-accent/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{booking.service_providers?.business_name ?? "Provider"}</p>
                        <p className="text-xs text-muted-foreground">
                          {normalizePlanningCategory(booking.service_providers?.category?.name)} . {new Date(booking.service_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={["accepted", "completed"].includes(booking.status) ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {booking.status}
                      </Badge>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WeddingDashboard;
