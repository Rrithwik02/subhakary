import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  IndianRupee,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/wedding-planner";

interface WeddingRecord {
  id: string;
  title: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string | null;
  total_budget: number;
  city: string;
  location: string | null;
  guest_count: number;
  wedding_type: string;
  cultural_preferences: string[];
}

const WeddingDashboard = () => {
  const { weddingId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, navigate, user]);

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["wedding-dashboard", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weddings" as any)
        .select("*")
        .eq("id", weddingId)
        .single();

      if (error) throw error;
      return data as WeddingRecord;
    },
    enabled: !!weddingId && !!user,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["wedding-events", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_events" as any)
        .select("*")
        .eq("wedding_id", weddingId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["wedding-tasks", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_tasks" as any)
        .select("*")
        .eq("wedding_id", weddingId)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  const { data: budgetItems = [] } = useQuery({
    queryKey: ["wedding-budget-items", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_budget_items" as any)
        .select("*")
        .eq("wedding_id", weddingId);

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ["wedding-requirements", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wedding_event_vendor_requirements" as any)
        .select(`
          *,
          wedding_event:wedding_events!wedding_event_vendor_requirements_wedding_event_id_fkey(id, wedding_id, title)
        `)
        .in("wedding_event_id", events.map((event) => event.id));

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user && events.length > 0,
  });

  const { data: linkedBookings = [] } = useQuery({
    queryKey: ["wedding-linked-bookings", weddingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          wedding_event_id,
          total_amount,
          service_date,
          provider:service_providers(
            id,
            business_name,
            base_price,
            city,
            is_premium,
            is_verified,
            category:service_categories(name, slug)
          )
        `)
        .eq("user_id", user!.id)
        .eq("wedding_id", weddingId)
        .order("service_date", { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!weddingId && !!user,
  });

  const { data: recommendedProviders = [] } = useQuery({
    queryKey: ["wedding-recommendations", weddingId, wedding?.city],
    queryFn: async () => {
      const requirementSlugs = Array.from(
        new Set(
          requirements
            .map((requirement) => requirement.category_slug)
            .filter((slug) => slug && !linkedBookings.some((booking) => booking.provider?.category?.slug === slug))
        )
      ).slice(0, 4);

      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          id,
          business_name,
          city,
          rating,
          total_reviews,
          base_price,
          is_premium,
          is_verified,
          category:service_categories(name, slug)
        `)
        .eq("status", "approved")
        .order("rating", { ascending: false });

      if (error) throw error;

      return ((data || []) as any[])
        .filter((provider) => {
          const matchesCategory = requirementSlugs.length === 0 || requirementSlugs.includes(provider.category?.slug);
          const matchesCity = !wedding?.city || provider.city?.toLowerCase().includes(wedding.city.toLowerCase());
          return matchesCategory && matchesCity;
        })
        .slice(0, 8);
    },
    enabled: !!weddingId && !!user && !!wedding,
  });

  const dashboard = useMemo(() => {
    const totalBudget = Number(wedding?.total_budget || 0);
    const plannedSpend = budgetItems.reduce((sum, item) => sum + Number(item.planned_amount || 0), 0);
    const actualSpend = linkedBookings.reduce((sum, booking) => {
      return sum + Number(booking.total_amount || booking.provider?.base_price || 0);
    }, 0);

    const categoryBreakdown = budgetItems
      .map((item) => {
        const actual = linkedBookings
          .filter((booking) => booking.provider?.category?.slug === item.category_slug)
          .reduce((sum, booking) => sum + Number(booking.total_amount || booking.provider?.base_price || 0), 0);

        return {
          slug: item.category_slug,
          name: item.category_name,
          planned: Number(item.planned_amount || 0),
          actual,
        };
      })
      .sort((a, b) => b.planned - a.planned);

    const progressByCategory = requirements.reduce((acc, requirement) => {
      const current = acc.get(requirement.category_slug) || {
        slug: requirement.category_slug,
        name: requirement.category_name,
        required: 0,
        booked: 0,
      };

      current.required += Number(requirement.required_count || 0);
      current.booked = linkedBookings.filter(
        (booking) => booking.provider?.category?.slug === requirement.category_slug
      ).length;
      acc.set(requirement.category_slug, current);
      return acc;
    }, new Map<string, { slug: string; name: string; required: number; booked: number }>());

    const upcomingTasks = tasks
      .filter((task) => task.status !== "done")
      .slice(0, 6);

    const timeline = [...events].sort((a, b) => {
      const aDate = a.event_date ? new Date(a.event_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.event_date ? new Date(b.event_date).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

    return {
      totalBudget,
      plannedSpend,
      actualSpend,
      remainingBudget: Math.max(totalBudget - actualSpend, 0),
      categoryBreakdown,
      progressByCategory: Array.from(progressByCategory.values()),
      upcomingTasks,
      timeline,
    };
  }, [budgetItems, events, linkedBookings, requirements, tasks, wedding]);

  const tagRecommendation = (provider: any) => {
    if (provider.is_premium) return "Premium Choice";
    if (provider.base_price && provider.base_price < dashboard.totalBudget * 0.08) return "Best Value";
    if (provider.city?.toLowerCase() === wedding?.city?.toLowerCase()) return "Near You";
    return "AI Recommended";
  };

  if (authLoading || weddingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-16 px-4">
          <div className="container max-w-3xl mx-auto text-center">
            <h1 className="font-display text-3xl font-semibold">Wedding not found</h1>
            <p className="text-muted-foreground mt-3">
              This dashboard does not exist yet, so let&apos;s create a new one.
            </p>
            <Button variant="gold" className="mt-6" onClick={() => navigate("/wedding/new")}>
              Create Wedding Dashboard
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
            <Button variant="ghost" className="mb-5" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                    {wedding.wedding_type}
                  </Badge>
                  <Badge variant="outline">
                    {wedding.guest_count} guests
                  </Badge>
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-semibold mt-3">
                  {wedding.title}
                </h1>
                <p className="text-muted-foreground mt-3 max-w-3xl">
                  {wedding.bride_name} and {wedding.groom_name} are planning a {wedding.wedding_type} wedding in {wedding.city}.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    {wedding.wedding_date ? format(new Date(wedding.wedding_date), "PPP") : "Date to be finalized"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {wedding.location || wedding.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {wedding.cultural_preferences?.join(", ") || "Custom rituals"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link to="/wedding/new">
                  <Button variant="outline">New Wedding</Button>
                </Link>
                {events[0] && (
                  <Link to={`/wedding/${wedding.id}/events/${events[0].id}`}>
                    <Button variant="gold">Open Event Workspace</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(dashboard.totalBudget)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Planned Spend</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(dashboard.plannedSpend)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Actual Spend</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(dashboard.actualSpend)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="font-display text-3xl font-semibold mt-2">{formatCurrency(dashboard.remainingBudget)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Budget Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dashboard.categoryBreakdown.length === 0 ? (
                      <p className="text-muted-foreground">Budget categories will appear here once your planner is initialized.</p>
                    ) : (
                      dashboard.categoryBreakdown.map((item) => (
                        <div key={item.slug} className="rounded-2xl border p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Planned {formatCurrency(item.planned)} | Actual {formatCurrency(item.actual)}
                              </p>
                            </div>
                            <Badge variant={item.actual > item.planned ? "destructive" : "secondary"}>
                              {item.planned > 0 ? `${Math.min(Math.round((item.actual / item.planned) * 100), 999)}%` : "0%"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Vendor Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.progressByCategory.length === 0 ? (
                      <p className="text-muted-foreground">Vendor requirement tracking will appear after event setup.</p>
                    ) : (
                      dashboard.progressByCategory.map((progress) => (
                        <div key={progress.slug} className="flex items-center justify-between rounded-2xl border p-4">
                          <div>
                            <p className="font-medium">{progress.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {progress.booked}/{progress.required} booked
                            </p>
                          </div>
                          <Badge variant={progress.booked >= progress.required ? "secondary" : "outline"}>
                            {progress.booked >= progress.required ? "Ready" : "Pending"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-display text-2xl">Wedding Events</CardTitle>
                    {events[0] && (
                      <Link to={`/wedding/${wedding.id}/events/${events[0].id}`}>
                        <Button variant="outline" size="sm">Open Workspace</Button>
                      </Link>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.timeline.map((event) => (
                      <Link key={event.id} to={`/wedding/${wedding.id}/events/${event.id}`}>
                        <div className="flex items-center justify-between rounded-2xl border p-4 hover:border-primary/40 transition-colors">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.event_date ? format(new Date(event.event_date), "MMM dd") : "Date pending"} | {event.guest_count} guests
                            </p>
                          </div>
                          <Badge variant="outline">{formatCurrency(Number(event.budget_allocated || 0))}</Badge>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Upcoming Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.upcomingTasks.length === 0 ? (
                      <p className="text-muted-foreground">Everything is complete right now.</p>
                    ) : (
                      dashboard.upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-3 rounded-2xl border p-4">
                          <Clock3 className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.due_date ? `Due ${format(new Date(task.due_date), "PPP")}` : "No due date yet"}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Event Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboard.timeline.map((event) => (
                      <div key={event.id} className="flex gap-3 rounded-2xl border p-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.event_date ? format(new Date(event.event_date), "PPP") : "Date pending"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Recommended Vendors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendedProviders.length === 0 ? (
                      <p className="text-muted-foreground">
                        Recommendations will appear as soon as your event requirements narrow down.
                      </p>
                    ) : (
                      recommendedProviders.map((provider) => (
                        <Link
                          key={provider.id}
                          to={`/provider/${provider.id}?wedding=${wedding.id}&event=${events[0]?.id || ""}`}
                        >
                          <div className="rounded-2xl border p-4 hover:border-primary/40 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">{provider.business_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {provider.category?.name} | {provider.city} | {provider.rating?.toFixed?.(1) || "New"}
                                </p>
                              </div>
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                                {tagRecommendation(provider)}
                              </Badge>
                            </div>
                            <p className="text-sm mt-2">
                              Starting from {formatCurrency(Number(provider.base_price || 0))}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-display text-2xl">Booked Vendors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {linkedBookings.length === 0 ? (
                      <p className="text-muted-foreground">
                        As you book vendors from this Wedding OS, actual spend will start syncing here automatically.
                      </p>
                    ) : (
                      linkedBookings.map((booking) => (
                        <div key={booking.id} className="rounded-2xl border p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{booking.provider?.business_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {booking.provider?.category?.name} | {booking.service_date ? format(new Date(booking.service_date), "PPP") : "Date pending"}
                              </p>
                            </div>
                            <Badge variant={booking.status === "accepted" || booking.status === "completed" ? "secondary" : "outline"}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm mt-2 flex items-center gap-1.5">
                            <IndianRupee className="h-4 w-4 text-primary" />
                            {formatCurrency(Number(booking.total_amount || booking.provider?.base_price || 0))}
                          </p>
                        </div>
                      ))
                    )}
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

export default WeddingDashboard;
