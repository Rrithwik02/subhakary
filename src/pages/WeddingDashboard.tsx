import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWeddingEvent } from "@/hooks/useWeddingEvent";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/SEOHead";
import { Heart, Calendar, MapPin, IndianRupee, CheckCircle2, Clock, Plus, ArrowRight, Trash2, Save, AlertTriangle } from "lucide-react";
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
  service_providers?: { business_name: string; category_id: string | null; category?: { name: string | null } | null } | null;
};

type BudgetCategory = {
  id: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
};

const normalizePlanningCategory = (name?: string | null) => {
  const value = (name || "").toLowerCase();
  if (value.includes("photo") || value.includes("video")) return "Photography";
  if (value.includes("cater")) return "Catering";
  if (value.includes("decor")) return "Decor";
  if (value.includes("function") || value.includes("venue") || value.includes("hall")) return "Venue";
  if (value.includes("makeup") || value.includes("mehndi")) return "Makeup and Mehndi";
  if (value.includes("music") || value.includes("mangala") || value.includes("dj")) return "Music and Entertainment";
  if (value.includes("pandit") || value.includes("priest") || value.includes("pooj")) return "Pandit";
  return name || "Other vendors";
};

const WeddingDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { event, loading: eventLoading, refetch } = useWeddingEvent(searchParams.get("event"));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [budgetSpent, setBudgetSpent] = useState(0);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("pending");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("planning");
  const [editingBudget, setEditingBudget] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/wedding-dashboard");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!event) return;
    (async () => {
      const [{ data: t }, { data: b }, { data: c }] = await Promise.all([
        supabase.from("wedding_tasks").select("*").eq("event_id", event.id).order("sort_order"),
        supabase
          .from("bookings")
          .select("id,status,service_date,total_amount,provider_id,service_providers(business_name,category_id,category:service_categories(name))")
          .eq("user_id", user!.id)
          .eq("event_id", event.id),
        supabase.from("wedding_budget_categories").select("*").eq("event_id", event.id).order("planned_amount", { ascending: false }),
      ]);
      setTasks((t as Task[]) ?? []);
      const bks = (b as Booking[]) ?? [];
      setBookings(bks);
      setBudgetCategories((c as BudgetCategory[]) ?? []);
      const spent = bks
        .filter((x) => ["accepted", "completed"].includes(x.status))
        .reduce((s, x) => s + (Number(x.total_amount) || 0), 0);
      setBudgetSpent(spent);
    })();
  }, [event, user]);

  const updateProgress = async (eventId: string, newTasks: Task[]) => {
    const completed = newTasks.filter((t) => t.status === "completed").length;
    const taskPct = newTasks.length ? (completed / newTasks.length) * 55 : 0;
    const bookedCategories = new Set(acceptedBookings.map((b) => b.service_providers?.category?.name).filter(Boolean)).size;
    const vendorPct = Math.min(25, bookedCategories * 5);
    const budgetPct = event?.total_budget ? Math.min(20, (budgetSpent / Number(event.total_budget)) * 20) : 0;
    const pct = Math.min(100, Math.round(taskPct + vendorPct + budgetPct));
    await supabase.from("wedding_events").update({ progress_percent: pct }).eq("id", eventId);
    refetch();
  };

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
    const updated = tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t));
    setTasks(updated);
    if (event) updateProgress(event.id, updated);
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
    const updated = [...tasks, data as Task];
    setTasks(updated);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    updateProgress(event.id, updated);
  };

  const deleteTask = async (taskId: string) => {
    if (!event) return;
    const { error } = await supabase.from("wedding_tasks").delete().eq("id", taskId);
    if (error) {
      toast.error("Could not delete task");
      return;
    }
    const updated = tasks.filter((task) => task.id !== taskId);
    setTasks(updated);
    updateProgress(event.id, updated);
  };

  const saveBudget = async (category: BudgetCategory) => {
    const planned = Number(editingBudget[category.id] ?? category.planned_amount);
    const { error } = await supabase
      .from("wedding_budget_categories")
      .update({ planned_amount: Number.isFinite(planned) ? planned : 0 })
      .eq("id", category.id);
    if (error) {
      toast.error("Could not update budget");
      return;
    }
    setBudgetCategories((rows) => rows.map((row) => row.id === category.id ? { ...row, planned_amount: planned } : row));
    toast.success("Budget updated");
  };

  const syncActualSpend = async () => {
    const updates = budgetCategories.map((category) => {
      const actual = acceptedBookings
        .filter((booking) => normalizePlanningCategory(booking.service_providers?.category?.name) === category.category)
        .reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0);
      return supabase.from("wedding_budget_categories").update({ actual_amount: actual }).eq("id", category.id);
    });
    await Promise.all(updates);
    setBudgetCategories((rows) => rows.map((category) => ({
      ...category,
      actual_amount: acceptedBookings
        .filter((booking) => normalizePlanningCategory(booking.service_providers?.category?.name) === category.category)
        .reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0),
    })));
    toast.success("Actual spend synced from accepted bookings");
  };

  if (authLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 text-center text-muted-foreground">Loading…</main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Wedding Dashboard | Subhakary" description="Your single source of truth for planning your wedding." />
        <Navbar />
        <main className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Start your Wedding Plan</h1>
          <p className="text-muted-foreground mb-6">
            Tell us a bit about your wedding and we'll set up your dashboard, checklist and budget.
          </p>
          <Button size="lg" onClick={() => navigate("/plan-wedding")}>
            Plan my wedding <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const upcomingTasks = tasks.filter((t) => t.status !== "completed").slice(0, 5);
  const filteredTasks = tasks.filter((task) => taskFilter === "all" || task.status === taskFilter);
  const visibleTasks = filteredTasks.slice(0, 12);
  const acceptedBookings = bookings.filter((b) => ["accepted", "completed"].includes(b.status));
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const budgetPct = event.total_budget ? Math.min(100, Math.round((budgetSpent / Number(event.total_budget)) * 100)) : 0;
  const budgetRows = (() => {
    const rows = new Map<string, { category: string; planned: number; actual: number }>();
    budgetCategories.forEach((category) => {
      rows.set(category.category, {
        category: category.category,
        planned: Number(category.planned_amount) || 0,
        actual: Number(category.actual_amount) || 0,
      });
    });
    acceptedBookings.forEach((booking) => {
      const category = normalizePlanningCategory(booking.service_providers?.category?.name);
      const existing = rows.get(category) ?? { category, planned: 0, actual: 0 };
      existing.actual += Number(booking.total_amount) || 0;
      rows.set(category, existing);
    });
    return Array.from(rows.values()).sort((a, b) => b.actual + b.planned - (a.actual + a.planned));
  })();
  const vendorCategories = ["Venue", "Catering", "Photography", "Decor", "Makeup", "Mehndi", "Pandit", "Music"];
  const vendorStatusRows = vendorCategories.map((category) => {
    const matching = bookings.filter((booking) =>
      normalizePlanningCategory(booking.service_providers?.category?.name).toLowerCase().includes(category.toLowerCase()) ||
      booking.service_providers?.business_name?.toLowerCase().includes(category.toLowerCase())
    );
    const accepted = matching.find((booking) => ["accepted", "completed"].includes(booking.status));
    const pending = matching.find((booking) => booking.status === "pending");
    return { category, status: accepted ? "booked" : pending ? "pending" : "not started", booking: accepted || pending };
  });
  const nextStep = (() => {
    const overdue = tasks.find((task) => task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date());
    if (overdue) return { label: `Finish overdue task: ${overdue.title}`, href: "/wedding-dashboard" };
    const openVendor = vendorStatusRows.find((row) => row.status === "not started");
    if (openVendor) return { label: `Book your ${openVendor.category}`, href: `/providers` };
    const nextTask = tasks.find((task) => task.status !== "completed");
    if (nextTask) return { label: `Next: ${nextTask.title}`, href: "/wedding-dashboard" };
    return { label: "Review your plan", href: "/journey" };
  })();
  const daysAway = event.event_date
    ? Math.max(0, Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <SEOHead title={`${event.name} | Wedding Dashboard`} description="Manage vendors, budget and tasks for your wedding." />
      <Navbar />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl rounded-full translate-y-1/3 -translate-x-1/3 opacity-50 pointer-events-none" />
      <main className="container mx-auto px-4 py-32 max-w-6xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {event.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(event.event_date).toLocaleDateString()}
                {daysAway !== null && <Badge variant="secondary" className="ml-1">{daysAway} days to go</Badge>}
              </span>
            )}
            {event.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.city}</span>}
            {event.wedding_style && <Badge variant="outline" className="capitalize">{event.wedding_style}</Badge>}
          </div>
        </div>

        {/* Progress hero */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <Heart className="w-48 h-48" />
          </div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-muted-foreground">Wedding planning progress</div>
                <div className="text-3xl font-bold">{event.progress_percent}% complete</div>
              </div>
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <Progress value={event.progress_percent} className="h-3" />
            <p className="text-sm text-muted-foreground mt-3">
              {completedTasks} of {tasks.length} tasks done, {acceptedBookings.length} vendors booked, {budgetPct}% of budget allocated
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8 border-primary/20 bg-background/50 backdrop-blur shadow-sm">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">What should I do next?</p>
              <p className="text-lg font-semibold">{nextStep.label}</p>
            </div>
            <Button asChild>
              <Link to={nextStep.href}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card shadow-elevated border-border/40 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Vendors booked</CardDescription>
              <CardTitle className="text-2xl">{acceptedBookings.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{pendingBookings.length} pending requests</p>
              <Button variant="link" className="px-0 h-auto" asChild>
                <Link to="/providers">Find more vendors <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elevated border-border/40 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Budget</CardDescription>
              <CardTitle className="text-2xl flex items-center">
                <IndianRupee className="h-5 w-5" />
                {budgetSpent.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.total_budget ? (
                <>
                  <Progress value={budgetPct} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    of ₹{Number(event.total_budget).toLocaleString("en-IN")} ({budgetPct}%)
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No budget set</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elevated border-border/40 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="pb-2">
              <CardDescription>Tasks remaining</CardDescription>
              <CardTitle className="text-2xl">{tasks.length - completedTasks}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {upcomingTasks[0] ? `Next: ${upcomingTasks[0].title}` : "All caught up!"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two columns: Tasks + Vendors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card shadow-elevated border-border/40 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Your checklist</CardTitle>
              <CardDescription>Top tasks to focus on next</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_120px_auto] gap-2">
                <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Add a custom task" />
                <Input value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)} placeholder="Category" />
                <Input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                <Button onClick={addTask} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["pending", "completed", "all"] as const).map((filter) => (
                  <Button key={filter} size="sm" variant={taskFilter === filter ? "default" : "outline"} onClick={() => setTaskFilter(filter)} className="capitalize">
                    {filter}
                  </Button>
                ))}
              </div>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                <>
                  {visibleTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-md border hover:bg-accent/50 transition">
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={() => toggleTask(task)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{task.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {task.category && <Badge variant="outline" className="text-xs">{task.category}</Badge>}
                          {task.due_date && (
                            <span className={`flex items-center gap-1 ${
                              task.status !== "completed" && new Date(task.due_date) < new Date() ? "text-destructive" : ""
                            }`}>
                              <Clock className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {!task.is_default && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {tasks.length > visibleTasks.length && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing {visibleTasks.length} of {tasks.length} tasks
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elevated border-border/40 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader>
              <CardTitle>Your vendors</CardTitle>
              <CardDescription>Bookings tied to this wedding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">No vendors booked yet</p>
                  <Button asChild size="sm">
                    <Link to="/providers"><Plus className="h-4 w-4 mr-1" /> Browse vendors</Link>
                  </Button>
                </div>
              ) : (
                bookings.slice(0, 6).map((b) => (
                  <Link
                    key={b.id}
                    to={`/booking/${b.id}`}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-accent/50 transition"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {b.service_providers?.business_name ?? "Provider"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(b.service_date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant={b.status === "accepted" || b.status === "completed" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {b.status}
                    </Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elevated border-border/40 hover:-translate-y-1 transition-transform duration-300">
            <CardHeader>
              <CardTitle>Vendor status tracker</CardTitle>
              <CardDescription>Category-level planning status</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {vendorStatusRows.map((row) => (
                <div key={row.category} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="text-sm font-medium">{row.category}</p>
                    {row.booking?.service_providers?.business_name && (
                      <p className="text-xs text-muted-foreground">{row.booking.service_providers.business_name}</p>
                    )}
                  </div>
                  <Badge variant={row.status === "booked" ? "default" : row.status === "pending" ? "secondary" : "outline"} className="capitalize">
                    {row.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 glass-card shadow-elevated border-border/40">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Budget tracker</CardTitle>
                <CardDescription>Planned budget by category compared with accepted vendor spend</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={syncActualSpend}>Sync actuals</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Accepted bookings will appear here as actual spend.</p>
            ) : (
              budgetRows.slice(0, 6).map((row) => {
                const categoryRecord = budgetCategories.find((category) => category.category === row.category);
                const planned = row.planned || (event.total_budget ? Number(event.total_budget) / Math.max(budgetRows.length, 1) : 0);
                const pct = planned ? Math.min(100, Math.round((row.actual / planned) * 100)) : 0;
                const isOver = planned > 0 && row.actual > planned;
                return (
                  <div key={row.category} className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3 md:items-center text-sm">
                      <div>
                        <span className="font-medium">{row.category}</span>
                        {isOver && (
                          <span className="ml-2 inline-flex items-center text-destructive text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Over budget
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Rs {row.actual.toLocaleString("en-IN")} actual
                        </p>
                      </div>
                      {categoryRecord ? (
                        <div>
                          <Label className="text-xs">Planned</Label>
                          <Input
                            type="number"
                            value={editingBudget[categoryRecord.id] ?? categoryRecord.planned_amount}
                            onChange={(e) => setEditingBudget((cur) => ({ ...cur, [categoryRecord.id]: e.target.value }))}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Rs {Math.round(planned).toLocaleString("en-IN")}</span>
                      )}
                      {categoryRecord && (
                        <Button size="sm" variant="outline" onClick={() => saveBudget(categoryRecord)}>
                          <Save className="h-3.5 w-3.5 mr-1" /> Save
                        </Button>
                      )}
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default WeddingDashboard;
