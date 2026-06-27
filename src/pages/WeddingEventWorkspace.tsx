import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/wedding-planner";

const WeddingEventWorkspace = () => {
  const { weddingId, eventId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, navigate, user]);

  const { data: wedding } = useQuery({
    queryKey: ["wedding", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weddings" as any)
        .select("*")
        .eq("id", weddingId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!weddingId && !!user,
  });

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["wedding-event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_events" as any)
        .select("*")
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!eventId && !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["wedding-event-tasks", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_tasks" as any)
        .select("*")
        .eq("wedding_event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!eventId && !!user,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ["wedding-event-requirements", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_event_vendor_requirements" as any)
        .select("*")
        .eq("wedding_event_id", eventId);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!eventId && !!user,
  });

  const { data: budgetItems = [] } = useQuery({
    queryKey: ["wedding-event-budget-items", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_budget_items" as any)
        .select("*")
        .eq("wedding_event_id", eventId);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!eventId && !!user,
  });

  const { data: eventBookings = [] } = useQuery({
    queryKey: ["wedding-event-bookings", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          service_date,
          total_amount,
          provider:service_providers(
            id,
            business_name,
            base_price,
            category:service_categories(name, slug)
          )
        `)
        .eq("user_id", user!.id)
        .eq("wedding_event_id", eventId);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!eventId && !!user,
  });

  const { data: providerCandidates = [] } = useQuery({
    queryKey: ["wedding-event-candidates", eventId, wedding?.city],
    queryFn: async () => {
      const slugs = requirements.map((requirement) => requirement.category_slug);
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          id,
          business_name,
          city,
          rating,
          total_reviews,
          base_price,
          is_verified,
          is_premium,
          category:service_categories(name, slug)
        `)
        .eq("status", "approved")
        .order("rating", { ascending: false });

      if (error) throw error;

      return ((data || []) as any[])
        .filter((provider) => {
          const sameCity = !wedding?.city || provider.city?.toLowerCase().includes(wedding.city.toLowerCase());
          const neededCategory = slugs.length === 0 || slugs.includes(provider.category?.slug);
          return sameCity && neededCategory;
        })
        .slice(0, 18);
    },
    enabled: !!eventId && !!user && !!wedding,
  });

  const saveEventMutation = useMutation({
    mutationFn: async () => {
      if (!event) return;
      const { error } = await supabase
        .from("wedding_events" as any)
        .update({
          title: event.title,
          event_date: event.event_date || null,
          event_time: event.event_time || null,
          venue: event.venue || null,
          guest_count: event.guest_count,
          budget_allocated: event.budget_allocated,
          notes: event.notes || null,
        } as any)
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Event updated",
        description: "Your event workspace details are saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["wedding-event", eventId] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBudgetItemMutation = useMutation({
    mutationFn: async ({ id, plannedAmount }: { id: string; plannedAmount: number }) => {
      const { error } = await supabase
        .from("wedding_budget_items" as any)
        .update({ planned_amount: plannedAmount } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-event-budget-items", eventId] });
      queryClient.invalidateQueries({ queryKey: ["wedding-budget-items", weddingId] });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => {
      const { error } = await supabase
        .from("wedding_tasks" as any)
        .update({ status: nextStatus } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-event-tasks", eventId] });
      queryClient.invalidateQueries({ queryKey: ["wedding-tasks", weddingId] });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async () => {
      if (!newTaskTitle.trim()) return;
      const { error } = await supabase
        .from("wedding_tasks" as any)
        .insert({
          wedding_id: weddingId,
          wedding_event_id: eventId,
          title: newTaskTitle.trim(),
          priority: "medium",
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTaskTitle("");
      queryClient.invalidateQueries({ queryKey: ["wedding-event-tasks", eventId] });
      queryClient.invalidateQueries({ queryKey: ["wedding-tasks", weddingId] });
    },
  });

  const summary = useMemo(() => {
    const totalActual = eventBookings.reduce((sum, booking) => {
      return sum + Number(booking.total_amount || booking.provider?.base_price || 0);
    }, 0);
    const totalPlanned = budgetItems.reduce((sum, item) => sum + Number(item.planned_amount || 0), 0);
    const completedTasks = tasks.filter((task) => task.status === "done").length;
    return {
      totalActual,
      totalPlanned,
      completedTasks,
    };
  }, [budgetItems, eventBookings, tasks]);

  if (authLoading || eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!event || !wedding) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-16 px-4">
          <div className="container max-w-3xl mx-auto text-center">
            <h1 className="font-display text-3xl font-semibold">Event workspace not found</h1>
            <Button className="mt-6" variant="gold" onClick={() => navigate(`/wedding/${weddingId}`)}>
              Back to Dashboard
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="ghost" className="mb-5" onClick={() => navigate(`/wedding/${weddingId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Wedding Dashboard
            </Button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-semibold">{event.title} Workspace</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-primary" />
                    {event.event_date ? format(new Date(event.event_date), "PPP") : "Date pending"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {event.venue || wedding.location || wedding.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {event.guest_count} guests
                  </span>
                </div>
              </div>

              <Button variant="gold" onClick={() => saveEventMutation.mutate()}>
                Save Workspace
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Allocated Budget</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(Number(event.budget_allocated || 0))}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Planned Category Spend</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(summary.totalPlanned)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Actual Spend</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(summary.totalActual)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Event Title</Label>
                      <Input
                        value={event.title || ""}
                        onChange={(e) => queryClient.setQueryData(["wedding-event", eventId], { ...event, title: e.target.value })}
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={event.event_date || ""}
                          onChange={(e) => queryClient.setQueryData(["wedding-event", eventId], { ...event, event_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={event.event_time || ""}
                          onChange={(e) => queryClient.setQueryData(["wedding-event", eventId], { ...event, event_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input
                        value={event.venue || ""}
                        onChange={(e) => queryClient.setQueryData(["wedding-event", eventId], { ...event, venue: e.target.value })}
                        placeholder="Venue name or area"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Guest Count</Label>
                        <Input
                          type="number"
                          value={event.guest_count || 0}
                          onChange={(e) => queryClient.setQueryData(["wedding-event", eventId], { ...event, guest_count: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Budget Allocation</Label>
                        <Input
                          type="number"
                          value={event.budget_allocated || 0}
                          onChange={(e) => queryClient.setQueryData(["wedding-event", eventId], { ...event, budget_allocated: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        rows={4}
                        value={event.notes || ""}
                        onChange={(e) => queryClient.setQueryData(["wedding-event", eventId], { ...event, notes: e.target.value })}
                        placeholder="Ceremony specifics, special guests, rituals, arrival flow, or setup notes."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Vendor Requirements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {requirements.map((requirement) => {
                      const bookedCount = eventBookings.filter(
                        (booking) => booking.provider?.category?.slug === requirement.category_slug
                      ).length;
                      return (
                        <div key={requirement.id} className="rounded-2xl border p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{requirement.category_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {bookedCount}/{requirement.required_count} booked
                              </p>
                            </div>
                            <Badge variant={bookedCount >= requirement.required_count ? "secondary" : "outline"}>
                              {bookedCount >= requirement.required_count ? "Ready" : "Open"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Payments & Bookings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {eventBookings.length === 0 ? (
                      <p className="text-muted-foreground">
                        Vendor bookings attached to this event will show here with live spend totals.
                      </p>
                    ) : (
                      eventBookings.map((booking) => (
                        <div key={booking.id} className="rounded-2xl border p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{booking.provider?.business_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.provider?.category?.name} | {booking.status}
                              </p>
                            </div>
                            <p className="font-medium">{formatCurrency(Number(booking.total_amount || booking.provider?.base_price || 0))}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Checklist</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new event task"
                      />
                      <Button onClick={() => addTaskMutation.mutate()} disabled={!newTaskTitle.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 rounded-2xl border p-4">
                          <Checkbox
                            checked={task.status === "done"}
                            onCheckedChange={(checked) =>
                              toggleTaskMutation.mutate({
                                id: task.id,
                                nextStatus: checked ? "done" : "todo",
                              })
                            }
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                              {task.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {task.due_date ? `Due ${format(new Date(task.due_date), "PPP")}` : "No due date"}
                            </p>
                          </div>
                          {task.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Budget by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {budgetItems.map((item) => (
                      <div key={item.id} className="rounded-2xl border p-4">
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <p className="font-medium">{item.category_name}</p>
                          <Badge variant="outline">{item.category_slug}</Badge>
                        </div>
                        <Input
                          type="number"
                          value={item.planned_amount || 0}
                          onChange={(e) =>
                            queryClient.setQueryData(["wedding-event-budget-items", eventId], (current: any[] = []) =>
                              current.map((budgetItem) =>
                                budgetItem.id === item.id
                                  ? { ...budgetItem, planned_amount: Number(e.target.value) || 0 }
                                  : budgetItem
                              )
                            )
                          }
                          onBlur={(e) =>
                            updateBudgetItemMutation.mutate({
                              id: item.id,
                              plannedAmount: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Recommended Vendors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {requirements.map((requirement) => {
                      const candidates = providerCandidates.filter(
                        (provider) => provider.category?.slug === requirement.category_slug
                      );

                      return (
                        <div key={requirement.id} className="rounded-2xl border p-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                              <p className="font-medium">{requirement.category_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Browse providers and any booking you make here will sync back into this event.
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {candidates.slice(0, 3).map((provider) => (
                              <Link
                                key={provider.id}
                                to={`/provider/${provider.id}?wedding=${weddingId}&event=${eventId}`}
                              >
                                <div className="rounded-xl bg-muted/40 p-3 hover:bg-muted/70 transition-colors">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-medium">{provider.business_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {provider.city} | {provider.rating?.toFixed?.(1) || "New"} | {provider.total_reviews || 0} reviews
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium flex items-center gap-1 justify-end">
                                        <IndianRupee className="h-4 w-4 text-primary" />
                                        {formatCurrency(Number(provider.base_price || 0))}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {provider.is_premium ? "Premium" : provider.is_verified ? "Verified" : "Open"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                            {candidates.length === 0 && (
                              <p className="text-sm text-muted-foreground">No same-city recommendations yet for this category.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WeddingEventWorkspace;
