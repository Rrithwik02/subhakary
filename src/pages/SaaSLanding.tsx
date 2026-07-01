import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Sparkles, 
  ArrowRight,
  ChevronRight,
  Database,
  Calendar,
  Layers,
  HeartHandshake
} from "lucide-react";

export default function SaaSLanding() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"budget" | "rsvp" | "checklist">("budget");

  // Trust logos/badges
  const trustBadges = [
    { label: "Razorpay Secure Payments", icon: ShieldCheck },
    { label: "100% KYC Vetted Providers", icon: Users },
    { label: "ISO 27001 Encrypted", icon: Lock },
    { label: "24/7 Priority Assistance", icon: Clock }
  ];

  // Pricing Plans
  const pricingPlans = [
    {
      name: "Muhurtham Basic",
      price: "₹0",
      period: "forever",
      description: "Essential planning tools for intimate home ceremonies and family pujas.",
      features: [
        "Up to 50 Guest Invitations",
        "Basic Budget Tracker",
        "Vedic Ritual Checklist",
        "Standard Chat Support",
        "Dynamic Muhurtham Planner"
      ],
      cta: "Start Planning Free",
      popular: false
    },
    {
      name: "Ceremony Pro",
      price: "₹4,999",
      period: "per event",
      description: "Advanced analytics and complete coordination for weddings and grand events.",
      features: [
        "Unlimited Guest RSVPs & Smart Invites",
        "Real-time Expense & Budget Analytics",
        "Collaborative Planner Workspaces",
        "AI Vendor Selection Assistant",
        "Automated Milestone Reminders",
        "Priority Support (Response under 2hrs)"
      ],
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Agency Elite",
      price: "₹14,999",
      period: "per year",
      description: "For professional wedding planners and event management agencies.",
      features: [
        "Manage Multiple Ceremonies Simultaneously",
        "Custom Client Brand Portals",
        "Advanced Multi-Vendor Analytics",
        "Detailed CSV Export & Financial Reporting",
        "Dedicated Account Success Manager",
        "Featured Directory Listings"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <main className="min-h-screen bg-cream text-brown-dark">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 overflow-hidden bg-gradient-to-b from-cream to-background">
        {/* Background mesh/lights decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/15 via-transparent to-transparent opacity-85 pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 mb-4 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5 mr-1 inline animate-pulse text-gold" />
                  Subhakary Event Intelligence
                </Badge>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-brown-dark">
                  The Planning OS for <span className="text-gold">Sacred Ceremonies</span>
                </h1>
                <p className="text-base sm:text-lg text-brown/70 mt-4 max-w-xl leading-relaxed">
                  Plan, allocate budget, manage RSVPs, and coordinate vetted vendor networks with our data-driven SaaS platform. Experience stress-free traditional ceremonies.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap gap-4"
              >
                <Button
                  variant="gold"
                  size="lg"
                  className="rounded-full px-8 py-6 font-semibold text-brown-dark hover:scale-105 transition-transform shadow-lg cursor-pointer"
                  onClick={() => navigate("/auth?redirect=/planning-os")}
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 py-6 font-semibold text-brown-dark border-brown/30 hover:bg-brown/5 hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => {
                    const el = document.getElementById("pricing");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  View Pricing
                </Button>
              </motion.div>
            </div>

            {/* Right Dashboard visualization (Glassmorphism cards & Live SVG Chart) */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-[500px] bg-white border border-brown/15 rounded-3xl p-6 shadow-xl space-y-6"
              >
                {/* Dashboard Header */}
                <div className="flex items-center justify-between pb-4 border-b border-brown/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-gold">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-brown-dark">Budget Analytics</h3>
                      <p className="text-[10px] text-brown/50 font-medium">Real-Time Cost Distribution</p>
                    </div>
                  </div>
                  <Badge className="bg-gold/10 text-gold border border-gold/30 hover:bg-gold/25 text-[10px]">
                    v3.2
                  </Badge>
                </div>

                {/* Main Interactive SVG Chart */}
                <div className="relative h-44 w-full flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(45,42,38,0.08)" strokeDasharray="4 4" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(45,42,38,0.08)" strokeDasharray="4 4" />
                    <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(45,42,38,0.08)" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(45,42,38,0.08)" />

                    {/* Gradient under curve */}
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(212,175,55,0.3)" />
                        <stop offset="100%" stopColor="rgba(212,175,55,0)" />
                      </linearGradient>
                    </defs>

                    {/* Shaded Area */}
                    <path
                      d="M 0 120 C 80 130, 120 40, 200 60 C 280 80, 320 20, 400 30 L 400 140 L 0 140 Z"
                      fill="url(#chartGrad)"
                    />

                    {/* Curve Line */}
                    <path
                      d="M 0 120 C 80 130, 120 40, 200 60 C 280 80, 320 20, 400 30"
                      fill="none"
                      stroke="url(#chartLineGrad)"
                      strokeWidth="3.5"
                    />

                    <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#C5A880" />
                      <stop offset="100%" stopColor="#D4AF37" />
                    </linearGradient>

                    {/* Data Indicator points */}
                    <circle cx="200" cy="60" r="5" fill="#D4AF37" stroke="#FFFFFF" strokeWidth="2" className="animate-ping" />
                    <circle cx="200" cy="60" r="4" fill="#D4AF37" />
                    
                    <circle cx="400" cy="30" r="4" fill="#D4AF37" />
                  </svg>
                  
                  {/* Floating tooltip */}
                  <div className="absolute top-8 left-[170px] bg-white border border-gold/30 rounded-lg px-2 py-1 shadow-md text-[9px] text-brown-dark">
                    <span className="font-semibold text-gold">₹11.7L</span> (Catering)
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-brown/10">
                  <div className="text-center">
                    <span className="text-[10px] text-brown/40 block font-medium">Spent Total</span>
                    <span className="font-bold text-brown-dark text-xs">₹11,70,000</span>
                  </div>
                  <div className="text-center border-x border-brown/10">
                    <span className="text-[10px] text-brown/40 block font-medium">Budget Goal</span>
                    <span className="font-bold text-gold text-xs">₹15,00,000</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-brown/40 block font-medium">Analytics Health</span>
                    <span className="font-bold text-emerald-600 text-xs">Stable</span>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Badges Row */}
      <section className="py-10 bg-[#F4EBE0]/80 border-y border-brown/15 backdrop-blur-md">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            {trustBadges.map((badge, idx) => {
              const IconComp = badge.icon;
              return (
                <div key={idx} className="flex items-center justify-center gap-3 text-brown/60 hover:text-brown-dark transition-colors duration-200">
                  <IconComp className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-xs font-semibold tracking-wide uppercase">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid Section with Glassmorphism */}
      <section className="py-20 bg-gradient-to-b from-cream to-background">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge className="bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20">
              Complete Control
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-brown-dark">
              Intelligent Planning Features
            </h2>
            <p className="text-brown/60 max-w-xl mx-auto text-sm sm:text-base">
              A comprehensive toolbelt of automated features crafted specifically for large-scale ceremony coordination.
            </p>
          </div>

          {/* Features Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-white/90 border border-brown/15 hover:border-gold/35 transition-all duration-300 rounded-2xl shadow-md hover:-translate-y-1 relative overflow-hidden group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-brown-dark">Budget Analytics</h3>
                <p className="text-xs leading-relaxed text-brown/60">
                  Track vendor costs, compare quotes, configure milestone payments, and visualize cost trends with automatic alert indicators.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-white/90 border border-brown/15 hover:border-gold/35 transition-all duration-300 rounded-2xl shadow-md hover:-translate-y-1 relative overflow-hidden group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-brown-dark">Guest Intelligence</h3>
                <p className="text-xs leading-relaxed text-brown/60">
                  Import contacts, send digital invitations via SMS/WhatsApp, log regional dietary preferences, and track RSVPs dynamically.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-white/90 border border-brown/15 hover:border-gold/35 transition-all duration-300 rounded-2xl shadow-md hover:-translate-y-1 relative overflow-hidden group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-brown-dark">Muhurtham Timeline</h3>
                <p className="text-xs leading-relaxed text-brown/60">
                  Plan every micro-event of your wedding, griha pravesh, or naming ceremonies, ensuring ritual timings are respected.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-white/90 border border-brown/15 hover:border-gold/35 transition-all duration-300 rounded-2xl shadow-md hover:-translate-y-1 relative overflow-hidden group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-brown-dark">Centralized Documents</h3>
                <p className="text-xs leading-relaxed text-brown/60">
                  Securely store invoices, vendor contracts, design moodboards, and photo directories in a central cloud locker.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-white/90 border border-brown/15 hover:border-gold/35 transition-all duration-300 rounded-2xl shadow-md hover:-translate-y-1 relative overflow-hidden group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-brown-dark">Collaborative Planning</h3>
                <p className="text-xs leading-relaxed text-brown/60">
                  Invite family members, planners, and main vendors to join the workspace with granular role-based edit permissions.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-white/90 border border-brown/15 hover:border-gold/35 transition-all duration-300 rounded-2xl shadow-md hover:-translate-y-1 relative overflow-hidden group">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-brown-dark">Pre-Vetted Directory</h3>
                <p className="text-xs leading-relaxed text-brown/60">
                  Direct API integrations with verified pandits, elite wedding photographers, caterers, and decorations experts in your city.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Real-time Interactive Analytics Section */}
      <section className="py-20 bg-cream/40">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <Badge className="bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20">
                Interactive Showcase
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-brown-dark leading-tight">
                Intuitive workspaces to monitor ceremony progress
              </h2>
              <p className="text-brown/60 text-sm leading-relaxed">
                Click the preview tabs to see mock dashboard workspaces representing various components of the SaaS OS. Monitor RSVP feedback, checklist statuses, and payments.
              </p>

              {/* Tab Toggles */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setActiveTab("budget")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTab === "budget" 
                      ? "bg-gold/10 border-gold text-gold" 
                      : "bg-white border-brown/15 text-brown/60 hover:bg-cream/20 hover:text-brown-dark"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <div>
                    <p className="text-xs font-bold">Budget Ledger Dashboard</p>
                    <p className="text-[9px] opacity-75">Track costs by vendor category</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>

                <button
                  onClick={() => setActiveTab("rsvp")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTab === "rsvp" 
                      ? "bg-gold/10 border-gold text-gold" 
                      : "bg-white border-brown/15 text-brown/60 hover:bg-cream/20 hover:text-brown-dark"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <div>
                    <p className="text-xs font-bold">Guest List Management</p>
                    <p className="text-[9px] opacity-75">Analyze meal requirements and feedback</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>

                <button
                  onClick={() => setActiveTab("checklist")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    activeTab === "checklist" 
                      ? "bg-gold/10 border-gold text-gold" 
                      : "bg-white border-brown/15 text-brown/60 hover:bg-cream/20 hover:text-brown-dark"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <div>
                    <p className="text-xs font-bold">Muhurtham Checklist Tracker</p>
                    <p className="text-[9px] opacity-75">Monitor critical rituals and task completion</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>

            {/* Right Display Area */}
            <div className="lg:col-span-7 bg-white border border-brown/15 rounded-3xl p-6 min-h-[350px] flex flex-col justify-center shadow-md">
              {activeTab === "budget" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-brown-dark">Cost Breakdown by Category</h4>
                    <span className="text-[10px] text-brown/40">Total Budget: ₹15,00,000</span>
                  </div>
                  
                  {/* Category Progress Bars */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-brown/70">
                        <span>Catering (Sai Catering)</span>
                        <span className="font-semibold text-gold">₹4,20,000 (28%)</span>
                      </div>
                      <div className="w-full bg-brown/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-gold h-full rounded-full" style={{ width: "28%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-brown/70">
                        <span>Decorations (Vivah Decors)</span>
                        <span className="font-semibold text-gold">₹3,50,000 (23%)</span>
                      </div>
                      <div className="w-full bg-brown/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-gold h-full rounded-full" style={{ width: "23%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-brown/70">
                        <span>Venue Rental (Sri Palace)</span>
                        <span className="font-semibold text-gold">₹3,00,000 (20%)</span>
                      </div>
                      <div className="w-full bg-brown/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-gold h-full rounded-full" style={{ width: "20%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-brown/70">
                        <span>Pandits & Rituals (Pandit Ram)</span>
                        <span className="font-semibold text-gold">₹1,00,000 (7%)</span>
                      </div>
                      <div className="w-full bg-brown/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-gold h-full rounded-full" style={{ width: "7%" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "rsvp" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-brown-dark">Guest Meal Preferences</h4>
                    <span className="text-[10px] text-brown/40">Total Invited: 310 Guests</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cream/20 p-4 rounded-2xl border border-brown/10 text-center space-y-1">
                      <span className="text-xl font-bold text-gold">220</span>
                      <span className="text-[10px] text-brown/50 block font-semibold uppercase">Traditional South Veg</span>
                    </div>
                    <div className="bg-cream/20 p-4 rounded-2xl border border-brown/10 text-center space-y-1">
                      <span className="text-xl font-bold text-gold">75</span>
                      <span className="text-[10px] text-brown/50 block font-semibold uppercase">Jain Menu (No Garlic)</span>
                    </div>
                  </div>

                  {/* Ring Progress Visualization in pure CSS */}
                  <div className="p-3 bg-cream/10 rounded-xl border border-brown/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-brown/80">RSVPs Confirmed</span>
                    </div>
                    <span className="font-bold text-emerald-600">79% (245 Guests)</span>
                  </div>
                </motion.div>
              )}

              {activeTab === "checklist" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-brown-dark">Auspicious Muhurtham Timings Checklist</h4>
                    <span className="text-[10px] text-brown/40">12 Tasks Completed</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-[11px] text-brown/50 line-through">Consult Astrologer for auspicious lagna timings</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[8px]">Done</Badge>
                    </div>

                    <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-[11px] text-brown/50 line-through">Confirm Pandit availability for Ganesha Puja</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[8px]">Done</Badge>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-brown/15 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-brown/30 flex-shrink-0" />
                        <span className="text-[11px] text-brown/80">Procure ritual list items (coconut, betel leaves, etc.)</span>
                      </div>
                      <Badge className="bg-gold/10 text-gold border border-gold/20 text-[8px]">Pending</Badge>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-cream/30 to-background relative">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge className="bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20">
              Pricing Options
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-brown-dark">
              Transparent, Value-Driven Plans
            </h2>
            <p className="text-brown/60 max-w-xl mx-auto text-sm sm:text-base">
              Choose the tier that fits the scale of your upcoming auspicious ceremony. Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <div 
                key={idx}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 border ${
                  plan.popular 
                    ? "bg-gradient-to-b from-white to-[#FDFBF9] border-2 border-gold shadow-lg scale-[1.03] md:-translate-y-2 z-10 text-brown-dark" 
                    : "bg-white border-brown/15 hover:border-gold/30 shadow-md text-brown-dark"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-brown-dark text-[10px] font-bold tracking-widest uppercase shadow-md">
                    Most Popular Choice
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-brown-dark">{plan.name}</h3>
                    <p className="text-xs text-brown/50 mt-1">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-brown-dark">{plan.price}</span>
                    <span className="text-xs text-brown/40 font-medium">/ {plan.period}</span>
                  </div>

                  <div className="border-t border-brown/10 pt-6">
                    <ul className="space-y-3.5 text-xs text-brown/85">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8 mt-auto">
                  <Button
                    variant={plan.popular ? "gold" : "outline"}
                    className={`w-full h-12 rounded-xl font-semibold cursor-pointer transition-all ${
                      !plan.popular ? "border-brown/30 text-brown-dark hover:bg-brown/5" : ""
                    }`}
                    onClick={() => navigate("/auth?redirect=/planning-os")}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Hook Section */}
      <section className="py-20 relative overflow-hidden bg-cream/40 border-t border-gold/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-60 z-0 pointer-events-none" />
        <div className="container mx-auto px-4 max-w-4xl text-center relative z-10 space-y-6">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-brown-dark">
            Ready to Plan Your Next Ceremony?
          </h2>
          <p className="text-brown/75 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Create your account today and unlock intelligent templates, budget alerts, and verified directory networks immediately.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Button
              variant="gold"
              size="lg"
              className="rounded-full px-8 py-6 font-semibold text-brown-dark hover:scale-105 transition-transform shadow-lg cursor-pointer"
              onClick={() => navigate("/auth?redirect=/planning-os")}
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 font-semibold text-brown-dark border-brown/30 hover:bg-brown/5 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate("/contact")}
            >
              Consult an Expert
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
