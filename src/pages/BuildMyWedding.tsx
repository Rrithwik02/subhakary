import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Layers3, RefreshCw, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWeddingEvent } from "@/hooks/useWeddingEvent";
import { useProviderComparison } from "@/hooks/useProviderComparison";
import { supabase } from "@/integrations/supabase/client";
import { VENDOR_LANES, normalizePlanningCategory } from "@/lib/weddingPlanning";
import {
  SIMULATION_TEMPLATES,
  buildSimulationSelections,
  computeSimulationSummary,
  getEstimatedProviderPrice,
  getTemplateForWedding,
  type SimulationBundle,
  type SimulationProvider,
} from "@/lib/weddingSimulation";
import { computeReliabilityInsight, computeTrustInsight } from "@/lib/vendorInsights";

type BookingSeed = {
  status: string;
  service_providers?: {
    id?: string | null;
    business_name?: string | null;
    category?: { name?: string | null } | null;
  } | null;
};

type SavedScenario = {
  id: string;
  name: string;
  eventId: string | null;
  templateId: string;
  selectedProviders: Record<string, string>;
  savedAt: string;
};

const scenarioStorageKey = (eventId?: string | null) => `subhakary:wedding-scenarios:${eventId || "default"}`;
const draftStorageKey = (eventId?: string | null) => `subhakary:wedding-scenarios-draft:${eventId || "default"}`;

const BuildMyWedding = () => {
  const { event } = useWeddingEvent();
  const { compareList } = useProviderComparison();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string>>({});
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  const [providers, setProviders] = useState<SimulationProvider[]>([]);
  const [bundles, setBundles] = useState<SimulationBundle[]>([]);
  const [bookings, setBookings] = useState<BookingSeed[]>([]);

  useEffect(() => {
    const defaultTemplate = getTemplateForWedding({
      totalBudget: event?.total_budget,
      weddingStyle: event?.wedding_style,
    });
    setSelectedTemplateId((current) => current || defaultTemplate.id);
  }, [event]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawScenarios = window.localStorage.getItem(scenarioStorageKey(event?.id));
    const rawDraft = window.localStorage.getItem(draftStorageKey(event?.id));
    setSavedScenarios(rawScenarios ? (JSON.parse(rawScenarios) as SavedScenario[]) : []);

    if (rawDraft) {
      const draft = JSON.parse(rawDraft) as { templateId?: string; selectedProviders?: Record<string, string> };
      if (draft.templateId) setSelectedTemplateId((current) => current || draft.templateId || "");
      if (draft.selectedProviders) {
        setSelectedProviders((current) => (Object.keys(current).length ? current : draft.selectedProviders || {}));
      }
    }
  }, [event?.id]);

  useEffect(() => {
    (async () => {
      const [{ data: providerRows }, { data: bundleRows }, { data: bookingRows }] = await Promise.all([
        supabase
          .from("public_service_providers")
          .select("id,business_name,base_price,rating,total_reviews,city,specializations,url_slug,is_verified,is_premium,experience_years,category:service_categories(name)")
          .eq("status", "approved")
          .order("rating", { ascending: false }),
        supabase
          .from("service_bundles")
          .select("id,provider_id,bundle_name,discounted_price,max_guests")
          .eq("is_active", true)
          .order("discounted_price", { ascending: true }),
        event?.id
          ? supabase
              .from("bookings")
              .select("status,service_providers(id,business_name,category:service_categories(name))")
              .eq("event_id", event.id)
          : Promise.resolve({ data: [] as BookingSeed[] }),
      ]);

      setProviders((providerRows as SimulationProvider[] | null) ?? []);
      setBundles((bundleRows as SimulationBundle[] | null) ?? []);
      setBookings((bookingRows as BookingSeed[] | null) ?? []);
    })();
  }, [event?.id]);

  const activeTemplate =
    SIMULATION_TEMPLATES.find((template) => template.id === selectedTemplateId) ||
    getTemplateForWedding({ totalBudget: event?.total_budget, weddingStyle: event?.wedding_style });

  const laneOptions = useMemo(() => {
    return VENDOR_LANES.map((lane) => ({
      ...lane,
      providers: providers
        .filter((provider) => normalizePlanningCategory(provider.category?.name) === lane.label)
        .slice(0, 12),
    }));
  }, [providers]);

  useEffect(() => {
    if (!providers.length) return;
    setSelectedProviders((current) => {
      if (Object.keys(current).length > 0) return current;

      const next: Record<string, string> = {};
      bookings.forEach((booking) => {
        if (!booking.service_providers?.id) return;
        const lane = normalizePlanningCategory(booking.service_providers.category?.name);
        next[lane] = booking.service_providers.id;
      });

      compareList.forEach((provider) => {
        const lane = normalizePlanningCategory(provider.category?.name);
        if (!next[lane]) next[lane] = provider.id;
      });

      return next;
    });
  }, [bookings, compareList, providers]);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedTemplateId) return;
    window.localStorage.setItem(
      draftStorageKey(event?.id),
      JSON.stringify({
        templateId: selectedTemplateId,
        selectedProviders,
      }),
    );
  }, [event?.id, selectedProviders, selectedTemplateId]);

  const applyAutoBuild = () => {
    const autoSelections = buildSimulationSelections({
      providers,
      bundles,
      weddingStyle: event?.wedding_style,
    });
    const next: Record<string, string> = {};
    autoSelections.forEach((selection) => {
      next[selection.lane] = selection.provider.id;
    });
    setSelectedProviders(next);
  };

  const applyTemplateDefaults = () => {
    const next: Record<string, string> = {};
    laneOptions.forEach((lane) => {
      const chosen = lane.providers[0];
      if (chosen) next[lane.label] = chosen.id;
    });
    setSelectedProviders(next);
  };

  const selectedSelections = useMemo(() => {
    return VENDOR_LANES.flatMap((lane) => {
      const providerId = selectedProviders[lane.label];
      const provider = providers.find((item) => item.id === providerId);
      if (!provider) return [];
      const price = getEstimatedProviderPrice({ provider, bundles });
      return [
        {
          lane: lane.label,
          provider,
          estimatedPrice: price.estimatedPrice,
          source: price.source,
          bundleName: price.bundleName,
        },
      ];
    });
  }, [bundles, providers, selectedProviders]);

  const summary = computeSimulationSummary({
    selections: selectedSelections,
    totalBudget: event?.total_budget,
    weddingStyle: event?.wedding_style,
    template: activeTemplate,
  });

  const recommendedSelections = useMemo(
    () =>
      buildSimulationSelections({
        providers,
        bundles,
        weddingStyle: event?.wedding_style,
      }),
    [bundles, event?.wedding_style, providers],
  );

  const saveScenario = () => {
    const nextScenario: SavedScenario = {
      id: `${Date.now()}`,
      name: scenarioName.trim() || `${activeTemplate.name} build`,
      eventId: event?.id || null,
      templateId: selectedTemplateId,
      selectedProviders,
      savedAt: new Date().toISOString(),
    };

    const nextScenarios = [nextScenario, ...savedScenarios].slice(0, 8);
    setSavedScenarios(nextScenarios);
    setScenarioName("");

    if (typeof window !== "undefined") {
      window.localStorage.setItem(scenarioStorageKey(event?.id), JSON.stringify(nextScenarios));
    }
  };

  const loadScenario = (scenario: SavedScenario) => {
    setSelectedTemplateId(scenario.templateId);
    setSelectedProviders(scenario.selectedProviders);
  };

  const deleteScenario = (scenarioId: string) => {
    const nextScenarios = savedScenarios.filter((scenario) => scenario.id !== scenarioId);
    setSavedScenarios(nextScenarios);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(scenarioStorageKey(event?.id), JSON.stringify(nextScenarios));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <SEOHead title="Build My Wedding | Subhakary" description="Simulate your full wedding plan, budget split, vendor fit, and style consistency." />
      <Navbar />

      <section className="px-4 pb-16 pt-24 md:pt-28">
        <div className="container mx-auto max-w-7xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <Badge variant="secondary" className="mb-3">Build My Wedding</Badge>
            <h1 className="text-3xl font-bold md:text-5xl">See the whole wedding, not just isolated vendors</h1>
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">
              Build a full wedding plan, watch the budget move live, and see whether the vendor mix actually fits your style and plan.
            </p>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Simulation summary
                </CardTitle>
                <CardDescription>
                  Built around your current wedding profile{event?.wedding_style ? ` - ${event.wedding_style}` : ""}.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-sm text-muted-foreground">Estimated total</p>
                  <p className="mt-2 text-2xl font-semibold">Rs {Math.round(summary.totalCost).toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-sm text-muted-foreground">Budget status</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.budgetFit}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event?.total_budget
                      ? `${summary.remainingBudget >= 0 ? "Rs " + Math.round(summary.remainingBudget).toLocaleString("en-IN") + " left" : "Rs " + Math.round(Math.abs(summary.remainingBudget)).toLocaleString("en-IN") + " over"}`
                      : "Add a wedding budget to score this properly."}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-sm text-muted-foreground">Style consistency</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.styleScore}/100</p>
                </div>
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-sm text-muted-foreground">Coverage</p>
                  <p className="mt-2 text-2xl font-semibold">{Math.round(summary.coverage * 100)}%</p>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedSelections.length}/{VENDOR_LANES.length} planning lanes filled.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers3 className="h-5 w-5 text-primary" />
                  Template
                </CardTitle>
                <CardDescription>Start from a wedding shape, then tune each lane.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIMULATION_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="rounded-xl border p-4 text-sm">
                  <p className="font-medium">{activeTemplate.name}</p>
                  <p className="mt-1 text-muted-foreground">{activeTemplate.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={applyAutoBuild}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Auto-build from my plan
                  </Button>
                  <Button variant="outline" onClick={applyTemplateDefaults}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Fill with top picks
                  </Button>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm font-medium">Saved scenarios</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your current draft auto-saves locally. Save named builds when you want to compare different wedding directions.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={scenarioName}
                      onChange={(event) => setScenarioName(event.target.value)}
                      placeholder="Name this build"
                    />
                    <Button onClick={saveScenario}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                  {savedScenarios.length ? (
                    <div className="mt-3 space-y-2">
                      {savedScenarios.map((scenario) => (
                        <div key={scenario.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                          <div>
                            <p className="font-medium">{scenario.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Saved {new Date(scenario.savedAt).toLocaleDateString("en-IN")} with {Object.keys(scenario.selectedProviders).length} lanes filled
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => loadScenario(scenario)}>
                              Load
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteScenario(scenario.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Build lanes</CardTitle>
                <CardDescription>Pick one lead vendor per lane to simulate the whole wedding stack.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {laneOptions.map((lane) => {
                  const selectedProviderId = selectedProviders[lane.label];
                  const selectedProvider = lane.providers.find((provider) => provider.id === selectedProviderId);
                  const selectedPrice = selectedProvider ? getEstimatedProviderPrice({ provider: selectedProvider, bundles }) : null;
                  const trust = selectedProvider
                    ? computeTrustInsight({
                        isVerified: (selectedProvider as any).is_verified,
                        isPremium: (selectedProvider as any).is_premium,
                        rating: selectedProvider.rating,
                        totalReviews: selectedProvider.total_reviews,
                        experienceYears: (selectedProvider as any).experience_years,
                        publishedPackages: bundles.filter((bundle) => bundle.provider_id === selectedProvider.id).length,
                      })
                    : null;

                  return (
                    <div key={lane.label} className="rounded-xl border p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{lane.label}</p>
                          <p className="text-xs text-muted-foreground">Target shortlist: {lane.targetCount}</p>
                        </div>
                        {selectedProvider ? <Badge variant="secondary">Selected</Badge> : <Badge variant="outline">Open</Badge>}
                      </div>

                      <Select
                        value={selectedProviderId || "none"}
                        onValueChange={(value) =>
                          setSelectedProviders((current) => {
                            const next = { ...current };
                            if (value === "none") delete next[lane.label];
                            else next[lane.label] = value;
                            return next;
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Choose ${lane.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No provider selected</SelectItem>
                          {lane.providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.business_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedProvider ? (
                        <div className="mt-3 rounded-xl border bg-muted/25 p-3 text-sm">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{selectedProvider.rating?.toFixed(1) || "New"} rating</Badge>
                            {trust ? <Badge variant="secondary">{trust.label}</Badge> : null}
                          </div>
                          <p className="mt-3 font-medium">{selectedProvider.business_name}</p>
                          <p className="mt-1 text-muted-foreground">
                            Estimated cost: Rs {Math.round(selectedPrice?.estimatedPrice || 0).toLocaleString("en-IN")}
                            {selectedPrice?.bundleName ? ` - ${selectedPrice.bundleName}` : ""}
                          </p>
                          <Button asChild variant="ghost" size="sm" className="mt-2 px-0">
                            <Link to={`/provider/${selectedProvider.url_slug || selectedProvider.id}`}>
                              View profile <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">No provider selected in this lane yet.</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Budget split</CardTitle>
                  <CardDescription>Compare the build against the template's intended shape.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.categoryBreakdown.map((row) => (
                    <div key={row.lane}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">{row.lane}</span>
                        <span className="text-muted-foreground">
                          Rs {Math.round(row.amount).toLocaleString("en-IN")} - target {Math.round(row.targetShare * 100)}%
                        </span>
                      </div>
                      <Progress value={Math.round(Math.min(100, row.share * 100))} className="h-2.5" />
                      {row.providerName ? <p className="mt-1 text-xs text-muted-foreground">{row.providerName}</p> : null}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Recommended starter build</CardTitle>
                  <CardDescription>Auto-picked from current marketplace data and your wedding style.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendedSelections.slice(0, 5).map((selection) => (
                    <div key={selection.lane} className="rounded-xl border p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{selection.lane}</p>
                          <p className="text-muted-foreground">{selection.provider.business_name}</p>
                        </div>
                        <Badge variant="outline">Rs {Math.round(selection.estimatedPrice).toLocaleString("en-IN")}</Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={applyAutoBuild}>
                    Apply this build
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Why this is useful</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Couples do not think in isolated vendor cards. This mode lets you see the total cost, the style fit, and where the plan gets too thin or too expensive.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BuildMyWedding;
