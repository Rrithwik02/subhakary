import { useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, Gauge, Scale, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProviderComparison } from "@/hooks/useProviderComparison";
import {
  rebalanceWeddingPlan,
  shortlistProvidersForLane,
  type AiRebalanceResult,
  type AiShortlistResult,
} from "@/lib/weddingAiActions";
import { VENDOR_LANES } from "@/lib/weddingPlanning";
import type { SimulationBundle, SimulationProvider, SimulationTemplate } from "@/lib/weddingSimulation";

type Props = {
  providers: SimulationProvider[];
  bundles: SimulationBundle[];
  selectedProviders: Record<string, string>;
  totalBudget?: number | null;
  weddingStyle?: string | null;
  priorities?: string[] | null;
  template: SimulationTemplate;
  onApplyPlan: (next: Record<string, string>) => void;
};

export const WeddingAiAssistantPanel = ({
  providers,
  bundles,
  selectedProviders,
  totalBudget,
  weddingStyle,
  priorities,
  template,
  onApplyPlan,
}: Props) => {
  const { clearCompare, addToCompare } = useProviderComparison();
  const [shortlistLane, setShortlistLane] = useState("Photography");
  const [shortlistBudget, setShortlistBudget] = useState<string>("");
  const [rebalanceTarget, setRebalanceTarget] = useState<string>(totalBudget ? String(totalBudget) : "");
  const [shortlistResult, setShortlistResult] = useState<AiShortlistResult | null>(null);
  const [rebalanceResult, setRebalanceResult] = useState<AiRebalanceResult | null>(null);

  const laneBudgetHint = useMemo(() => {
    const weight = template.weights[shortlistLane] || 0.08;
    return totalBudget ? Math.round(totalBudget * weight) : null;
  }, [shortlistLane, template, totalBudget]);

  const runShortlist = () => {
    const result = shortlistProvidersForLane({
      lane: shortlistLane,
      providers,
      bundles,
      weddingStyle,
      totalBudget,
      budgetCap: shortlistBudget ? Number(shortlistBudget) : null,
      priorities,
      template,
    });
    setShortlistResult(result);
  };

  const runRebalance = () => {
    const result = rebalanceWeddingPlan({
      selectedProviders,
      providers,
      bundles,
      totalBudget: rebalanceTarget ? Number(rebalanceTarget) : totalBudget,
      weddingStyle,
      priorities,
      template,
    });
    setRebalanceResult(result);
  };

  const addShortlistToCompare = () => {
    if (!shortlistResult?.candidates.length) return;
    clearCompare();
    shortlistResult.candidates.forEach((candidate) => {
      addToCompare({
        id: candidate.provider.id,
        business_name: candidate.provider.business_name,
        base_price: candidate.estimatedPrice,
        rating: candidate.provider.rating,
        total_reviews: candidate.provider.total_reviews,
        city: candidate.provider.city,
        specializations: candidate.provider.specializations,
        url_slug: candidate.provider.url_slug,
        category: candidate.provider.category as { name: string } | null,
      });
    });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader>
        <Badge variant="secondary" className="mb-2 w-fit">Phase 3</Badge>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BrainCircuit className="h-5 w-5 text-primary" />
          AI actions
        </CardTitle>
        <CardDescription>
          Let the planner actually move the wedding forward: shortlist strong candidates and rebalance the stack against your budget.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-background/80 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Shortlist 3 vendors under budget</p>
              <p className="text-sm text-muted-foreground">Choose a planning lane and let the assistant produce a compare-ready shortlist.</p>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label>Lane</Label>
              <Select value={shortlistLane} onValueChange={setShortlistLane}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_LANES.map((lane) => (
                    <SelectItem key={lane.label} value={lane.label}>{lane.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget cap</Label>
              <Input
                type="number"
                value={shortlistBudget}
                onChange={(event) => setShortlistBudget(event.target.value)}
                placeholder={laneBudgetHint ? `Hint: ${laneBudgetHint}` : "Optional"}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button onClick={runShortlist}>Run shortlist</Button>
            {shortlistResult?.candidates.length ? (
              <Button variant="outline" onClick={addShortlistToCompare}>Send to compare</Button>
            ) : null}
          </div>

          {shortlistResult ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border p-3 text-sm">
                <p className="font-medium">{shortlistResult.summary}</p>
                {shortlistResult.budgetCap ? (
                  <p className="mt-1 text-muted-foreground">Working against a Rs {shortlistResult.budgetCap.toLocaleString("en-IN")} cap for this lane.</p>
                ) : null}
              </div>

              {shortlistResult.candidates.map((candidate, index) => (
                <div key={candidate.provider.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <p className="font-medium">{candidate.provider.business_name}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{candidate.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs {Math.round(candidate.estimatedPrice).toLocaleString("en-IN")}</p>
                      {candidate.bundleName ? (
                        <p className="text-xs text-muted-foreground">{candidate.bundleName}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{candidate.trustLabel}</Badge>
                    <Badge variant="outline">
                      <Gauge className="mr-1 h-3.5 w-3.5" />
                      {candidate.confidence}% confidence
                    </Badge>
                    {candidate.whyNot ? <Badge variant="outline">{candidate.whyNot}</Badge> : null}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 px-0"
                    onClick={() =>
                      onApplyPlan({
                        ...selectedProviders,
                        [shortlistLane]: candidate.provider.id,
                      })
                    }
                  >
                    Use this pick for {shortlistLane}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border bg-background/80 p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Rebalance my plan to fit the budget</p>
              <p className="text-sm text-muted-foreground">Protects priority lanes where possible, then looks for the cleanest savings elsewhere.</p>
            </div>
            <Scale className="h-5 w-5 text-primary" />
          </div>

          <div className="space-y-2">
            <Label>Target total budget</Label>
            <Input
              type="number"
              value={rebalanceTarget}
              onChange={(event) => setRebalanceTarget(event.target.value)}
              placeholder="Enter target budget"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <Button onClick={runRebalance}>Rebalance plan</Button>
            {rebalanceResult?.changes.length ? (
              <Button variant="outline" onClick={() => onApplyPlan(rebalanceResult.projectedSelections)}>
                Apply suggestion
              </Button>
            ) : null}
          </div>

          {rebalanceResult ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border p-3 text-sm">
                <p className="font-medium">{rebalanceResult.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={rebalanceResult.withinBudget ? "secondary" : "outline"}>
                    {rebalanceResult.withinBudget ? "Within budget" : "Still over target"}
                  </Badge>
                  <Badge variant="outline">Saves Rs {Math.round(rebalanceResult.savedAmount).toLocaleString("en-IN")}</Badge>
                  <Badge variant="outline">{rebalanceResult.confidence}% confidence</Badge>
                </div>
              </div>

              {rebalanceResult.changes.length ? (
                rebalanceResult.changes.map((change) => (
                  <div key={`${change.lane}-${change.toProvider}`} className="rounded-xl border p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{change.lane}</p>
                        <p className="mt-1 text-muted-foreground">
                          Swap <span className="font-medium text-foreground">{change.fromProvider}</span> for{" "}
                          <span className="font-medium text-foreground">{change.toProvider}</span>
                        </p>
                      </div>
                      <Badge variant="secondary">Save Rs {Math.round(change.savings).toLocaleString("en-IN")}</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">{change.reason}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                  No swaps were needed. This plan is already sitting in a healthy range for the target.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Ask the planner to trim the build. It will keep as much style fit and proof quality as it can while looking for savings.
            </div>
          )}

          <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Why this matters
            </p>
            <p className="mt-1 text-muted-foreground">
              This is the first step from "AI explains" to "AI acts." The planner is now producing shortlists and plan adjustments with concrete consequences inside the app.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
