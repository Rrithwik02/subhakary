import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, IndianRupee, Sparkles, Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useWeddingEvent } from "@/hooks/useWeddingEvent";
import { supabase } from "@/integrations/supabase/client";
import { computePlanningProgress, computeVendorStatusRows, computeWeddingHealth, findOverdueTask } from "@/lib/weddingPlanning";

type Task = { title: string; status: string; due_date: string | null };
type Booking = {
  status: string;
  total_amount: number | null;
  service_providers?: { category?: { name?: string | null } | null } | null;
};
type BudgetCategory = { category: string; planned_amount: number; actual_amount: number };

export const NextStepCard = ({ className = "" }: { className?: string }) => {
  const { user } = useAuth();
  const { event } = useWeddingEvent();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);

  useEffect(() => {
    if (!user || !event) return;
    (async () => {
      const [{ data: taskData }, { data: bookingData }, { data: budgetData }] = await Promise.all([
        supabase.from("wedding_tasks").select("title,status,due_date").eq("event_id", event.id).order("due_date"),
        supabase
          .from("bookings")
          .select("status,total_amount,service_providers(category:service_categories(name))")
          .eq("user_id", user.id)
          .eq("event_id", event.id),
        supabase.from("wedding_budget_categories").select("category,planned_amount,actual_amount").eq("event_id", event.id),
      ]);

      setTasks((taskData as Task[]) ?? []);
      setBookings((bookingData as Booking[]) ?? []);
      setBudgetCategories((budgetData as BudgetCategory[]) ?? []);
    })();
  }, [event, user]);

  if (!user) return null;

  const vendorStatusRows = computeVendorStatusRows(bookings);
  const budgetRows = budgetCategories.map((category) => ({
    category: category.category,
    planned: Number(category.planned_amount) || 0,
    actual: Number(category.actual_amount) || 0,
  }));
  const planningSummary = computePlanningProgress({ event, tasks, vendorStatusRows, budgetRows });
  const weddingHealth = computeWeddingHealth({ event, tasks, vendorStatusRows, budgetRows });
  const completedTasks = planningSummary.completedTasks;
  const budgetSpent = budgetRows.reduce((sum, row) => sum + row.actual, 0);
  const overdueTask = findOverdueTask(tasks);

  const next = (() => {
    if (!event) return { label: "Create your wedding plan", href: "/plan-wedding", cta: "Plan wedding" };
    if (!event.event_date || !event.city || !event.total_budget || !event.wedding_style) {
      return { label: "Finish your wedding basics", href: "/plan-wedding", cta: "Finish setup" };
    }
    if (overdueTask) return { label: `Overdue: ${overdueTask.title}`, href: "/wedding-dashboard", cta: "Fix task" };
    const openLane = vendorStatusRows.find((row) => row.activeCount < row.targetCount);
    if (openLane) return { label: `Grow your ${openLane.label} shortlist`, href: `/providers?service=${encodeURIComponent(openLane.search)}`, cta: "Browse vendors" };
    const task = tasks.find((item) => item.status !== "completed");
    if (task) return { label: task.title, href: "/wedding-dashboard", cta: "Open dashboard" };
    return { label: "Review your guided journey", href: "/journey", cta: "Open journey" };
  })();

  return (
    <section className={`container mx-auto px-4 ${className}`}>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/8 via-background to-background shadow-sm">
        <CardContent className="p-5">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Wedding health</Badge>
                <Badge variant="outline">{planningSummary.progressPercent}% on track</Badge>
                <Badge variant="outline">Health {weddingHealth.score}</Badge>
              </div>
              <div className="mb-3 flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">What should I do next?</p>
                  <p className="text-lg font-semibold">{next.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{weddingHealth.summary}</p>
                </div>
              </div>
              <Progress value={planningSummary.progressPercent} className="h-2.5" />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-background/80 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="h-3.5 w-3.5" />
                    Progress
                  </div>
                  <p className="font-semibold">{completedTasks}/{tasks.length || 0} tasks done</p>
                </div>
                <div className="rounded-lg border bg-background/80 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Vendor coverage
                  </div>
                  <p className="font-semibold">
                    {vendorStatusRows.filter((row) => row.activeCount >= row.targetCount).length}/{vendorStatusRows.length} lanes covered
                  </p>
                </div>
                <div className="rounded-lg border bg-background/80 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Budget
                  </div>
                  <p className="font-semibold">{budgetSpent ? `Rs ${Math.round(budgetSpent).toLocaleString("en-IN")} tracked` : "Set category budgets"}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-xl border bg-background/75 p-4">
              <div>
                <p className="mb-2 text-sm font-medium">Mirror of your dashboard state</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    {overdueTask ? "You have overdue checklist work." : "No overdue checklist items right now."}
                  </p>
                  <p>{vendorStatusRows.filter((row) => row.status === "booked").length} vendor lanes are fully booked.</p>
                  <p>{vendorStatusRows.filter((row) => row.status === "shortlisted").length} lanes have enough options in motion.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link to={next.href}>
                    {next.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {event ? (
                  <Button asChild variant="outline">
                    <Link to="/build-my-wedding">Build my wedding</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
