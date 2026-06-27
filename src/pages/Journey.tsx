import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, MapPin, Users, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Journey = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/journey");
  }, [authLoading, user, navigate]);

  // Query User's Active Wedding from unified schema
  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["journey-active-wedding", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weddings" as any)
        .select("*")
        .eq("owner_user_id", user!.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
  });

  // Query tasks for this wedding
  const { data: tasks = [] } = useQuery({
    queryKey: ["journey-tasks", wedding?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_tasks" as any)
        .select("id, status")
        .eq("wedding_id", wedding.id);

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!wedding,
  });

  // Query bookings for this wedding
  const { data: bookings = [] } = useQuery({
    queryKey: ["journey-bookings", wedding?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("wedding_id", wedding.id);

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!wedding,
  });

  const stages = useMemo(() => {
    const hasBasics = !!wedding;
    const hasVenue = bookings.some((booking) => booking.status === "accepted" || booking.status === "completed");
    const hasVendors = bookings.length >= 2 || bookings.some((booking) => booking.status === "pending");
    const hasTasks = tasks.some((task) => task.status === "done" || task.status === "completed");
    
    return [
      { title: "Wedding basics", description: "Date, city, budget, guests, and style", done: hasBasics, href: "/wedding/new", icon: Sparkles },
      { title: "Venue and location", description: "Shortlist or book your venue", done: hasVenue, href: "/providers?category=function-halls", icon: MapPin },
      { title: "Vendor team", description: "Book priority vendors and compare options", done: hasVendors, href: "/providers", icon: Users },
      { title: "Tasks and reminders", description: "Work through your planning checklist", done: hasTasks, href: wedding ? `/wedding/${wedding.id}` : "/wedding/new", icon: CheckCircle2 },
    ];
  }, [bookings, wedding, tasks]);

  const completed = stages.filter((stage) => stage.done).length;
  const progress = Math.round((completed / stages.length) * 100);

  if (authLoading || weddingLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-16 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-3">Start your guided journey</h1>
          <p className="text-muted-foreground mb-6">Create a wedding plan first so we can unlock your planning stages.</p>
          <Button asChild>
            <Link to="/wedding/new">
              Plan Wedding <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Guided Wedding Journey | Subhakary" description="Move through each wedding planning stage with Subhakary." />
      <Navbar />
      <main className="container max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Guided Wedding Journey</h1>
          <p className="text-muted-foreground">Move from basics to vendors to checklist actions, one clear step at a time.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Journey progress</p>
                <p className="text-2xl font-bold">{progress}% complete</p>
              </div>
              <Badge>{completed} of {stages.length} stages</Badge>
            </div>
            <Progress value={progress} />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const locked = index > 0 && !stages[index - 1].done;
            return (
              <Card key={stage.title} className={locked ? "opacity-60" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {stage.done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    {stage.title}
                  </CardTitle>
                  <CardDescription>{stage.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    {locked ? "Complete the previous stage to unlock this" : stage.done ? "Completed" : "Ready"}
                  </div>
                  <Button asChild disabled={locked} variant={stage.done ? "outline" : "default"}>
                    <Link to={stage.href}>{stage.done ? "Review" : "Start"} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Journey;
