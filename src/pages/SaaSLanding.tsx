import { ArrowRight, Calendar, CalendarCheck, CheckCircle2, Clock, Flame, MapPin, ShieldCheck, Sparkles, Store, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { BackToHome } from "@/components/BackToHome";

const milestones = [
  { step: 1, title: "Ganesh Sthapana & Haldi", budget: "₹8.5L", status: "done" as const, meta: "Completed • Oct 24", note: "Concluded" },
  { step: 2, title: "Mehendi & Sangeet", budget: "₹14.2L", status: "done" as const, meta: "Completed • Oct 25", note: "Concluded" },
  { step: 3, title: "Sacred Pheras & Kanyadaan", budget: "₹24.8L", status: "active" as const, meta: "In progress today", note: "Muhurat 6:42 PM" },
  { step: 4, title: "Grand Reception", budget: "₹17.5L", status: "upcoming" as const, meta: "Tomorrow • 8:00 PM", note: "Scheduled" },
  { step: 5, title: "Griha Pravesh", budget: "₹25.0L", status: "upcoming" as const, meta: "Oct 28 • Post-Wedding", note: "Upcoming" },
];

const itinerary = [
  { day: "Day 01", title: "Ganesh Sthapana & Haldi Rasam", meta: "Completed • Oct 24 • All rituals concluded", tag: "Concluded" },
  { day: "Day 02", title: "Mehendi & Sangeet", meta: "Completed • Oct 25 • Vendor sign-off complete", tag: "Concluded" },
];

const todayHighlights = [
  { icon: Flame, label: "Havan Samagri", note: "Ready for the ceremony" },
  { icon: Sparkles, label: "Floral Decor", note: "Mandap dressing in progress" },
  { icon: Clock, label: "Guest Arrival", note: "Window opens 5:30 PM" },
];

const benefits = [
  {
    icon: Clock,
    title: "Synchronized Multi-Day Itineraries",
    text: "Keep parents, guests, pandits, and vendors in sync with one shared ceremony schedule instead of juggling separate WhatsApp groups.",
    tag: "One shared schedule for the whole family",
  },
  {
    icon: ShieldCheck,
    title: "Transparent Budget Ledger",
    text: "Track planned vs. actual spend across every category, from catering to decor, so there are no surprises before the big day.",
    tag: "Planned vs. actual spend, always visible",
  },
  {
    icon: Users,
    title: "Family Collaboration & Roles",
    text: "Invite parents, siblings, and planners into one shared workspace so everyone sees the same up-to-date plan.",
    tag: "Shared access with gentle reminders",
  },
  {
    icon: Flame,
    title: "Ceremony Task Checklists",
    text: "Curated task checklists for every ritual, from Haldi to Vivaah, so nothing gets forgotten in the run-up to the ceremony.",
    tag: "A checklist for every ritual",
  },
  {
    icon: CalendarCheck,
    title: "Guest List & RSVP Tracking",
    text: "Manage your guest list and track RSVPs from one place, so you always know who's confirmed for each event.",
    tag: "RSVP status at a glance",
  },
  {
    icon: Store,
    title: "Verified Vendor Bookings",
    text: "Book photographers, decorators, caterers, and more directly from your workspace, with every booking linked to your budget.",
    tag: "Bookings synced with your budget",
  },
];

export default function SaaSLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goToPlanWedding = () => navigate(user ? "/plan-wedding" : "/auth?redirect=/plan-wedding");
  const goToDashboard = () => navigate(user ? "/wedding-dashboard" : "/auth?redirect=/wedding-dashboard");

  return (
    <main className="min-h-screen bg-cream text-brown-dark">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pb-12 pt-32">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top,_rgba(184,144,32,.16),_transparent_56%)]" />
        <div className="relative z-10 container mx-auto px-4">
          <BackToHome />
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline" className="border-gold/30 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-wider text-brown">
              <Sparkles className="mr-1 h-3 w-3 text-gold" />
              Subhakary Planning OS
            </Badge>
            <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
              The Planning OS for a <br />Seamless, Stress-Free Celebration
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-brown/70 sm:text-base">
              Plan your celebration with the same Subhakary workspace for events, tasks, budgets, guests, and service bookings.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button variant="gold" className="h-12 px-6" onClick={goToPlanWedding}>
                Start Planning <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-12 border-brown/20 px-6"
                onClick={() => document.getElementById("dashboard-preview")?.scrollIntoView({ behavior: "smooth" })}
              >
                See the Dashboard Preview
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Planning OS Dashboard Preview */}
      <section id="dashboard-preview" className="border-y border-gold/10 bg-background px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brown/65">Planning OS preview</span>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl">Wedding Schedule &amp; Milestone Tracker</h2>
            </div>
            <p className="max-w-md text-sm text-brown/65">
              Illustrative example with sample data — sign in to see your own wedding's schedule, budget, and milestones.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
            {/* Milestone Tracker */}
            <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-display text-2xl">Milestone Tracker</h3>
                  <p className="text-xs text-muted-foreground">Ceremony-by-ceremony planning path</p>
                </div>
                <Badge className="bg-gold/10 text-brown hover:bg-gold/10">Step 3 of 5</Badge>
              </div>
              <div className="mt-5 space-y-3">
                {milestones.map((m) => (
                  <div
                    key={m.step}
                    className={`flex gap-3 rounded-xl p-3 ${m.status === "active" ? "border border-gold bg-gold/5" : "bg-cream/60"}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        m.status === "done" ? "bg-brown text-cream" : m.status === "active" ? "bg-gold text-brown-dark" : "bg-muted text-brown"
                      }`}
                    >
                      {m.status === "done" ? <CheckCircle2 className="h-3.5 w-3.5" /> : m.step}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{m.title}</span>
                        <span className="whitespace-nowrap text-xs font-semibold text-brown/70">{m.budget}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {m.meta} · {m.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-gold/20 bg-cream/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brown/60">Total Wedding Budget</p>
                <p className="mt-1 font-display text-xl">₹70,00,000</p>
                <p className="mt-1 text-xs text-muted-foreground">Planned vs. actual spend tracked automatically</p>
              </div>
            </aside>

            {/* Ceremony Itinerary */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-brown/65">Ceremonial itinerary</span>
                  <h3 className="font-display text-3xl">Wedding Run-Sheet</h3>
                </div>
                <Badge className="bg-gold/10 text-brown hover:bg-gold/10">Day 3 of 4 · Today</Badge>
              </div>

              <div className="mt-5 space-y-3">
                {itinerary.map((item) => (
                  <div key={item.day} className="flex flex-col items-start justify-between gap-2 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brown/50">{item.day}</span>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.meta}</p>
                    </div>
                    <Badge variant="secondary" className="bg-brown/10 text-brown">{item.tag}</Badge>
                  </div>
                ))}

                {/* Today - highlighted */}
                <div className="rounded-xl border-2 border-gold bg-gold/5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge className="bg-brown text-cream hover:bg-brown">Day 03 · Today</Badge>
                    <span className="text-xs font-semibold text-brown/70">Muhurat 6:42 PM – 8:15 PM</span>
                  </div>
                  <h4 className="mt-3 font-display text-xl">Sacred Pheras, Varmala &amp; Kanyadaan</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mandap ceremony window begins 6:15 PM. Vendor crews and family coordinators are on-site.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {todayHighlights.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="flex items-center gap-2 rounded-lg bg-white/70 p-3">
                          <Icon className="h-4 w-4 shrink-0 text-gold" />
                          <div>
                            <p className="text-xs font-semibold">{item.label}</p>
                            <p className="text-[11px] text-muted-foreground">{item.note}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-gold" />
                    Sample venue: Lotus Mandap Courtyard
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="brown" size="sm" onClick={goToPlanWedding}>
                      View Full Run-Sheet <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToDashboard}>
                      View My Dashboard
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brown/50">Day 04</span>
                    <p className="font-medium">Grand Reception &amp; Dawat</p>
                    <p className="text-xs text-muted-foreground">Upcoming • Tomorrow • 8:00 PM</p>
                  </div>
                  <Badge variant="secondary" className="bg-brown/10 text-brown">Scheduled</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Planning OS Benefits */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-brown/65">Designed for Indian celebrations</span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">How Planning OS Eases Your Family's Journey</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Traditional Indian weddings have dozens of ceremonies, hundreds of sacred items, and multiple generations involved. Here's how Subhakary replaces stress with joyful anticipation.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, title, text, tag }) => (
              <div key={title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1">
                <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-2xl">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                <div className="mt-4 border-t border-border pt-3 text-xs font-medium text-brown/70">{tag}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="gold" className="h-12 px-8" onClick={goToPlanWedding}>
              Start Planning Your Celebration <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
