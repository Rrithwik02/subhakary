import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Briefcase, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const VendorPartnershipPortal = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-br from-brown to-brown/95 text-cream relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold/15 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Headline and bullet points */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold uppercase tracking-wider border border-gold/20">
              <Briefcase className="w-3.5 h-3.5" />
              Partner With Us
            </div>
            
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
              Grow Your Traditional <span className="text-gold">Ceremony Business</span>
            </h2>
            
            <p className="text-cream/80 text-base leading-relaxed">
              Connect with thousands of local families seeking trusted priests, pandits, photographers, caterers, and decorators. Manage bookings, schedule events, and accept secure payments all in one platform.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm font-medium text-cream/90">Keep 100% of your listed service rates</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm font-medium text-cream/90">Vetted verification badge to build customer trust</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm font-medium text-cream/90">Instant alerts for new booking inquiries in your city</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                variant="gold"
                className="px-8 py-6 rounded-full text-base font-semibold text-brown cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate("/become-provider")}
              >
                Register as a Provider
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right Column: Key Statistics & Callout Card */}
          <div className="bg-white/5 border border-cream/10 rounded-3xl p-8 backdrop-blur-md space-y-8">
            <h3 className="font-display text-xl font-bold text-cream">Subhakary Provider Network</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-gold block">500+</span>
                <span className="text-xs text-cream/60 uppercase font-semibold tracking-wider">Active Providers</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-gold block">10k+</span>
                <span className="text-xs text-cream/60 uppercase font-semibold tracking-wider">Bookings Scheduled</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-gold block">₹0</span>
                <span className="text-xs text-cream/60 uppercase font-semibold tracking-wider">Setup Fees</span>
              </div>
              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-gold block">4.8★</span>
                <span className="text-xs text-cream/60 uppercase font-semibold tracking-wider">Average Rating</span>
              </div>
            </div>

            <div className="bg-cream/10 p-5 rounded-2xl border border-gold/10">
              <p className="text-xs italic text-cream/90">
                "Joining Subhakary allowed me to streamline my wedding booking calendar and connect with clients outside my traditional local networks. It doubled my priest service bookings in just 3 months."
              </p>
              <span className="block text-xs font-bold text-gold mt-3 text-right">
                — Shastri Ramachandra, Vedic Priest
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
