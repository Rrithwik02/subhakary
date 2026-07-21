import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, IndianRupee, MapPin, Sparkles, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  createWeddingTitle,
  EVENT_TEMPLATES,
  formatCurrency,
  getBudgetRangeByValue,
  getEventTemplate,
  WEDDING_BUDGET_RANGES,
  WEDDING_TYPES,
  type WeddingEventType,
  type WeddingType,
} from "@/lib/wedding-planner";

const CULTURAL_PREFERENCES = [
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayali",
  "North Indian",
  "Bengali",
  "Marwari",
  "Intercultural",
];

const DEFAULT_CATEGORY_SPLITS: Record<string, number> = {
  photography: 0.12,
  decoration: 0.18,
  catering: 0.24,
  poojari: 0.05,
  makeup: 0.08,
  mehandi: 0.05,
  "function-halls": 0.18,
  "event-managers": 0.06,
  "mangala-vadyam": 0.04,
};

const WeddingOnboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    brideName: "",
    groomName: "",
    weddingDate: "",
    isEstimatedDate: false,
    budgetRange: WEDDING_BUDGET_RANGES[1].value,
    city: "",
    location: "",
    weddingType: "traditional" as WeddingType,
    guestCount: 300,
    notes: "",
  });
  const [selectedEvents, setSelectedEvents] = useState<WeddingEventType[]>([
    "engagement",
    "mehendi",
    "haldi",
    "wedding",
    "reception",
  ]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(["Telugu"]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, navigate, user]);

  const budgetRange = useMemo(
    () => getBudgetRangeByValue(formData.budgetRange),
    [formData.budgetRange]
  );

  const totalBudget = budgetRange.amount;

  const toggleEvent = (eventType: WeddingEventType) => {
    setSelectedEvents((current) =>
      current.includes(eventType)
        ? current.filter((item) => item !== eventType)
        : [...current, eventType]
    );
  };

  const togglePreference = (preference: string) => {
    setSelectedPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference]
    );
  };

  const createBudgetItems = (eventIdsByType: Record<string, string>) => {
    const totals = new Map<string, { name: string; amount: number; eventIds: string[] }>();

    selectedEvents.forEach((eventType) => {
      const template = getEventTemplate(eventType);
      const eventBudget = Math.round((totalBudget * template.budgetPercent) / 100);
      const categoryWeights = template.defaultCategories.reduce((sum, category) => {
        return sum + (DEFAULT_CATEGORY_SPLITS[category.slug] || 0.05);
      }, 0);

      template.defaultCategories.forEach((category) => {
        const ratio = (DEFAULT_CATEGORY_SPLITS[category.slug] || 0.05) / Math.max(categoryWeights, 0.01);
        const allocation = Math.round(eventBudget * ratio);
        const existing = totals.get(category.slug);
        if (existing) {
          existing.amount += allocation;
          existing.eventIds.push(eventIdsByType[eventType]);
        } else {
          totals.set(category.slug, {
            name: category.name,
            amount: allocation,
            eventIds: [eventIdsByType[eventType]],
          });
        }
      });
    });

    return Array.from(totals.entries()).map(([slug, value]) => ({
      category_slug: slug,
      category_name: value.name,
      planned_amount: value.amount,
      wedding_event_id: value.eventIds[0] ?? null,
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.brideName.trim() || !formData.groomName.trim() || !formData.city.trim()) {
      toast({
        title: "Missing details",
        description: "Please fill bride name, groom name, and city to continue.",
        variant: "destructive",
      });
      return;
    }

    if (selectedEvents.length === 0) {
      toast({
        title: "Choose at least one event",
        description: "The planner needs at least one event workspace to generate your dashboard.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const weddingPayload = {
        bride_name: formData.brideName.trim(),
        groom_name: formData.groomName.trim(),
        title: createWeddingTitle(formData.brideName, formData.groomName),
        wedding_date: formData.weddingDate || null,
        is_estimated_date: formData.isEstimatedDate,
        budget_range: formData.budgetRange,
        total_budget: totalBudget,
        city: formData.city.trim(),
        location: formData.location.trim() || null,
        guest_count: formData.guestCount,
        wedding_type: formData.weddingType,
        cultural_preferences: selectedPreferences,
        notes: formData.notes.trim() || null,
      };

      const { data: wedding, error: weddingError } = await supabase
        .from("weddings" as any)
        .insert(weddingPayload as any)
        .select()
        .single();

      if (weddingError) throw weddingError;

      await supabase.from("wedding_members" as any).insert({
        wedding_id: wedding.id,
        user_id: user.id,
        display_name: "Owner",
        email: user.email ?? null,
        role: "owner",
        permission_level: "approve",
        status: "active",
      } as any);

      const weddingDate = formData.weddingDate ? new Date(formData.weddingDate) : null;
      const eventsPayload = selectedEvents.map((eventType, index) => {
        const template = getEventTemplate(eventType);
        const eventDate = weddingDate ? new Date(weddingDate) : null;
        if (eventDate) {
          eventDate.setDate(eventDate.getDate() - (selectedEvents.length - index - 1));
        }

        return {
          wedding_id: wedding.id,
          event_type: eventType,
          title: template.label,
          event_date: eventDate ? eventDate.toISOString().slice(0, 10) : null,
          city: formData.city.trim(),
          guest_count: eventType === "wedding" || eventType === "reception" ? formData.guestCount : Math.round(formData.guestCount * 0.55),
          budget_allocated: Math.round((totalBudget * template.budgetPercent) / 100),
          sort_order: index,
        };
      });

      const { data: createdEvents, error: eventsError } = await supabase
        .from("wedding_events" as any)
        .insert(eventsPayload as any)
        .select();

      if (eventsError) throw eventsError;

      const eventIdsByType = Object.fromEntries(
        (createdEvents || []).map((event: any) => [event.event_type, event.id])
      ) as Record<string, string>;

      const requirementsPayload = selectedEvents.flatMap((eventType) => {
        const template = getEventTemplate(eventType);
        const eventId = eventIdsByType[eventType];
        return template.defaultCategories.map((category) => ({
          wedding_event_id: eventId,
          category_slug: category.slug,
          category_name: category.name,
          required_count: category.requiredCount,
        }));
      });

      if (requirementsPayload.length > 0) {
        const { error: requirementsError } = await supabase
          .from("wedding_event_vendor_requirements" as any)
          .insert(requirementsPayload as any);

        if (requirementsError) throw requirementsError;
      }

      const tasksPayload = selectedEvents.flatMap((eventType) => {
        const template = getEventTemplate(eventType);
        const eventId = eventIdsByType[eventType];
        return template.defaultTasks.map((task, index) => ({
          wedding_id: wedding.id,
          wedding_event_id: eventId,
          title: task,
          priority: index === 0 ? "high" : "medium",
          due_date: weddingDate ? new Date(weddingDate.getTime() - (1000 * 60 * 60 * 24 * Math.max(14 - index * 2, 3))).toISOString().slice(0, 10) : null,
        }));
      });

      const commonTasks = [
        "Finalize photographer",
        "Invite relatives",
        "Confirm catering menu",
      ].map((task, index) => ({
        wedding_id: wedding.id,
        title: task,
        priority: index === 0 ? "high" : "medium",
        due_date: weddingDate ? new Date(weddingDate.getTime() - (1000 * 60 * 60 * 24 * (30 - index * 7))).toISOString().slice(0, 10) : null,
      }));

      const { error: tasksError } = await supabase
        .from("wedding_tasks" as any)
        .insert([...tasksPayload, ...commonTasks] as any);

      if (tasksError) throw tasksError;

      const budgetItemsPayload = createBudgetItems(eventIdsByType).map((item) => ({
        wedding_id: wedding.id,
        ...item,
      }));

      const { error: budgetError } = await supabase
        .from("wedding_budget_items" as any)
        .insert(budgetItemsPayload as any);

      if (budgetError) throw budgetError;

      toast({
        title: "Wedding OS ready",
        description: `Your planning dashboard is live with a starting budget of ${formatCurrency(totalBudget)}.`,
      });
      navigate(`/wedding/${wedding.id}`);
    } catch (error: any) {
      toast({
        title: "Could not create wedding dashboard",
        description: error.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-28 pb-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Wedding OS Onboarding
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-semibold mt-5">
                Build your wedding command center in one go
              </h1>
              <p className="text-muted-foreground mt-4 text-lg">
                We will turn your date, budget, events, and preferences into a living dashboard with timelines, budgets, tasks, and vendor recommendations.
              </p>
            </div>

            <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-6">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">Wedding Planning Quiz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bride-name">Bride Name</Label>
                      <Input
                        id="bride-name"
                        value={formData.brideName}
                        onChange={(e) => setFormData((current) => ({ ...current, brideName: e.target.value }))}
                        placeholder="Enter bride name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groom-name">Groom Name</Label>
                      <Input
                        id="groom-name"
                        value={formData.groomName}
                        onChange={(e) => setFormData((current) => ({ ...current, groomName: e.target.value }))}
                        placeholder="Enter groom name"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wedding-date">Wedding Date</Label>
                      <Input
                        id="wedding-date"
                        type="date"
                        value={formData.weddingDate}
                        onChange={(e) => setFormData((current) => ({ ...current, weddingDate: e.target.value }))}
                      />
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={formData.isEstimatedDate}
                          onCheckedChange={(checked) =>
                            setFormData((current) => ({ ...current, isEstimatedDate: Boolean(checked) }))
                          }
                        />
                        This is an estimated date for now
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guest-count">Number of Guests</Label>
                      <Input
                        id="guest-count"
                        type="number"
                        min={10}
                        value={formData.guestCount}
                        onChange={(e) => setFormData((current) => ({ ...current, guestCount: Number(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget-range">Budget Range</Label>
                      <select
                        id="budget-range"
                        value={formData.budgetRange}
                        onChange={(e) => setFormData((current) => ({ ...current, budgetRange: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {WEDDING_BUDGET_RANGES.map((range) => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wedding-type">Wedding Type</Label>
                      <select
                        id="wedding-type"
                        value={formData.weddingType}
                        onChange={(e) => setFormData((current) => ({ ...current, weddingType: e.target.value as WeddingType }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {WEDDING_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData((current) => ({ ...current, city: e.target.value }))}
                        placeholder="Hyderabad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Preferred Location / Area</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData((current) => ({ ...current, location: e.target.value }))}
                        placeholder="Madhapur, Gachibowli, or destination city"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Events Required</Label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {EVENT_TEMPLATES.map((event) => (
                        <label
                          key={event.type}
                          className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 cursor-pointer hover:border-primary/40 transition-colors"
                        >
                          <Checkbox
                            checked={selectedEvents.includes(event.type)}
                            onCheckedChange={() => toggleEvent(event.type)}
                          />
                          <div>
                            <p className="font-medium">{event.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.budgetPercent > 0 ? `${event.budgetPercent}% default allocation` : "Custom allocation"}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Cultural Preferences</Label>
                    <div className="flex flex-wrap gap-2">
                      {CULTURAL_PREFERENCES.map((preference) => (
                        <button
                          key={preference}
                          type="button"
                          onClick={() => togglePreference(preference)}
                          className={`rounded-full px-4 py-2 text-sm transition-colors ${
                            selectedPreferences.includes(preference)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {preference}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="planning-notes">Planning Notes</Label>
                    <Textarea
                      id="planning-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))}
                      rows={4}
                      placeholder="Anything special we should consider like temple wedding, family rituals, destination constraints, or guest travel?"
                    />
                  </div>

                  <Button
                    variant="gold"
                    className="w-full h-12 rounded-xl text-base"
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Creating dashboard..." : "Create My Wedding OS"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/60 h-fit sticky top-28">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">What you will get</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-sm text-muted-foreground">Projected total budget</p>
                    <p className="text-3xl font-display font-semibold mt-1">{formatCurrency(totalBudget)}</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <IndianRupee className="h-4 w-4 text-primary mt-0.5" />
                      <span>Budget buckets generated automatically for your selected events.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarDays className="h-4 w-4 text-primary mt-0.5" />
                      <span>Timeline and event workspaces for {selectedEvents.length} ceremonies.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-4 w-4 text-primary mt-0.5" />
                      <span>Guest-aware event setup with per-event budget and vendor requirements.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5" />
                      <span>Vendor recommendations centered on {formData.city || "your city"} and your selected style.</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-primary/30 p-4">
                    <p className="font-medium">Starter tasks</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>Finalize photographer</li>
                      <li>Pay hall advance</li>
                      <li>Confirm catering menu</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WeddingOnboarding;
