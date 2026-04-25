import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Heart, IndianRupee, Users, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const STYLES = ["Traditional", "Modern", "Destination", "Intimate", "Royal", "Minimalist"];
const SIZES = [
  { id: "intimate", label: "Intimate", desc: "< 100 guests" },
  { id: "medium", label: "Medium", desc: "100–300 guests" },
  { id: "large", label: "Large", desc: "300–600 guests" },
  { id: "grand", label: "Grand", desc: "600+ guests" },
];
const PRIORITIES = ["Photography", "Decor", "Catering", "Venue", "Makeup", "Music/DJ", "Mehndi", "Pandit"];

const PlanWedding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("My Wedding");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState<string>("500000");
  const [guestCount, setGuestCount] = useState<string>("200");
  const [style, setStyle] = useState<string>("Traditional");
  const [size, setSize] = useState<string>("medium");
  const [priorities, setPriorities] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/plan-wedding");
  }, [authLoading, user, navigate]);

  const togglePriority = (p: string) => {
    setPriorities((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  };

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const budgetNum = budget ? Number(budget) : null;
      const { data: ev, error: evErr } = await supabase
        .from("wedding_events")
        .insert({
          user_id: user.id,
          name: name || "My Wedding",
          event_date: eventDate || null,
          city: city || null,
          total_budget: budgetNum,
          wedding_style: style,
          wedding_size: size,
          is_primary: true,
        })
        .select()
        .single();
      if (evErr) throw evErr;

      const guests = guestCount ? Number(guestCount) : null;
      await supabase.from("wedding_preferences").insert({
        user_id: user.id,
        budget_min: budgetNum ? Math.round(budgetNum * 0.8) : null,
        budget_max: budgetNum ? Math.round(budgetNum * 1.2) : null,
        guest_count: guests,
        wedding_style: style,
        wedding_size: size,
        location: city || null,
        event_date: eventDate || null,
        priorities,
      });

      toast.success("Your wedding plan is ready!");
      navigate(`/wedding-dashboard?event=${ev.id}`);
    } catch (e: any) {
      toast.error(e.message || "Could not save plan");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Plan Your Wedding | Subhakary" description="Tell us about your dream wedding and get a personalized plan." />
      <Navbar />
      <main className="container max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Heart className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold">Plan Your Dream Wedding</h1>
          <p className="text-muted-foreground mt-2">A few quick questions to personalize your journey</p>
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        <Card>
          <CardHeader>
            <CardTitle>Step {step} of 4</CardTitle>
            <CardDescription>
              {step === 1 && "Basics about your wedding"}
              {step === 2 && "Your budget & guest count"}
              {step === 3 && "Style & scale"}
              {step === 4 && "What matters most to you"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Event name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Priya & Arjun's Wedding" />
                </div>
                <div className="space-y-2">
                  <Label>Wedding date (approximate)</Label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Hyderabad" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><IndianRupee className="h-4 w-4" /> Total budget (₹)</Label>
                  <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="500000" />
                  <p className="text-xs text-muted-foreground">We'll suggest vendors that fit this range.</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Users className="h-4 w-4" /> Expected guest count</Label>
                  <Input type="number" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="200" />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Wedding style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStyle(s)}
                        className={`p-3 rounded-md border text-sm transition ${
                          style === s ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Wedding size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSize(s.id)}
                        className={`p-3 rounded-md border text-left transition ${
                          size === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium text-sm">{s.label}</div>
                        <div className="text-xs text-muted-foreground">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Sparkles className="h-4 w-4" /> Pick your top priorities</Label>
                <p className="text-xs text-muted-foreground mb-2">We'll prioritize these in your plan.</p>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePriority(p)}
                      className={`p-3 rounded-md border text-sm transition ${
                        priorities.includes(p) ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || submitting}>
                Back
              </Button>
              {step < 4 ? (
                <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
              ) : (
                <Button onClick={submit} disabled={submitting}>
                  {submitting ? "Creating..." : "Create my plan"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PlanWedding;
