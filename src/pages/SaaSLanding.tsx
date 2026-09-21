import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2, CheckSquare, IndianRupee, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tools = [
  { icon: Calendar, title: "Event Timeline", text: "Organize every ceremony and keep important moments together." },
  { icon: CheckSquare, title: "Ceremony Checklist", text: "Track planning tasks and ceremony preparation in one workspace." },
  { icon: IndianRupee, title: "Budget Planner", text: "Plan expenses and review budget information as your celebration takes shape." },
  { icon: Users, title: "Guest List Manager", text: "Manage guests and family collaboration from your wedding workspace." },
];

export default function SaaSLanding() {
  const navigate = useNavigate();
  const [active, setActive] = useState<"timeline" | "tasks">("timeline");

  return <main className="min-h-screen bg-cream text-brown-dark"><Navbar />
    <section className="relative overflow-hidden pb-16 pt-32">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,.18),_transparent_56%)]" />
      <div className="relative z-10 container mx-auto px-4">
        <button type="button" onClick={() => navigate("/")} className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-brown hover:text-gold"><ArrowLeft className="h-4 w-4" />Back to Home</button>
        <div className="mx-auto max-w-4xl text-center">
        <Badge variant="outline" className="border-gold/30 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-wider text-brown"><Sparkles className="mr-1 h-3 w-3 text-gold" />Subhakary Planning OS</Badge>
        <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">The Planning OS for a <br />Seamless, Stress-Free Celebration</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-brown/70 sm:text-base">Plan your celebration with the same Subhakary workspace for events, tasks, budgets, guests, and service bookings.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><Button variant="gold" className="h-12 px-6" onClick={() => navigate("/auth?redirect=/wedding/new")}>Start Planning <ArrowRight className="ml-2 h-4 w-4" /></Button><Button variant="outline" className="h-12 border-brown/20 px-6" onClick={() => document.getElementById("war-room")?.scrollIntoView({ behavior: "smooth" })}>Explore Planning Tools</Button></div>
        </div>
      </div>
    </section>

    <section id="war-room" className="border-y border-gold/10 bg-background px-4 py-16"><div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-semibold uppercase tracking-wider text-brown/65">Planning OS preview</span><h2 className="font-display text-3xl sm:text-4xl">Wedding schedule & planning workspace</h2></div><p className="max-w-md text-sm text-brown/65">A preview of the existing planning tools. Your real workspace is available after you sign in.</p></div>
      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between border-b border-border pb-4"><div><h3 className="font-display text-2xl">Milestone Tracker</h3><p className="text-xs text-muted-foreground">Plan each event together</p></div><Badge className="bg-gold/10 text-brown hover:bg-gold/10">Steps</Badge></div><div className="mt-5 space-y-3">{["Create your wedding workspace", "Add celebration events", "Organize ceremony tasks", "Manage service requirements", "Review budgets and bookings"].map((item, index) => <div key={item} className={`flex gap-3 rounded-xl p-3 ${index === 2 ? "border border-gold bg-gold/5" : "bg-cream/60"}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index < 2 ? "bg-brown text-cream" : "bg-muted text-brown"}`}>{index + 1}</span><span className="text-sm font-medium">{item}</span></div>)}</div></aside>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5"><div><span className="text-xs font-semibold uppercase tracking-wider text-brown/65">Ceremonial itinerary</span><h3 className="font-display text-3xl">Schedule & task overview</h3></div><div className="flex rounded-lg bg-cream p-1"><button onClick={() => setActive("timeline")} className={`rounded-md px-3 py-2 text-xs font-semibold ${active === "timeline" ? "bg-white shadow-sm" : ""}`}>Timeline</button><button onClick={() => setActive("tasks")} className={`rounded-md px-3 py-2 text-xs font-semibold ${active === "tasks" ? "bg-white shadow-sm" : ""}`}>Tasks</button></div></div>
          {active === "timeline" ? <div className="mt-5 space-y-3">{["Create an event and select its date", "Set ceremony timing and requirements", "Review booked services for each event"].map((item, index) => <div key={item} className={`flex items-center justify-between rounded-xl border p-4 ${index === 1 ? "border-gold bg-gold/5" : "border-border bg-background"}`}><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-gold" /><span className="font-medium">{item}</span></div><span className="text-xs text-muted-foreground">Planning</span></div>)}</div> : <div className="mt-5 space-y-3">{["Add ceremony tasks", "Assign planning responsibilities", "Track completed preparation"].map((item, index) => <button key={item} type="button" className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-4 text-left"><span className={`h-5 w-5 rounded border ${index === 0 ? "border-gold bg-gold" : "border-brown/30"}`} /><span className="font-medium">{item}</span></button>)}</div>}
          <div className="mt-6 flex flex-wrap gap-3"><Button variant="gold" onClick={() => navigate("/auth?redirect=/wedding/new")}>Open your Planning OS <ArrowRight className="ml-2 h-4 w-4" /></Button><Button variant="outline" onClick={() => navigate("/auth?redirect=/wedding-dashboard")}>View dashboard</Button></div>
        </div>
      </div>
    </div></section>

    <section className="bg-cream px-4 py-12"><div className="mx-auto grid max-w-7xl items-center gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm lg:grid-cols-2 lg:p-10">
      <div className="rounded-xl border border-gold/15 bg-cream/60 p-5"><div className="rounded-lg bg-white p-4 shadow-sm"><div className="flex items-center justify-between border-b border-border pb-3"><div><span className="text-xs font-semibold uppercase tracking-wider text-brown/60">Budget planner</span><h3 className="font-display text-2xl">Plan ceremony milestones</h3></div><span className="rounded bg-gold/10 px-2 py-1 text-xs font-semibold text-brown">Planning</span></div><div className="mt-3 space-y-2">{["Create a budget item", "Review planned and actual spending", "Track booking-related expenses"].map((item, index) => <div key={item} className="flex items-center justify-between rounded bg-cream px-3 py-2 text-sm"><span>{item}</span><span className={`rounded px-2 py-1 text-xs ${index === 0 ? "bg-gold text-brown" : "bg-muted text-muted-foreground"}`}>{index === 0 ? "Ready" : "Available"}</span></div>)}</div></div></div>
      <div><span className="text-xs font-semibold uppercase tracking-[.14em] text-brown/65">Planning tools</span><h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">Smart Budget &amp; Milestone Planning</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">Use your Subhakary wedding workspace to organize budget items, planning tasks, and events alongside your service bookings.</p><ul className="mt-5 space-y-2 text-sm text-brown/80">{["Review planned and actual expenses", "Track tasks and event preparation", "Keep booking information with your wedding plan"].map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{item}</li>)}</ul></div>
    </div></section>

    <section className="px-4 py-20"><div className="mx-auto max-w-7xl"><div className="mx-auto mb-10 max-w-2xl text-center"><span className="text-xs font-semibold uppercase tracking-wider text-brown/65">Built for your celebration</span><h2 className="mt-2 font-display text-3xl sm:text-4xl">Plan the details that matter</h2></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{tools.map(({ icon: Icon, title, text }) => <motion.div key={title} whileHover={{ y: -4 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm"><span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold"><Icon className="h-5 w-5" /></span><h3 className="font-display text-2xl">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></motion.div>)}</div></div></section>
    <Footer />
  </main>;
}
