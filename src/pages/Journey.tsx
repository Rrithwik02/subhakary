import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, MapPin, Users, Sparkles, Target, CalendarClock, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWeddingEvent } from "@/hooks/useWeddingEvent";
import { supabase } from "@/integrations/supabase/client";

type Task = { id: string; title: string; status: string; due_date: string | null };
type Booking = {
  id: string;
  status: string;
  service_providers?: { category?: { name?: string | null } | null } | null;
};

const isVenueBooking = (booking: Booking) => {
  const category = booking.service_providers?.category?.name?.toLowerCase() || "";
  return category.includes("hall") || category.includes("venue") || category.includes("function");
};

const Journey = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { event, loading: eventLoading } = useWeddingEvent();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/journey");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!event || !user) return;
    (async () => {
      const [{ data: taskData }, { data: bookingData }] = await Promise.all([
        supabase.from("wedding_tasks").select("id,title,status,due_date").eq("event_id", event.id).order("sort_order"),
        supabase
          .from("bookings")
          .select("id,status,service_providers(category:service_categories(name))")
          .eq("user_id", user.id)
          .eq("event_id", event.id),
      ]);
      setTasks((taskData as Task[]) ?? []);
      setBookings((bookingData as Booking[]) ?? []);
    })();
  }, [event, user]);

  const acceptedBookings = bookings.filter((booking) => ["accepted", "completed"].includes(booking.status));
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const stages = useMemo(() => {
    const basicsFilled = event
      ? [event.event_date, event.city, event.total_budget, event.wedding_style].filter(Boolean).length
      : 0;
    const basicsDone = basicsFilled >= 4;
    const venueDone = acceptedBookings.some((booking) => isVenueBooking(booking));
    const vendorDone = acceptedBookings.length >= 2 || bookings.some((booking) => booking.status === "pending");
    const tasksDone = completedTasks.length >= Math.min(3, Math.max(tasks.length, 1));

    return [
      {
        title: "Shape the wedding brief",
        description: "Lock the date, city, guest scale, style, and budget so everything else stays grounded.",
        done: basicsDone,
        href: "/plan-wedding",
        cta: basicsDone ? "Review brief" : "Finish setup",
        icon: Sparkles,
        unlockText: basicsDone ? "Your foundation is in place." : "You still have planning basics to fill in.",
        metric: `${basicsFilled}/4 essentials ready`,
      },
      {
        title: "Secure the venue lane",
        description: "Venue choice is the anchor decision. Once it is real, the rest of the stack gets much easier.",
        done: venueDone,
        href: "/providers?service=function%20hall",
        cta: venueDone ? "Review venue" : "Find venue",
        icon: MapPin,
        unlockText: venueDone ? "Venue is covered." : "This unlocks your vendor shortlist and schedule confidence.",
        metric: venueDone ? "Venue booked" : "Still open",
      },
      {
        title: "Build the vendor team",
        description: "Add your core vendors and start comparing them against budget, trust, and fit.",
        done: vendorDone,
        href: "/providers",
        cta: vendorDone ? "Review vendors" : "Browse vendors",
        icon: Users,
        unlockText: vendorDone ? "You already have momentum here." : "Aim to get at least two core vendors in motion.",
        metric: `${acceptedBookings.length} booked / ${bookings.filter((booking) => booking.status === "pending").length} pending`,
      },
      {
        title: "Operate the plan",
        description: "Run the dashboard weekly so tasks, deadlines, and category budgets stay alive.",
        done: tasksDone,
        href: "/wedding-dashboard",
        cta: tasksDone ? "Open dashboard" : "Work the checklist",
        icon: CalendarClock,
        unlockText: tasksDone ? "You are actively working the plan." : "Clearing the first few tasks is the fastest momentum builder.",
        metric: `${completedTasks.length}/${tasks.length || 0} tasks complete`,
      },
    ];
  }, [acceptedBookings, bookings, completedTasks.length, event, tasks.length]);

  const completedStages = stages.filter((stage) => stage.done).length;
  const progress = Math.round((completedStages / stages.length) * 100);
  const currentStageIndex = stages.findIndex((stage) => !stage.done);
  const activeStageIndex = currentStageIndex === -1 ? stages.length - 1 : currentStageIndex;
  const activeStage = stages[activeStageIndex];

  if (authLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-16 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="mb-3 text-3xl font-bold">Start your guided journey</h1>
          <p className="mb-6 text-muted-foreground">Create a wedding plan first so we can unlock your planning stages.</p>
          <Button asChild>
            <Link to="/plan-wedding">
              Plan Wedding <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <SEOHead title="Guided Wedding Journey | Subhakary" description="Move through each wedding planning stage with Subhakary." />
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-24">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">Guided planning</Badge>
            <h1 className="mb-2 text-3xl font-bold">Wedding Journey</h1>
            <p className="max-w-2xl text-muted-foreground">
              This flow is meant to keep the whole planning process legible. Each stage explains what it unlocks and what to do next.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/wedding-dashboard">
              Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
            <CardContent className="p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Journey progress</p>
                  <p className="text-3xl font-bold">{progress}% complete</p>
                  <p className="mt-2 text-sm text-muted-foreground">{completedStages} of {stages.length} stages are done.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border bg-background/80 p-3">
                    <div className="text-muted-foreground">Booked vendors</div>
                    <div className="mt-1 text-xl font-semibold">{acceptedBookings.length}</div>
                  </div>
                  <div className="rounded-lg border bg-background/80 p-3">
                    <div className="text-muted-foreground">Tasks done</div>
                    <div className="mt-1 text-xl font-semibold">{completedTasks.length}</div>
                  </div>
                </div>
              </div>
              <Progress value={progress} className="h-3" />
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Current focus
              </CardTitle>
              <CardDescription>The next unlocked stage is where the planning system wants your attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{activeStage.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{activeStage.description}</p>
              <p className="mt-4 text-sm">{activeStage.unlockText}</p>
              <Button asChild className="mt-5 w-full">
                <Link to={activeStage.href}>
                  {activeStage.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const locked = index > 0 && !stages[index - 1].done;
              const current = index === activeStageIndex && !stage.done;
              return (
                <Card
                  key={stage.title}
                  className={`border-border/50 transition-all ${
                    current ? "border-primary/30 shadow-sm" : ""
                  } ${locked ? "opacity-70" : ""}`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <div className="mt-1">
                          {stage.done ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : locked ? (
                            <Lock className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Circle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold">{stage.title}</p>
                            <Badge variant={stage.done ? "default" : current ? "secondary" : "outline"}>
                              {stage.done ? "Done" : current ? "Now" : locked ? "Locked" : "Ready"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{stage.description}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Icon className="h-4 w-4" />
                              {stage.metric}
                            </span>
                            <span>{stage.unlockText}</span>
                          </div>
                        </div>
                      </div>
                      <Button asChild disabled={locked} variant={stage.done ? "outline" : "default"}>
                        <Link to={stage.href}>
                          {stage.cta} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>How this flow works</CardTitle>
              <CardDescription>A calmer way to keep the planning story together.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">1. Basics first</p>
                <p className="mt-1">Date, city, budget, and style are the context that recommendations should be built around.</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">2. Venue before chaos</p>
                <p className="mt-1">Venue is usually the highest leverage planning decision, so the journey keeps nudging you there early.</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium text-foreground">3. Run the operating system</p>
                <p className="mt-1">The dashboard is where your vendor coverage, tasks, and budget stay in sync once planning gets real.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Journey;
