import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, CheckCircle2, Crown, MapPin, Sparkles, Star, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProviderComparison } from "@/hooks/useProviderComparison";
import { useWeddingEvent } from "@/hooks/useWeddingEvent";
import { supabase } from "@/integrations/supabase/client";
import {
  buildTradeoffNotes,
  computeBudgetFit,
  computePriceBenchmark,
  computeReliabilityInsight,
  computeResponseHistoryInsight,
  computeTrustInsight,
} from "@/lib/vendorInsights";
import { normalizePlanningCategory } from "@/lib/weddingPlanning";

const COMPARE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-compare`;

type BundleRow = {
  id: string;
  provider_id: string;
  bundle_name: string;
  cancellation_policy: string | null;
  discounted_price: number;
  inclusions: string[] | null;
  exclusions: string[] | null;
  min_advance_percentage: number | null;
  max_guests: number | null;
  response_time_hours: number | null;
  terms_conditions: string | null;
};

type ProviderDetail = {
  id: string | null;
  availability_status: string | null;
  advance_booking_days: number | null;
  advance_payment_percentage: number | null;
  base_price: number | null;
  business_name: string | null;
  travel_charges_applicable: boolean | null;
  requires_advance_payment: boolean | null;
  pricing_info: string | null;
  url_slug: string | null;
};

type CompareProvider = ReturnType<typeof useProviderComparison>["compareList"][number] & {
  detail?: ProviderDetail | null;
  bundles: BundleRow[];
};

const formatCurrency = (value?: number | null) =>
  typeof value === "number" ? `Rs ${Math.round(value).toLocaleString("en-IN")}` : "Contact for price";

const getProviderStartingPrice = (provider: CompareProvider) => {
  if (typeof provider.base_price === "number") return formatCurrency(provider.base_price);
  if (typeof provider.detail?.base_price === "number") return formatCurrency(provider.detail.base_price);
  return provider.detail?.pricing_info || "Contact for price";
};

const getProviderRoute = (provider: CompareProvider) =>
  `/provider/${provider.url_slug || provider.detail?.url_slug || provider.detail?.id || provider.id}`;

const Compare = () => {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompare } = useProviderComparison();
  const { event } = useWeddingEvent();
  const [aiVerdict, setAiVerdict] = useState<{ verdict: string; providers: { provider_id: string; tagline: string }[] } | null>(null);
  const [providerDetails, setProviderDetails] = useState<Record<string, ProviderDetail>>({});
  const [providerBundles, setProviderBundles] = useState<Record<string, BundleRow[]>>({});
  const [providerBookings, setProviderBookings] = useState<Record<string, Array<{
    status: string | null;
    service_date: string | null;
    completion_confirmed_by_customer: boolean | null;
    completion_confirmed_by_provider: boolean | null;
    completion_status: string | null;
    cancelled_at: string | null;
  }>>>({});
  const [providerResponseHistory, setProviderResponseHistory] = useState<Record<string, ReturnType<typeof computeResponseHistoryInsight>>>({});
  const [peerProviders, setPeerProviders] = useState<Array<{ id: string; city: string | null; category_id: string | null; base_price: number | null }>>([]);

  useEffect(() => {
    if (compareList.length < 2) return;

    (async () => {
      const providerIds = compareList.map((provider) => provider.id);
      const categoryIds = Array.from(new Set(compareList.map((provider) => provider.category_id).filter(Boolean)));
      const [{ data: detailRows }, { data: bundleRows }, { data: peerRows }, { data: bookingRows }, { data: conversationRows }] = await Promise.all([
        supabase
          .from("public_service_providers")
          .select("id,business_name,base_price,availability_status,advance_booking_days,advance_payment_percentage,travel_charges_applicable,requires_advance_payment,pricing_info,url_slug")
          .in("id", providerIds),
        supabase
          .from("service_bundles")
          .select("id,provider_id,bundle_name,discounted_price,inclusions,exclusions,min_advance_percentage,max_guests,response_time_hours,cancellation_policy,terms_conditions")
          .in("provider_id", providerIds)
          .eq("is_active", true)
          .order("discounted_price"),
        supabase
          .from("public_service_providers")
          .select("id,city,category_id,base_price")
          .in("category_id", categoryIds.length ? categoryIds : [""]),
        supabase
          .from("bookings")
          .select("provider_id,status,service_date,completion_confirmed_by_customer,completion_confirmed_by_provider,completion_status,cancelled_at")
          .in("provider_id", providerIds),
        supabase
          .from("inquiry_conversations")
          .select("id,provider_id,user_id")
          .in("provider_id", providerIds),
      ]);

      const conversationIds = (((conversationRows as Array<{ id: string; provider_id: string; user_id: string }> | null) ?? [])).map(
        (conversation) => conversation.id,
      );
      const { data: messageRows } = conversationIds.length
        ? await supabase
            .from("inquiry_messages")
            .select("conversation_id,sender_id,created_at")
            .in("conversation_id", conversationIds)
        : { data: [] };

      const detailsMap = ((detailRows as ProviderDetail[] | null) ?? []).reduce<Record<string, ProviderDetail>>((acc, row) => {
        if (row.id) acc[row.id] = row;
        return acc;
      }, {});
      const bundlesMap = ((bundleRows as BundleRow[] | null) ?? []).reduce<Record<string, BundleRow[]>>((acc, row) => {
        acc[row.provider_id] = [...(acc[row.provider_id] || []), row];
        return acc;
      }, {});
      const bookingMap = (((bookingRows as Array<{
        provider_id: string;
        status: string | null;
        service_date: string | null;
        completion_confirmed_by_customer: boolean | null;
        completion_confirmed_by_provider: boolean | null;
        completion_status: string | null;
        cancelled_at: string | null;
      }> | null) ?? [])).reduce<Record<string, Array<{
        status: string | null;
        service_date: string | null;
        completion_confirmed_by_customer: boolean | null;
        completion_confirmed_by_provider: boolean | null;
        completion_status: string | null;
        cancelled_at: string | null;
      }>>>((acc, row) => {
        acc[row.provider_id] = [...(acc[row.provider_id] || []), row];
        return acc;
      }, {});
      const responseMap = (((conversationRows as Array<{ id: string; provider_id: string; user_id: string }> | null) ?? [])).reduce<
        Record<string, ReturnType<typeof computeResponseHistoryInsight>>
      >((acc, conversation) => {
        const providerConversations = (((conversationRows as Array<{ id: string; provider_id: string; user_id: string }> | null) ?? [])).filter(
          (item) => item.provider_id === conversation.provider_id,
        );
        if (acc[conversation.provider_id]) return acc;
        acc[conversation.provider_id] = computeResponseHistoryInsight({
          conversations: providerConversations.map((item) => ({ id: item.id, user_id: item.user_id })),
          messages: ((messageRows as Array<{ conversation_id: string; sender_id: string; created_at: string }> | null) ?? []).filter(
            (message) => providerConversations.some((item) => item.id === message.conversation_id),
          ),
        });
        return acc;
      }, {});

      setProviderDetails(detailsMap);
      setProviderBundles(bundlesMap);
      setProviderBookings(bookingMap);
      setProviderResponseHistory(responseMap);
      setPeerProviders((peerRows as Array<{ id: string; city: string | null; category_id: string | null; base_price: number | null }> | null) ?? []);
    })();
  }, [compareList]);

  useEffect(() => {
    if (compareList.length < 2) return;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(COMPARE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providers: compareList }),
      });
      if (response.ok) setAiVerdict(await response.json());
    })();
  }, [compareList]);

  const enrichedProviders = useMemo<CompareProvider[]>(
    () =>
      compareList.map((provider) => ({
        ...provider,
        detail: providerDetails[provider.id] || null,
        bundles: providerBundles[provider.id] || [],
      })),
    [compareList, providerBundles, providerDetails],
  );

  const providerInsights = useMemo(() => {
    const budgetTargets = new Map<string, number>();
    return enrichedProviders.reduce<Record<string, {
      benchmark: ReturnType<typeof computePriceBenchmark>;
      budgetFit: ReturnType<typeof computeBudgetFit>;
      trust: ReturnType<typeof computeTrustInsight>;
      reliability: ReturnType<typeof computeReliabilityInsight>;
      responseTimeHours: number | null;
      tradeoffs: string[];
    }>>((acc, provider) => {
      const responseTimeHours =
        provider.bundles.find((bundle) => typeof bundle.response_time_hours === "number")?.response_time_hours ?? null;
      const packagesWithDisclosure = provider.bundles.filter(
        (bundle) =>
          (bundle.inclusions?.length || 0) > 0 ||
          (bundle.exclusions?.length || 0) > 0 ||
          !!bundle.cancellation_policy ||
          !!bundle.terms_conditions,
      ).length;
      const benchmark = computePriceBenchmark(
        {
          id: provider.id,
          city: provider.city,
          category_id: provider.category_id,
          base_price: provider.base_price ?? provider.detail?.base_price,
          business_name: provider.business_name,
        },
        peerProviders.length ? peerProviders : enrichedProviders,
      );
      const budgetFit = computeBudgetFit({
        providerPrice: provider.base_price ?? provider.detail?.base_price,
        categoryName: provider.category?.name,
        context: {
          totalBudget: event?.total_budget,
          city: event?.city,
          plannedCategoryBudget: budgetTargets.get(normalizePlanningCategory(provider.category?.name)) || null,
        },
      });
      const trust = computeTrustInsight({
        isVerified: provider.is_verified,
        isPremium: provider.is_premium,
        rating: provider.rating,
        totalReviews: provider.total_reviews,
        experienceYears: provider.experience_years,
        responseTimeHours,
        publishedPackages: provider.bundles.length,
        packagesWithDisclosure,
      });
      const reliability = computeReliabilityInsight({
        bookings: providerBookings[provider.id] || [],
        responseTimeHours,
        responseHistory: providerResponseHistory[provider.id] || null,
        trust,
      });

      acc[provider.id] = {
        benchmark,
        budgetFit,
        trust,
        reliability,
        responseTimeHours,
        tradeoffs: buildTradeoffNotes({
          benchmark,
          budgetFit,
          trust: reliability.score > trust.score ? { ...trust, score: reliability.score } : trust,
          responseTimeHours,
          packageCount: provider.bundles.length,
        }),
      };
      return acc;
    }, {});
  }, [enrichedProviders, event, peerProviders, providerBookings, providerResponseHistory]);

  const spotlightCards = useMemo(() => {
    if (!enrichedProviders.length) return [];

    const byValue = [...enrichedProviders].sort((a, b) => {
      const aInsight = providerInsights[a.id];
      const bInsight = providerInsights[b.id];
      const valueA =
        (aInsight?.budgetFit.label === "YES" ? 3 : aInsight?.budgetFit.label === "STRETCH" ? 2 : 0) +
        (aInsight?.benchmark.label === "Great deal" ? 2 : aInsight?.benchmark.label === "Fair price" ? 1 : 0) +
        (aInsight?.trust.score || 0) / 100;
      const valueB =
        (bInsight?.budgetFit.label === "YES" ? 3 : bInsight?.budgetFit.label === "STRETCH" ? 2 : 0) +
        (bInsight?.benchmark.label === "Great deal" ? 2 : bInsight?.benchmark.label === "Fair price" ? 1 : 0) +
        (bInsight?.trust.score || 0) / 100;
      return valueB - valueA;
    })[0];

    const byTrust = [...enrichedProviders].sort(
      (a, b) => (providerInsights[b.id]?.trust.score || 0) - (providerInsights[a.id]?.trust.score || 0),
    )[0];
    const byResponse = [...enrichedProviders]
      .filter((provider) => providerInsights[provider.id]?.responseTimeHours)
      .sort((a, b) => (providerInsights[a.id]?.responseTimeHours || 999) - (providerInsights[b.id]?.responseTimeHours || 999))[0];

    return [
      byValue
        ? { title: "Best value fit", provider: byValue, note: providerInsights[byValue.id]?.benchmark.detail }
        : null,
      byTrust
        ? { title: "Strongest visible proof", provider: byTrust, note: providerInsights[byTrust.id]?.trust.summary }
        : null,
      byResponse
        ? { title: "Fastest published reply", provider: byResponse, note: `About ${providerInsights[byResponse.id]?.responseTimeHours} hours.` }
        : null,
    ].filter(Boolean) as Array<{ title: string; provider: CompareProvider; note?: string }>;
  }, [enrichedProviders, providerInsights]);

  if (compareList.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 pb-12 pt-32">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="mb-4 text-2xl font-bold">Not enough providers to compare</h1>
            <p className="mb-6 text-muted-foreground">Please select at least 2 providers to compare.</p>
            <Button onClick={() => navigate("/providers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Providers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const comparisonRows = [
    {
      label: "Rating",
      render: (provider: CompareProvider) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="font-semibold">{provider.rating?.toFixed(1) || "New"}</span>
          <span className="text-sm text-muted-foreground">({provider.total_reviews || 0})</span>
        </div>
      ),
    },
    {
      label: "Starting price",
      render: (provider: CompareProvider) => <span className="font-semibold text-primary">{getProviderStartingPrice(provider)}</span>,
    },
    {
      label: "Market benchmark",
      render: (provider: CompareProvider) => {
        const insight = providerInsights[provider.id];
        return <span>{insight?.benchmark.label || "Fair price"}</span>;
      },
    },
    {
      label: "Budget fit",
      render: (provider: CompareProvider) => {
        const insight = providerInsights[provider.id];
        return (
          <Badge
            variant={
              insight?.budgetFit.label === "YES"
                ? "default"
                : insight?.budgetFit.label === "STRETCH"
                  ? "secondary"
                  : insight?.budgetFit.label === "NO"
                    ? "destructive"
                    : "outline"
            }
          >
            {insight?.budgetFit.label || "UNKNOWN"}
          </Badge>
        );
      },
    },
    {
      label: "Package range",
      render: (provider: CompareProvider) => {
        if (!provider.bundles.length) return <span className="text-sm text-muted-foreground">No packages listed</span>;
        const first = provider.bundles[0]?.discounted_price;
        const last = provider.bundles[provider.bundles.length - 1]?.discounted_price;
        return <span>{formatCurrency(first)} - {formatCurrency(last)}</span>;
      },
    },
    {
      label: "Package depth",
      render: (provider: CompareProvider) => <span>{provider.bundles.length ? `${provider.bundles.length} active packages` : "Custom quote only"}</span>,
    },
    {
      label: "Lead time",
      render: (provider: CompareProvider) => (
        <span>{provider.detail?.advance_booking_days ? `${provider.detail.advance_booking_days}+ days ahead` : "Ask vendor"}</span>
      ),
    },
    {
      label: "Response time",
      render: (provider: CompareProvider) => {
        const responseTime = provider.bundles.find((bundle) => bundle.response_time_hours)?.response_time_hours;
        return <span>{responseTime ? `About ${responseTime}h` : "Not shared"}</span>;
      },
    },
    {
      label: "Availability",
      render: (provider: CompareProvider) => (
        <Badge variant={provider.detail?.availability_status === "online" ? "default" : "secondary"} className="capitalize">
          {provider.detail?.availability_status || "unknown"}
        </Badge>
      ),
    },
    {
      label: "Advance payment",
      render: (provider: CompareProvider) => {
        const packageAdvance = provider.bundles.find((bundle) => bundle.min_advance_percentage)?.min_advance_percentage;
        const providerAdvance = provider.detail?.advance_payment_percentage;
        const advance = packageAdvance ?? providerAdvance;
        if (!advance && !provider.detail?.requires_advance_payment) return <span className="text-sm text-muted-foreground">Not specified</span>;
        return <span>{advance ? `${advance}% upfront` : "Advance required"}</span>;
      },
    },
    {
      label: "Travel charges",
      render: (provider: CompareProvider) => (
        <span>{provider.detail?.travel_charges_applicable ? "May apply" : "Not mentioned"}</span>
      ),
    },
    {
      label: "Inclusions",
      render: (provider: CompareProvider) => {
        const inclusionCount = provider.bundles.reduce((sum, bundle) => sum + (bundle.inclusions?.length || 0), 0);
        if (!inclusionCount) return <span className="text-sm text-muted-foreground">No inclusions listed</span>;
        return <span>{inclusionCount} inclusion points across packages</span>;
      },
    },
    {
      label: "Terms clarity",
      render: (provider: CompareProvider) => (
        <span>{provider.bundles.some((bundle) => !!bundle.terms_conditions) ? "Terms shared" : "No written terms yet"}</span>
      ),
    },
    {
      label: "Cancellation policy",
      render: (provider: CompareProvider) => {
        const policy = provider.bundles.find((bundle) => bundle.cancellation_policy)?.cancellation_policy;
        return <span>{policy ? policy.slice(0, 42) + (policy.length > 42 ? "..." : "") : "Not shared"}</span>;
      },
    },
    {
      label: "Experience",
      render: (provider: CompareProvider) => <span>{provider.experience_years ? `${provider.experience_years}+ years` : "Not specified"}</span>,
    },
    {
      label: "Location",
      render: (provider: CompareProvider) => (
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {provider.city || "Not specified"}
        </span>
      ),
    },
    {
      label: "Trust",
      render: (provider: CompareProvider) => (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {provider.is_verified ? (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </Badge>
          ) : null}
          {provider.is_premium ? (
            <Badge variant="outline" className="gap-1">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              Premium
            </Badge>
          ) : null}
          {!provider.is_verified && !provider.is_premium && <span className="text-sm text-muted-foreground">Standard listing</span>}
        </div>
      ),
    },
    {
      label: "Reliability",
      render: (provider: CompareProvider) => {
        const insight = providerInsights[provider.id]?.reliability;
        return <span>{insight?.label || "Emerging"}</span>;
      },
    },
    {
      label: "Decision strength",
      render: (provider: CompareProvider) => {
        const insight = providerInsights[provider.id];
        return <span>{insight?.trust.label || "Building proof"}</span>;
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <SEOHead title="Compare Providers | Subhakary" description="Side-by-side wedding vendor comparison with AI guidance." />
      <Navbar />

      <section className="px-4 pb-12 pt-24 md:pt-28">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={clearCompare}>
              Clear all
            </Button>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <Badge variant="secondary" className="mb-3">Decision desk</Badge>
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">Compare providers</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              This view is meant to help you actually choose, not just look at columns. It pulls price shape, package depth, trust, and readiness into one place.
            </p>
          </motion.div>

          {aiVerdict && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="mb-1 font-semibold text-primary">AI compare verdict</p>
                    <p className="text-sm text-muted-foreground">{aiVerdict.verdict}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {spotlightCards.length ? (
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              {spotlightCards.map((card) => (
                <Card key={card.title} className="border-border/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="mt-2 text-base font-semibold text-foreground">{card.provider.business_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{card.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            {enrichedProviders.map((provider) => {
              const tagline = aiVerdict?.providers.find((entry) => entry.provider_id === provider.id)?.tagline;
              const topBundle = provider.bundles[0];
              const insight = providerInsights[provider.id];
              return (
                <Card key={provider.id} className="relative overflow-hidden border-border/50">
                  <button
                    onClick={() => removeFromCompare(provider.id)}
                    className="absolute right-3 top-3 rounded-full bg-muted p-1 transition-colors hover:bg-destructive/15"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border bg-muted">
                        {provider.logo_url ? (
                          <img src={provider.logo_url} alt={provider.business_name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl">{provider.category?.icon || "*"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="line-clamp-2 text-lg">{provider.business_name}</CardTitle>
                        <CardDescription>{provider.category?.name || "Vendor"}</CardDescription>
                      </div>
                    </div>
                    {tagline && <Badge variant="outline" className="w-fit">{tagline}</Badge>}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{insight?.trust.label || "Building proof"}</Badge>
                      <Badge variant="secondary">{insight?.reliability.label || "Emerging"}</Badge>
                      <Badge variant="outline">{insight?.benchmark.label || "Fair price"}</Badge>
                      {insight?.budgetFit.label && insight.budgetFit.label !== "UNKNOWN" ? (
                        <Badge variant={insight.budgetFit.label === "YES" ? "default" : insight.budgetFit.label === "STRETCH" ? "secondary" : "destructive"}>
                          Budget fit: {insight.budgetFit.label}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border p-3">
                        <div className="text-muted-foreground">Rating</div>
                        <div className="mt-1 font-semibold">{provider.rating?.toFixed(1) || "New"}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-muted-foreground">Packages</div>
                        <div className="mt-1 font-semibold">{provider.bundles.length || 0}</div>
                      </div>
                    </div>

                    <div className="rounded-lg border p-3 text-sm">
                      <p className="text-muted-foreground">Best visible offer</p>
                      <p className="mt-1 font-semibold">
                        {topBundle ? `${topBundle.bundle_name} - ${formatCurrency(topBundle.discounted_price)}` : getProviderStartingPrice(provider)}
                      </p>
                      {topBundle?.response_time_hours ? (
                        <p className="mt-1 text-xs text-muted-foreground">Replies in about {topBundle.response_time_hours} hours</p>
                      ) : null}
                    </div>

                    <div className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">Tradeoffs explained</p>
                      <div className="mt-2 space-y-2 text-muted-foreground">
                        {(insight?.tradeoffs.length ? insight.tradeoffs : ["A balanced option, but make sure the package scope is fully written down before you commit."]).map((note) => (
                          <p key={note}>{note}</p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">Platform reliability</p>
                      <p className="mt-1 text-muted-foreground">{insight?.reliability.platformProof}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {insight?.reliability.verifiedCompletedCount ? (
                          <Badge variant="secondary">
                            {insight.reliability.verifiedCompletedCount} verified completions
                          </Badge>
                        ) : null}
                        <Badge variant="outline">{insight?.reliability.completedCount || 0} completed</Badge>
                        <Badge variant="outline">{insight?.reliability.recentSuccessCount || 0} recent wins</Badge>
                        {insight?.reliability.responseMedianHours ? (
                          <Badge variant="outline">
                            Replies in about {Math.round(insight.reliability.responseMedianHours)}h
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(getProviderRoute(provider))}
                    >
                      View profile
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="mb-3 grid gap-4" style={{ gridTemplateColumns: `180px repeat(${enrichedProviders.length}, 1fr)` }}>
                <div className="text-sm font-medium text-muted-foreground">Decision factors</div>
                {enrichedProviders.map((provider) => (
                  <div key={provider.id} className="text-center text-sm font-medium text-foreground">
                    {provider.business_name}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {comparisonRows.map((row, index) => (
                  <div
                    key={row.label}
                    className={`grid gap-4 rounded-xl px-4 py-3 ${index % 2 === 0 ? "bg-muted/45" : "bg-background"}`}
                    style={{ gridTemplateColumns: `180px repeat(${enrichedProviders.length}, 1fr)` }}
                  >
                    <div className="flex items-center text-sm font-medium text-muted-foreground">{row.label}</div>
                    {enrichedProviders.map((provider) => (
                      <div key={provider.id} className="flex items-center justify-center text-center text-sm">
                        {row.render(provider)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: `180px repeat(${enrichedProviders.length}, 1fr)` }}>
                <div className="pt-2 text-sm font-medium text-muted-foreground">Package signals</div>
                {enrichedProviders.map((provider) => (
                  <Card key={provider.id} className="border-border/50">
                    <CardContent className="space-y-3 p-4">
                      {provider.bundles.length ? (
                        provider.bundles.slice(0, 2).map((bundle) => (
                          <div key={bundle.id} className="rounded-lg border p-3 text-left text-sm">
                            <p className="font-medium">{bundle.bundle_name}</p>
                            <p className="mt-1 text-muted-foreground">{formatCurrency(bundle.discounted_price)}</p>
                            {bundle.inclusions?.length ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {bundle.inclusions.slice(0, 3).map((item) => (
                                  <Badge key={item} variant="outline" className="text-[10px]">{item}</Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-muted-foreground">No inclusion list shared</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border p-3 text-sm text-muted-foreground">No active bundles published yet.</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: `180px repeat(${enrichedProviders.length}, 1fr)` }}>
                <div className="pt-2 text-sm font-medium text-muted-foreground">Tradeoffs</div>
                {enrichedProviders.map((provider) => (
                  <Card key={provider.id} className="border-border/50">
                    <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
                      {(providerInsights[provider.id]?.tradeoffs.length
                        ? providerInsights[provider.id].tradeoffs
                        : ["No major tradeoff flagged from the visible profile data."]
                      ).map((note) => (
                        <p key={note}>{note}</p>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: `180px repeat(${enrichedProviders.length}, 1fr)` }}>
                <div className="pt-2 text-sm font-medium text-muted-foreground">Description</div>
                {enrichedProviders.map((provider) => (
                  <Card key={provider.id} className="border-border/50">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">{provider.description || "No description provided."}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Card className="mt-8 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                How to use this page well
              </CardTitle>
              <CardDescription>Three quick checks before you choose.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">1. Check fit before price</p>
                <p className="mt-1 text-muted-foreground">If the category or style fit is shaky, even a cheaper vendor tends to cost more later in revisions.</p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">2. Read package shape</p>
                <p className="mt-1 text-muted-foreground">The best deal is usually the one with clearer inclusions and fewer surprise extras, not just the lowest base number.</p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">3. Watch operational readiness</p>
                <p className="mt-1 text-muted-foreground">Availability, lead time, and written terms are often what separates a smooth booking from a stressful one.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Compare;
