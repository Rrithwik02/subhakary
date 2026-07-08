import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Task = { title: string; status: string; due_date: string | null };

export const NextStepCard = ({ className = "" }: { className?: string }) => {
  const { user } = useAuth();

  // Query user's active planning workspace from the unified schema
  const { data: wedding } = useQuery({
    queryKey: ["next-step-active-wedding", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weddings" as any)
        .select("id")
        .eq("owner_user_id", user!.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as any;
    },
    enabled: !!user,
  });

  // Query tasks for this workspace
  const { data: tasks = [] } = useQuery({
    queryKey: ["next-step-tasks", wedding?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_tasks" as any)
        .select("title, status, due_date")
        .eq("wedding_id", wedding.id)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!wedding,
  });

  // Query bookings count for this workspace
  const { data: bookingCount = 0 } = useQuery({
    queryKey: ["next-step-booking-count", wedding?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("wedding_id", wedding.id);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!wedding,
  });

  if (!user) return null;

  const next = (() => {
    if (!wedding) return { label: "Start your event plan", href: "/plan-event" };
    if (bookingCount === 0) return { label: "Book your first vendor", href: "/providers" };
    const overdue = tasks.find((task) => task.status !== "done" && task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date());
    if (overdue) return { label: `Finish overdue task: ${overdue.title}`, href: `/event/${wedding.id}` };
    const task = tasks.find((item) => item.status !== "done" && item.status !== "completed");
    if (task) return { label: task.title, href: `/event/${wedding.id}` };
    return { label: "Review your guided journey", href: "/journey" };
  })();

  return (
    <section className={`container mx-auto px-4 ${className}`}>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">What should I do next?</p>
              <p className="font-semibold">{next.label}</p>
            </div>
          </div>
          <Button asChild>
            <Link to={next.href}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
