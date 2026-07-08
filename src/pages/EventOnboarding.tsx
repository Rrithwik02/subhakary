import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Baby,
  Building2,
  Church,
  CircleCheckBig,
  CalendarDays,
  Gift,
  Heart,
  Home,
  PartyPopper,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  createEventTitle,
  EVENT_TYPES,
  formatCurrency,
  getBudgetRangeByValue,
  getEventTemplate,
  getServiceRequirementsForEvent,
  WEDDING_BUDGET_RANGES,
  type EventType,
} from "@/lib/wedding-planner";

const SERVICE_SPLITS: Record<string, number> = {
  venue: 0.2,
  catering: 0.22,
  photographer: 0.11,
  videographer: 0.08,
  decorator: 0.14,
  priest: 0.05,
  makeup: 0.06,
  mehendi: 0.04,
  invitation: 0.03,
  gifts: 0.04,
  entertainment: 0.05,
  music: 0.05,
  "mangala-vadyam": 0.04,
  transportation: 0.05,
  accommodation: 0.07,
  planner: 0.06,
  rentals: 0.06,
  florist: 0.05,
  streaming: 0.04,
  cake: 0.03,
  lighting: 0.05,
  staging: 0.06,
  other: 0.05,
};

const EVENT_ICONS: Record<EventType, typeof Heart> = {
  wedding: Heart,
  engagement: Sparkles,
  housewarming: Home,
  "baby-shower": Baby,
  "naming-ceremony": Gift,
  upanayanam: Church,
  birthday: PartyPopper,
  anniversary: CircleCheckBig,
  "religious-function": Church,
  "corporate-event": Building2,
  "other-celebration": Users,
};

const FIELD_BLOCKS = [
  {
    title: "Planning basics",
    fields: ["Event Name", "Event Date", "Location", "Expected Guests", "Budget"],
  },
  {
    title: "Context",
    fields: ["Indoor / Outdoor", "Language", "Religion", "State / Region"],
  },
  {
    title: "Venue readiness",
    fields: ["Need Venue?", "Already Have Venue?", "Destination Event?"],
  },
];

const EventOnboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType>("wedding");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    location: "",
    guestCount: 200,
    budgetRange: WEDDING_BUDGET_RANGES[1].value,
    venueMode: "indoor" as "indoor" | "outdoor",
    language: "Telugu",
    religion: "",
    stateRegion: "",
    needVenue: true,
    alreadyHaveVenue: false,
    destinationEvent: false,
    notes: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, navigate, user]);

  const template = useMemo(() => getEventTemplate(selectedEventType), [selectedEventType]);
  const budgetRange = useMemo(() => getBudgetRangeByValue(formData.budgetRange), [formData.budgetRange]);
  const totalBudget = budgetRange.amount;
  const serviceRequirements = useMemo(() => getServiceRequirementsForEvent(selectedEventType), [selectedEventType]);

  useEffect(() => {
    setSelectedServices(template.defaultCategories.map((category) => category.slug));
  }, [template]);

  const selectedServiceCards = useMemo(
    () => serviceRequirements.filter((service) => selectedServices.includes(service.slug)),
    [serviceRequirements, selectedServices]
  );

  const summary = useMemo(() => {
    const serviceWeight = selectedServiceCards.reduce((sum, service) => {
      return sum + (SERVICE_SPLITS[service.slug] || 0.05);
    }, 0);

    const budgetLines = selectedServiceCards.map((service) => {
      const weight = SERVICE_SPLITS[service.slug] || 0.05;
      const amount = Math.round(totalBudget * (weight / Math.max(serviceWeight, 0.01)));
      return { name: service.name, amount, slug: service.slug };
    });

    const dueDate = formData.eventDate ? new Date(formData.eventDate) : null;
    const timeline = template.defaultTimeline.map((item) => ({
      ...item,
      date: dueDate
        ? new Date(dueDate.getTime() - item.weeksBefore * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : null,
    }));

    return {
      budgetLines,
      timeline,
      missingServices: template.defaultCategories
        .map((category) => category.slug)
        .filter((slug) => !selectedServices.includes(slug)),
    };
  }, [formData.eventDate, selectedServiceCards, selectedServices, template, totalBudget]);

  const toggleService = (slug: string) => {
    setSelectedServices((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    );
  };

  const canContinue =
    selectedEventType &&
    formData.eventDate.trim() &&
    formData.location.trim() &&
    Number(formData.guestCount) > 0 &&
    Number(totalBudget) > 0;

  const createBudgetItems = (eventId: string, eventWorkspaceId: string) => {
    const weights = selectedServiceCards.reduce((sum, service) => {
      return sum + (SERVICE_SPLITS[service.slug] || 0.05);
    }, 0);

    return selectedServiceCards.map((service) => {
      const weight = SERVICE_SPLITS[service.slug] || 0.05;
      const plannedAmount = Math.round(totalBudget * (weight / Math.max(weights, 0.01)));

      return {
        wedding_id: eventId,
        wedding_event_id: eventWorkspaceId,
        category_slug: service.slug,
        category_name: service.name,
        planned_amount: plannedAmount,
        notes: service.requiredFields.join(", "),
      };
    });
  };

  const createTaskItems = (eventId: string, eventWorkspaceId: string) => {
    const eventDate = formData.eventDate ? new Date(formData.eventDate) : null;

    const templateTasks = template.defaultTasks.map((title, index) => ({
      wedding_id: eventId,
      wedding_event_id: eventWorkspaceId,
      title,
      description: template.defaultDocuments[index] || null,
      priority: index === 0 ? "high" : "medium",
      due_date: eventDate
        ? new Date(eventDate.getTime() - (28 - index * 5) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : null,
    }));

    const timelineTasks = template.defaultTimeline.map((item) => ({
      wedding_id: eventId,
      wedding_event_id: eventWorkspaceId,
      title: item.title,
      description: item.description,
      priority: item.weeksBefore <= 8 ? "high" : "medium",
      due_date: eventDate
        ? new Date(eventDate.getTime() - item.weeksBefore * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : null,
    }));

    return [...templateTasks, ...timelineTasks];
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!canContinue) {
      toast({
        title: "Missing details",
        description: "Please add the event date, location, guest count, and budget to continue.",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Choose at least one service",
        description: "We need at least one service category to generate the workspace.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const eventTitle = createEventTitle(selectedEventType, formData.eventName);
      const eventDate = formData.eventDate ? new Date(formData.eventDate) : null;
      const eventNotes = [
        formData.notes.trim(),
        `Language: ${formData.language}`,
        formData.religion ? `Religion: ${formData.religion}` : null,
        formData.stateRegion ? `State / Region: ${formData.stateRegion}` : null,
        `Indoor / Outdoor: ${formData.venueMode}`,
        `Need Venue: ${formData.needVenue ? "Yes" : "No"}`,
        `Already Have Venue: ${formData.alreadyHaveVenue ? "Yes" : "No"}`,
        `Destination Event: ${formData.destinationEvent ? "Yes" : "No"}`,
      ]
        .filter(Boolean)
        .join(" | ");

      const { data: eventRecord, error: eventError } = await supabase
        .from("weddings" as any)
        .insert({
          owner_user_id: user.id,
          bride_name: null,
          groom_name: null,
          title: eventTitle,
          wedding_date: formData.eventDate || null,
          is_estimated_date: false,
          budget_range: formData.budgetRange,
          total_budget: totalBudget,
          city: formData.location.trim(),
          location: formData.location.trim(),
          guest_count: Number(formData.guestCount),
          wedding_type: selectedEventType,
          cultural_preferences: [formData.language, formData.religion].filter(Boolean),
          notes: eventNotes || null,
        } as any)
        .select()
        .single();

      if (eventError) throw eventError;

      const { error: memberError } = await supabase.from("wedding_members" as any).insert({
        wedding_id: eventRecord.id,
        user_id: user.id,
        display_name: user.email?.split("@")[0] || "Owner",
        email: user.email ?? null,
        role: "owner",
        permission_level: "approve",
        status: "active",
      } as any);

      if (memberError) throw memberError;

      const { data: createdEvent, error: eventRowError } = await supabase
        .from("wedding_events" as any)
        .insert({
          wedding_id: eventRecord.id,
          event_type: selectedEventType,
          title: eventTitle,
          event_date: formData.eventDate || null,
          venue: formData.alreadyHaveVenue ? formData.location.trim() : null,
          city: formData.location.trim(),
          guest_count: Number(formData.guestCount),
          budget_allocated: totalBudget,
          notes: template.description,
          sort_order: 0,
        } as any)
        .select()
        .single();

      if (eventRowError) throw eventRowError;

      const requirementsPayload = selectedServiceCards.map((service) => ({
        wedding_event_id: createdEvent.id,
        category_slug: service.slug,
        category_name: service.name,
        required_count: 1,
        notes: service.requiredFields.join(", "),
      }));

      const { error: requirementsError } = await supabase
        .from("wedding_event_vendor_requirements" as any)
        .insert(requirementsPayload as any);

      if (requirementsError) throw requirementsError;

      const { error: tasksError } = await supabase
        .from("wedding_tasks" as any)
        .insert(createTaskItems(eventRecord.id, createdEvent.id) as any);

      if (tasksError) throw tasksError;

      const { error: budgetError } = await supabase
        .from("wedding_budget_items" as any)
        .insert(createBudgetItems(eventRecord.id, createdEvent.id) as any);

      if (budgetError) throw budgetError;

      toast({
        title: "Planning workspace ready",
        description: `Your ${template.label.toLowerCase()} workspace has been created with an initial budget of ${formatCurrency(totalBudget)}.`,
      });
      navigate(`/event/${eventRecord.id}`);
    } catch (error: any) {
      toast({
        title: "Could not create planning workspace",
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
        <div className="container max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Plan an Event
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-semibold mt-5">
                Build a premium event workspace in a few guided steps
              </h1>
              <p className="text-muted-foreground mt-4 text-lg">
                Plan weddings, religious ceremonies, celebrations, and family events with one unified planning engine.
              </p>
            </div>

            <Card className="border-border/60 bg-card/90 backdrop-blur">
              <CardContent className="p-4 md:p-6">
                <div className="grid md:grid-cols-4 gap-3">
                  {["Event Type", "Details", "Services", "AI Plan"].map((label, index) => (
                    <div
                      key={label}
                      className={`rounded-2xl border px-4 py-3 ${
                        step === index ? "border-primary bg-primary/5" : "border-border/60 bg-muted/20"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step {index + 1}</p>
                      <p className="font-medium mt-1">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
                  <div className="space-y-6">
                    {step === 0 && (
                      <div className="space-y-4">
                        <div>
                          <h2 className="font-display text-2xl">Select event type</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            One event, one workspace, same planning engine.
                          </p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {EVENT_TYPES.map((eventType) => {
                            const Icon = EVENT_ICONS[eventType.value];
                            const active = selectedEventType === eventType.value;
                            return (
                              <button
                                key={eventType.value}
                                type="button"
                                onClick={() => setSelectedEventType(eventType.value)}
                                className={`text-left rounded-2xl border p-4 transition-all ${
                                  active
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border/60 bg-background hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{eventType.label}</p>
                                      <p className="text-xs text-muted-foreground">{eventType.description}</p>
                                    </div>
                                  </div>
                                  {active && <Badge>Selected</Badge>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-display text-2xl">Event details</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Collect only the essentials. Everything else can be refined later.
                          </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="event-name">Event Name</Label>
                            <Input
                              id="event-name"
                              value={formData.eventName}
                              onChange={(e) => setFormData((current) => ({ ...current, eventName: e.target.value }))}
                              placeholder={`${template.label} at ${formData.location || "your venue"}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="event-date">Event Date</Label>
                            <Input
                              id="event-date"
                              type="date"
                              value={formData.eventDate}
                              onChange={(e) => setFormData((current) => ({ ...current, eventDate: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="guest-count">Expected Guests</Label>
                            <Input
                              id="guest-count"
                              type="number"
                              min={1}
                              value={formData.guestCount}
                              onChange={(e) => setFormData((current) => ({ ...current, guestCount: Number(e.target.value) || 0 }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => setFormData((current) => ({ ...current, location: e.target.value }))}
                              placeholder="Hyderabad, Vijayawada, Tirupati..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="budget">Budget</Label>
                            <select
                              id="budget"
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
                            <Label htmlFor="venue-mode">Indoor / Outdoor</Label>
                            <select
                              id="venue-mode"
                              value={formData.venueMode}
                              onChange={(e) =>
                                setFormData((current) => ({
                                  ...current,
                                  venueMode: e.target.value as "indoor" | "outdoor",
                                }))
                              }
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="indoor">Indoor</option>
                              <option value="outdoor">Outdoor</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Input
                              id="language"
                              value={formData.language}
                              onChange={(e) => setFormData((current) => ({ ...current, language: e.target.value }))}
                              placeholder="Telugu, Tamil, English..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="religion">Religion</Label>
                            <Input
                              id="religion"
                              value={formData.religion}
                              onChange={(e) => setFormData((current) => ({ ...current, religion: e.target.value }))}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="state-region">State / Region</Label>
                            <Input
                              id="state-region"
                              value={formData.stateRegion}
                              onChange={(e) => setFormData((current) => ({ ...current, stateRegion: e.target.value }))}
                              placeholder="Andhra Pradesh, Telangana, Karnataka..."
                            />
                          </div>
                          <label className="flex items-center gap-2 rounded-xl border border-border/60 px-4 py-3">
                            <Checkbox
                              checked={formData.needVenue}
                              onCheckedChange={(checked) =>
                                setFormData((current) => ({ ...current, needVenue: Boolean(checked) }))
                              }
                            />
                            <span className="text-sm">Need venue help</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl border border-border/60 px-4 py-3">
                            <Checkbox
                              checked={formData.alreadyHaveVenue}
                              onCheckedChange={(checked) =>
                                setFormData((current) => ({ ...current, alreadyHaveVenue: Boolean(checked) }))
                              }
                            />
                            <span className="text-sm">Already have a venue</span>
                          </label>
                          <label className="flex items-center gap-2 rounded-xl border border-border/60 px-4 py-3 md:col-span-2">
                            <Checkbox
                              checked={formData.destinationEvent}
                              onCheckedChange={(checked) =>
                                setFormData((current) => ({ ...current, destinationEvent: Boolean(checked) }))
                              }
                            />
                            <span className="text-sm">Destination event</span>
                          </label>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Planning Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))}
                            rows={4}
                            placeholder="Share traditions, guest travel notes, vendor preferences, or anything special we should know."
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-display text-2xl">Services required</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Pick the services you need now. You can edit everything later.
                          </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          {serviceRequirements.map((service) => {
                            const active = selectedServices.includes(service.slug);
                            return (
                              <button
                                key={service.slug}
                                type="button"
                                onClick={() => toggleService(service.slug)}
                                className={`rounded-2xl border p-4 text-left transition-all ${
                                  active
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border/60 bg-background hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                                  </div>
                                  <Checkbox checked={active} />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {service.requiredFields.map((field) => (
                                    <span
                                      key={field}
                                      className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                                    >
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="font-display text-2xl">AI planning preview</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Review the generated workspace before we create it.
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="border-border/60">
                            <CardContent className="p-5">
                              <p className="text-sm text-muted-foreground">Event type</p>
                              <p className="text-xl font-semibold mt-1">{template.label}</p>
                              <p className="text-sm text-muted-foreground mt-2">{template.description}</p>
                            </CardContent>
                          </Card>
                          <Card className="border-border/60">
                            <CardContent className="p-5">
                              <p className="text-sm text-muted-foreground">Budget</p>
                              <p className="text-xl font-semibold mt-1">{formatCurrency(totalBudget)}</p>
                              <p className="text-sm text-muted-foreground mt-2">{selectedServices.length} service categories selected</p>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="font-medium mb-2">Generated timeline</p>
                            <div className="space-y-3">
                              {summary.timeline.map((item) => (
                                <div key={item.title} className="rounded-2xl border border-border/60 p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                      <p className="font-medium">{item.title}</p>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Badge variant="outline">{item.date || "Date pending"}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium mb-2">Budget allocation</p>
                              <div className="space-y-2">
                                {summary.budgetLines.map((line) => (
                                  <div key={line.slug} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                                    <span className="text-sm">{line.name}</span>
                                    <span className="text-sm font-medium">{formatCurrency(line.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium mb-2">AI reminders</p>
                              <div className="space-y-2">
                                {template.recommendedReminders.map((reminder) => (
                                  <div key={reminder} className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
                                    {reminder}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {summary.missingServices.length > 0 && (
                            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
                              <p className="font-medium">Optional services not selected</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {summary.missingServices.length} categories can still be added later from the workspace.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Card className="border-border/60 sticky top-28">
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
                            <CalendarDays className="h-4 w-4 text-primary mt-0.5" />
                            <span>Timeline, checklist, and payment milestones</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Users className="h-4 w-4 text-primary mt-0.5" />
                            <span>Guest, vendor, and booking workflows</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <UtensilsCrossed className="h-4 w-4 text-primary mt-0.5" />
                            <span>Dynamic service requirements and vendor categories</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                            <span>AI recommendations, reminders, and risk detection</span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-3">
                          <p className="font-medium">Required fields by service</p>
                          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                            {selectedServiceCards.map((service) => (
                              <div key={service.slug} className="rounded-xl bg-muted/40 p-3">
                                <p className="text-sm font-medium">{service.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">{service.requiredFields.join(" • ")}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex flex-col gap-3">
                      {step > 0 && (
                        <Button variant="outline" className="rounded-xl" onClick={() => setStep((current) => current - 1)}>
                          Back
                        </Button>
                      )}

                      {step < 3 ? (
                        <Button
                          variant="gold"
                          className="rounded-xl"
                          disabled={step === 0 ? !selectedEventType : step === 1 ? !canContinue : selectedServices.length === 0}
                          onClick={() => setStep((current) => current + 1)}
                        >
                          Continue
                        </Button>
                      ) : (
                        <Button
                          variant="gold"
                          className="rounded-xl"
                          disabled={submitting}
                          onClick={handleSubmit}
                        >
                          {submitting ? "Creating workspace..." : "Start Planning"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {FIELD_BLOCKS.map((block) => (
                <Card key={block.title} className="border-border/60">
                  <CardContent className="p-5">
                    <p className="font-medium">{block.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {block.fields.map((field) => (
                        <Badge key={field} variant="outline" className="rounded-full">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EventOnboarding;
