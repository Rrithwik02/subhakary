import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Crown,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { ProviderAvailabilityCalendar } from "@/components/ProviderAvailabilityCalendar";

type ProviderDecisionSurfaceProps = {
  provider: {
    id: string;
    business_name: string;
    base_price?: number | null;
    pricing_info?: string | null;
    rating?: number | null;
    total_reviews?: number | null;
    is_verified?: boolean | null;
    is_premium?: boolean | null;
    experience_years?: number | null;
    availability_status?: string | null;
    advance_booking_days?: number | null;
    advance_payment_percentage?: number | null;
    requires_advance_payment?: boolean | null;
    travel_charges_applicable?: boolean | null;
  };
};

const formatCurrency = (value?: number | null) =>
  typeof value === "number" ? `Rs ${Math.round(value).toLocaleString("en-IN")}` : null;

export const ProviderDecisionSurface = ({ provider }: ProviderDecisionSurfaceProps) => {
  const { data: bundles = [] } = useQuery({
    queryKey: ["provider-bundles-decision-surface", provider.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_bundles")
        .select(
          "id,bundle_name,discounted_price,inclusions,exclusions,extra_charges,response_time_hours,cancellation_policy,terms_conditions",
        )
        .eq("provider_id", provider.id)
        .eq("is_active", true)
        .order("discounted_price", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!provider.id,
  });

  const cheapestBundle = bundles[0];
  const startingPrice =
    formatCurrency(provider.base_price) ||
    formatCurrency(cheapestBundle?.discounted_price) ||
    provider.pricing_info ||
    "Contact for price";

  const responseTimeHours =
    bundles.find((bundle) => typeof bundle.response_time_hours === "number")?.response_time_hours ?? null;
  const bundlesWithDisclosure = bundles.filter(
    (bundle) =>
      (bundle.inclusions?.length || 0) > 0 ||
      (bundle.exclusions?.length || 0) > 0 ||
      (Array.isArray(bundle.extra_charges) && bundle.extra_charges.length > 0) ||
      !!bundle.cancellation_policy ||
      !!bundle.terms_conditions,
  ).length;
  const trustSignals = [
    provider.is_verified ? "Verified profile" : null,
    provider.is_premium ? "Premium listing" : null,
    provider.total_reviews ? `${provider.total_reviews} reviews` : null,
    provider.experience_years ? `${provider.experience_years}+ years experience` : null,
  ].filter(Boolean) as string[];

  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-background via-background to-primary/5 shadow-elevated">
      <CardHeader className="pb-4">
        <Badge variant="secondary" className="mb-3 w-fit">
          Decision surface
        </Badge>
        <CardTitle className="text-xl md:text-2xl">Everything you need to decide with confidence</CardTitle>
        <CardDescription className="max-w-3xl text-sm md:text-base">
          Pricing, trust, package clarity, and booking readiness are gathered here so you can judge fit before you message or book.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <IndianRupee className="h-4 w-4 text-primary" />
              Starting price
            </div>
            <p className="text-lg font-semibold text-foreground">{startingPrice}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {bundles.length ? `${bundles.length} active package${bundles.length > 1 ? "s" : ""} published` : "Base profile pricing only"}
            </p>
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="h-4 w-4 text-primary" />
              Response rhythm
            </div>
            <p className="text-lg font-semibold text-foreground">
              {responseTimeHours ? `About ${responseTimeHours}h` : "Not shared"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Useful when you're comparing vendors who feel equally strong on paper.</p>
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4 text-primary" />
              Booking lead time
            </div>
            <p className="text-lg font-semibold text-foreground">
              {provider.advance_booking_days ? `${provider.advance_booking_days}+ days ahead` : "Ask vendor"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {provider.availability_status ? `Currently marked ${provider.availability_status}.` : "Availability can still vary by date."}
            </p>
          </div>

          <div className="rounded-2xl border bg-background/80 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ReceiptText className="h-4 w-4 text-primary" />
              Pricing clarity
            </div>
            <p className="text-lg font-semibold text-foreground">
              {bundlesWithDisclosure ? `${bundlesWithDisclosure}/${bundles.length} packages` : bundles.length ? "Basic only" : "Profile only"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Counts packages with inclusions, exclusions, extra charges, or cancellation terms filled in.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border bg-background/70 p-4 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Trust and operating signals</h3>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
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
              {provider.rating ? (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  {provider.rating.toFixed(1)} rating
                </Badge>
              ) : null}
              {provider.total_reviews ? (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {provider.total_reviews} reviews
                </Badge>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground">Advance payment</p>
                <p className="mt-1 text-muted-foreground">
                  {provider.advance_payment_percentage
                    ? `${provider.advance_payment_percentage}% upfront`
                    : provider.requires_advance_payment
                      ? "Advance required"
                      : "Not specified"}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground">Travel charges</p>
                <p className="mt-1 text-muted-foreground">
                  {provider.travel_charges_applicable ? "May apply depending on venue/location" : "Not mentioned on profile"}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-sm sm:col-span-2">
                <p className="font-medium text-foreground">Trust snapshot</p>
                <p className="mt-1 text-muted-foreground">
                  {trustSignals.length ? trustSignals.join(" | ") : "This profile still needs more proof points to feel fully decision-ready."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-background/70 p-4 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Package disclosure snapshot</h3>
            </div>

            {bundles.length ? (
              <div className="space-y-3">
                {bundles.slice(0, 2).map((bundle) => {
                  const extraChargeCount = Array.isArray(bundle.extra_charges) ? bundle.extra_charges.length : 0;
                  return (
                    <div key={bundle.id} className="rounded-xl border bg-muted/30 p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{bundle.bundle_name}</p>
                          <p className="mt-1 text-muted-foreground">{formatCurrency(bundle.discounted_price)}</p>
                        </div>
                        {bundle.response_time_hours ? (
                          <Badge variant="outline">~{bundle.response_time_hours}h reply</Badge>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{bundle.inclusions?.length || 0} inclusions</Badge>
                        <Badge variant="outline">{bundle.exclusions?.length || 0} exclusions</Badge>
                        <Badge variant="outline">{extraChargeCount} extras noted</Badge>
                        <Badge variant="outline">{bundle.cancellation_policy ? "Cancellation shared" : "No cancellation note"}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                This provider has not published structured packages yet. You can still use the starting price and profile details, but expect more of the scope to be clarified in chat.
              </div>
            )}
          </div>
        </div>

        <Separator />

        <ProviderAvailabilityCalendar
          providerId={provider.id}
          providerName={provider.business_name}
          embedded
          title="Live availability window"
          description="Use this before sending a booking request so you are not falling in love with a blocked date."
        />
      </CardContent>
    </Card>
  );
};
