import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IndianRupee, Users, CheckSquare, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TABS = [
  {
    id: "budget",
    name: "Budget Planner",
    icon: IndianRupee,
    title: "Keep your wedding finances under control",
    description: "Define your total budget, split expenses by categories (caterer, photographer, poojari, venue), and track actual payments versus estimates in real-time."
  },
  {
    id: "guests",
    name: "Guest List Manager",
    icon: Users,
    title: "Coordinate invites and RSVPs in one place",
    description: "Manage guest counts, group them by family or ceremony, and track digital RSVPs instantly with custom WhatsApp/SMS invite generation."
  },
  {
    id: "checklist",
    name: "Ceremony Checklist",
    icon: CheckSquare,
    title: "Never miss a single ceremony detail",
    description: "A complete step-by-step traditional checklist covering puja items, vendor deadlines, outfit fittings, and Muhurtham requirements."
  },
  {
    id: "timeline",
    name: "Event Timeline",
    icon: Clock,
    title: "Seamless timing for all rituals",
    description: "Chronological timeline builder to align family members, pandits, and coordinators on every Muhurtham, Haldi, or Reception event."
  }
];

export const WeddingOSPreviewSection = () => {
  const [activeTab, setActiveTab] = useState("budget");

  const activeTabDetails = TABS.find((t) => t.id === activeTab)!;

  return (
    <section className="py-24 bg-cream/30 border-y border-gold/10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="border-gold/30 text-gold bg-gold/5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Subhakary OS
          </Badge>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-brown mb-4">
            Plan Like a Professional
          </h2>
          <p className="text-muted-foreground text-lg">
            Say goodbye to messy spreadsheets. Use our cohesive suite of event planner utilities to design the perfect traditional ceremony.
          </p>
        </div>

        {/* Dynamic Double Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left panel: Tabs selector & details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex flex-col gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-4 w-full p-4 rounded-2xl text-left transition-all duration-300 border cursor-pointer ${
                      isActive
                        ? "bg-brown text-cream border-brown shadow-lg scale-[1.02]"
                        : "bg-card text-foreground hover:bg-cream/50 border-border"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-colors ${
                      isActive ? "bg-gold text-brown" : "bg-primary/10 text-primary"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">{tab.name}</h3>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border/80">
              <h4 className="font-display text-2xl font-bold text-brown mb-2">
                {activeTabDetails.title}
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {activeTabDetails.description}
              </p>
              <a href="/auth">
                <Button variant="gold" className="rounded-full px-6 text-sm font-semibold cursor-pointer gap-2">
                  <span>Start Planning Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>

          {/* Right panel: Feature Mockup Visuals */}
          <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-xl min-h-[420px] flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full filter blur-3xl pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {activeTab === "budget" && (
                <motion.div
                  key="budget"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="font-bold text-brown text-lg">Wedding Budget Breakdown</span>
                    <Badge variant="outline" className="text-gold border-gold/30 bg-gold/5">Muhurtham Split</Badge>
                  </div>
                  
                  {/* Ledger Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-cream/40 p-4 rounded-2xl border">
                      <span className="text-xs text-muted-foreground block mb-1">Total Budget</span>
                      <span className="font-bold text-brown text-sm sm:text-base">₹15,00,000</span>
                    </div>
                    <div className="bg-cream/40 p-4 rounded-2xl border">
                      <span className="text-xs text-muted-foreground block mb-1">Actual Spent</span>
                      <span className="font-bold text-emerald-600 text-sm sm:text-base">₹12,40,000</span>
                    </div>
                    <div className="bg-cream/40 p-4 rounded-2xl border">
                      <span className="text-xs text-muted-foreground block mb-1">Remaining</span>
                      <span className="font-bold text-amber-600 text-sm sm:text-base">₹2,60,000</span>
                    </div>
                  </div>

                  {/* Splits Progress */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Catering & Food Services</span>
                        <span className="text-gold">₹3,60,000 (24%)</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-gold h-full rounded-full" style={{ width: "24%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Decoration & Venue setup</span>
                        <span className="text-gold">₹2,70,000 (18%)</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-gold h-full rounded-full" style={{ width: "18%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Photography & Video</span>
                        <span className="text-gold">₹1,80,000 (12%)</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-gold h-full rounded-full" style={{ width: "12%" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "guests" && (
                <motion.div
                  key="guests"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="font-bold text-brown text-lg">Guest List Directory</span>
                    <span className="text-xs text-muted-foreground font-semibold">Total: 342 Guests</span>
                  </div>

                  {/* Guest rows */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center p-3.5 bg-cream/35 border rounded-2xl">
                      <div>
                        <p className="font-semibold text-sm">Prasad & Family (Bride Side)</p>
                        <p className="text-xs text-muted-foreground">4 Members • Hyderabad</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Attending</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3.5 bg-cream/35 border rounded-2xl">
                      <div>
                        <p className="font-semibold text-sm">Srinivas Rao (Groom Side)</p>
                        <p className="text-xs text-muted-foreground">2 Members • Bangalore</p>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending RSVP</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3.5 bg-cream/35 border rounded-2xl">
                      <div>
                        <p className="font-semibold text-sm">Kalyan Ram (Family Friend)</p>
                        <p className="text-xs text-muted-foreground">1 Member • Chennai</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Attending</Badge>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "checklist" && (
                <motion.div
                  key="checklist"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="font-bold text-brown text-lg">Traditional Muhurtham Checklist</span>
                    <span className="text-xs text-emerald-600 font-semibold">68% Done</span>
                  </div>

                  {/* Checklist items */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-cream/20 rounded-xl border border-gold/10">
                      <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-gray-300 text-primary accent-gold" />
                      <div>
                        <span className="text-sm font-semibold line-through text-muted-foreground">Book Vedic Poojari / Pandit for wedding day</span>
                        <p className="text-xs text-muted-foreground">Completed • Verified Pandit assigned</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-cream/20 rounded-xl border border-gold/10">
                      <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-gray-300 text-primary accent-gold" />
                      <div>
                        <span className="text-sm font-semibold line-through text-muted-foreground">Select Mandap floral decoration themes</span>
                        <p className="text-xs text-muted-foreground">Completed • Gold marigold backdrop</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-cream/20 rounded-xl">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-primary accent-gold" />
                      <div>
                        <span className="text-sm font-semibold text-foreground">Prepare Puja materials (Ghee, Coconuts, Turmeric)</span>
                        <p className="text-xs text-amber-600 font-medium">Pending • 3 days before ceremony</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "timeline" && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="font-bold text-brown text-lg">Muhurtham Day Schedule</span>
                    <Badge variant="outline" className="border-gold/30 bg-gold/5 text-gold">July 25, 2026</Badge>
                  </div>

                  {/* Timeline steps */}
                  <div className="relative border-l border-gold/30 ml-3 pl-6 space-y-4">
                    <div className="relative">
                      <div className="absolute -left-[30px] top-0 w-3 h-3 rounded-full bg-gold" />
                      <div>
                        <span className="text-xs font-bold text-gold">08:00 AM - 09:00 AM</span>
                        <p className="text-sm font-semibold text-foreground">Mangala Snanam & Bridal Prep</p>
                        <p className="text-xs text-muted-foreground">At the venue suite</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[30px] top-0 w-3 h-3 rounded-full bg-gold" />
                      <div>
                        <span className="text-xs font-bold text-gold">09:30 AM - 10:15 AM</span>
                        <p className="text-sm font-semibold text-foreground">Gauri Puja & Ganesh Worship</p>
                        <p className="text-xs text-muted-foreground">Pandit Ramaswamy officiating</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[30px] top-0 w-3 h-3 rounded-full bg-gold" />
                      <div>
                        <span className="text-xs font-bold text-gold">10:37 AM (Muhurtham)</span>
                        <p className="text-sm font-bold text-brown">Jeelakarra Bellam & Kanyadaan</p>
                        <p className="text-xs text-muted-foreground">Auspicious timing block</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom mock tags */}
            <div className="flex justify-between items-center pt-4 border-t border-border mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Vetting Assured
              </span>
              <span>Subhakary OS Suite v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
