import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, CalendarCheck, MessagesSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const trustMarkers = [
  { icon: ShieldCheck, label: "Verified providers" },
  { icon: CalendarCheck, label: "Availability you can trust" },
  { icon: MessagesSquare, label: "Direct provider chat" },
];

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-cream pt-40 pb-20 lg:pt-48 lg:pb-28">
      {/* Soft brand-color glow, no stock photography */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,_hsl(var(--gold)/0.16),_transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -z-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <Badge
            variant="outline"
            className="gap-1.5 rounded-full border-gold/40 bg-white/60 px-4 py-1.5 text-brown-dark backdrop-blur-sm"
          >
            <Sparkles className="size-3.5 text-gold-dark" />
            India&rsquo;s wedding &amp; event planning platform
          </Badge>

          <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.1] text-balance text-brown-dark sm:text-5xl lg:text-6xl">
            Sacred ceremonies, planned with{" "}
            <span className="text-gold-dark">verified professionals</span>
          </h1>

          <p className="font-body mt-6 max-w-2xl text-balance text-base leading-relaxed text-brown/70 sm:text-lg">
            Book trusted pandits, photographers, caterers, and decorators — then manage your
            entire wedding, budget, and guest list from one planning workspace.
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              variant="gold"
              size="lg"
              className="rounded-full px-8 py-6 font-semibold text-brown-dark shadow-lg transition-transform hover:scale-[1.02]"
              onClick={() => navigate("/providers")}
            >
              Book a Service Provider
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-brown/25 px-8 py-6 font-semibold text-brown-dark transition-transform hover:scale-[1.02] hover:bg-brown/5"
              onClick={() => navigate("/become-provider")}
            >
              Register as a Provider
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-brown/10 pt-8">
            {trustMarkers.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-brown/70">
                <Icon className="size-4 flex-shrink-0 text-gold-dark" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
