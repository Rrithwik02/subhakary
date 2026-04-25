import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { SEOHead } from "@/components/SEOHead";
import { Heart, Calendar, MapPin, IndianRupee, CheckCircle2, Clock, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  category: string | null;
  due_date: string | null;
  status: string;
  sort_order: number;
};

type Booking = {
  id: string;
  status: string;
  service_date: string;
  total_amount: number | null;
  provider_id: string;
  service_providers?: { business_name: string; category_id: string | null } | null;
};

const WeddingDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { event, loading: eventLoading, refetch } = useWeddingEvent();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [budgetSpent, setBudgetSpent] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/wedding-dashboard");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!event) return;
    (async () => {
      const [{ data: t }, { data: b }] = await Promise.all([
        supabase.from("wedding_tasks").select("*").eq("event_id", event.id).order("sort_order"),
        supabase
          .from("bookings")
          .select("id,status,service_date,total_amount,provider_id,service_providers(business_name,category_id)")
          .eq("user_id", user!.id),
      ]);
      setTasks((t as Task[]) ?? []);
      const bks = (b as any[]) ?? [];
      setBookings(bks);
      const spent = bks
        .filter((x) => ["accepted", "completed"].includes(x.status))
        .reduce((s, x) => s + (Number(x.total_amount) || 0), 0);
      setBudgetSpent(spent);
    })();
  }, [event, user]);

  const updateProgress = async (eventId: string, newTasks: Task[]) => {
    const completed = newTasks.filter((t) => t.status === "completed").length;
    const pct = newTasks.length ? Math.round((completed / newTasks.length) * 100) : 0;
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
  const acceptedBookings = bookings.filter((b) => ["accepted", "completed"].includes(b.status));
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const budgetPct = event.total_budget ? Math.min(100, Math.round((budgetSpent / Number(event.total_budget)) * 100)) : 0;
  const daysAway = event.event_date
    ? Math.max(0, Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${event.name} | Wedding Dashboard`} description="Manage vendors, budget and tasks for your wedding." />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
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
            {event.wedding_style && <Badge variant="outline">{event.wedding_style}</Badge>}
          </div>
        </div>

        {/* Progress hero */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
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
              {completedTasks} of {tasks.length} tasks done
            </p>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
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

          <Card>
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

          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Your checklist</CardTitle>
              <CardDescription>Top tasks to focus on next</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                <>
                  {upcomingTasks.map((task) => (
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
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Showing 5 of {tasks.length} tasks
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WeddingDashboard;
