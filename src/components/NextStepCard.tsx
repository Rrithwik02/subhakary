import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWeddingEvent } from "@/hooks/useWeddingEvent";
import { supabase } from "@/integrations/supabase/client";

type Task = { title: string; status: string; due_date: string | null };

export const NextStepCard = ({ className = "" }: { className?: string }) => {
  const { user } = useAuth();
  const { event } = useWeddingEvent();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (!user || !event) return;
    (async () => {
      const [{ data: taskData }, { count }] = await Promise.all([
        supabase.from("wedding_tasks").select("title,status,due_date").eq("event_id", event.id).order("due_date"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("event_id", event.id),
      ]);
      setTasks((taskData as Task[]) ?? []);
      setBookingCount(count ?? 0);
    })();
  }, [event, user]);

  if (!user) return null;

  const next = (() => {
    if (!event) return { label: "Create your wedding plan", href: "/plan-wedding" };
    if (bookingCount === 0) return { label: "Book your first vendor", href: "/providers" };
    const overdue = tasks.find((task) => task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date());
    if (overdue) return { label: `Finish overdue task: ${overdue.title}`, href: "/wedding-dashboard" };
    const task = tasks.find((item) => item.status !== "completed");
    if (task) return { label: task.title, href: "/wedding-dashboard" };
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
