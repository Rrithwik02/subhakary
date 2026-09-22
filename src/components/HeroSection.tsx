import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Flower2, Heart, Search, Sparkles, UserRoundCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/interactive-wedding-hero.png";

type Hotspot = {
  id: string;
  label: string;
  search: string;
  description: string;
  icon: typeof Camera;
  area: string;
  pin: string;
};

const hotspots: Hotspot[] = [
  { id: "photographer", label: "Find photographers", search: "wedding photographers", description: "Capture every ceremony and celebration.", icon: Camera, area: "left-[1%] top-[50%] h-[43%] w-[25%]", pin: "left-[16%] top-[49%]" },
  { id: "decorator", label: "Find decoration artists", search: "wedding decoration artists", description: "Discover mandap, floral and stage decoration.", icon: Flower2, area: "left-[22%] top-[18%] h-[35%] w-[55%]", pin: "left-[49%] top-[18%]" },
  { id: "groom", label: "Find beauticians", search: "bridal and groom beauticians", description: "Explore makeup and grooming artists.", icon: Heart, area: "left-[36%] top-[50%] h-[36%] w-[15%]", pin: "left-[42%] top-[48%]" },
  { id: "bride", label: "Find beauticians", search: "bridal and groom beauticians", description: "Explore makeup and grooming artists.", icon: Heart, area: "left-[50%] top-[50%] h-[36%] w-[16%]", pin: "left-[58%] top-[48%]" },
  { id: "poojari", label: "Find poojaris", search: "poojaris for wedding rituals", description: "Search experienced priests for your rituals.", icon: UserRoundCheck, area: "left-[66%] top-[55%] h-[37%] w-[27%]", pin: "left-[77%] top-[51%]" },
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = hotspots.find((spot) => spot.id === activeId);
  const browseService = (service: string) => navigate(`/providers?service=${encodeURIComponent(service)}`);

  return (
    <section className="relative overflow-hidden bg-cream pb-12 pt-28 text-brown-dark sm:pb-16 lg:pt-32">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,.16),_transparent_58%)]" />
      <div className="container relative z-10 mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-10">
          <div className="max-w-xl text-center lg:text-left">
            <span className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-gold/35 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brown sm:mb-5 sm:px-4 sm:text-xs"><Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" /><span className="truncate">Subhakary celebrations</span></span>
            <h1 className="font-display text-[2.35rem] font-semibold leading-[1.04] sm:text-5xl md:text-6xl">Sacred Ceremonies &amp; <span className="text-gold">Traditional</span><br className="hidden sm:block" /> Indian Services</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brown/70 sm:mt-5 sm:text-lg lg:mx-0">Connect with experienced pandits, catering services, photographers, and decorators — all reviewed and vetted by families like yours.</p>
            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:justify-center lg:justify-start"><button type="button" onClick={() => navigate("/providers")} className="rounded-xl bg-brown px-6 py-3 text-sm font-semibold text-cream shadow-lg transition hover:bg-brown-dark">Book a Service Provider</button><button type="button" onClick={() => navigate("/planning-os")} className="rounded-xl border border-brown/15 bg-white px-6 py-3 text-sm font-semibold text-brown shadow-sm transition hover:bg-cream">Explore Planning OS</button></div>
          </div>

        <div className="relative mx-auto w-full max-w-[620px] overflow-hidden rounded-2xl border-2 border-gold/25 bg-white shadow-[0_16px_45px_rgba(59,33,26,.14)] sm:rounded-[2rem] sm:border-4 lg:max-w-none">
          <img src={heroImage} alt="Indian wedding ceremony with a photographer, couple and poojari" className="block h-auto w-full select-none" />
          {hotspots.map((spot) => {
            const isActive = activeId === spot.id;
            return <button key={spot.id} type="button" aria-label={spot.label} className={`group absolute ${spot.area} cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60`} onMouseEnter={() => setActiveId(spot.id)} onMouseLeave={() => setActiveId(null)} onFocus={() => setActiveId(spot.id)} onBlur={() => setActiveId(null)} onClick={() => browseService(spot.id === "photographer" ? "photography" : spot.id === "decorator" ? "decoration" : spot.id === "bride" || spot.id === "groom" ? "makeup" : "poojari")}><span className={`absolute inset-0 rounded-2xl transition ${isActive ? "bg-gold/20 ring-2 ring-gold ring-offset-2" : "bg-transparent"}`} /></button>;
          })}
          {hotspots.map((spot) => {
            const Icon = spot.icon;
            return <div key={`${spot.id}-pin`} className={`pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 ${spot.pin}`}><span className={`absolute inset-0 rounded-full bg-gold/70 ${activeId === spot.id ? "animate-ping" : ""}`} /><span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-gold bg-brown text-gold shadow-lg sm:h-9 sm:w-9"><Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></span></div>;
          })}
          <AnimatePresence>{active && <motion.button type="button" initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} onMouseEnter={() => setActiveId(active.id)} onMouseLeave={() => setActiveId(null)} onClick={() => browseService(active.id === "photographer" ? "photography" : active.id === "decorator" ? "decoration" : active.id === "bride" || active.id === "groom" ? "makeup" : "poojari")} className="absolute bottom-3 left-1/2 z-20 flex w-[min(92%,320px)] -translate-x-1/2 items-center gap-2 rounded-xl border border-gold/60 bg-brown p-3 text-left text-cream shadow-2xl sm:bottom-5 sm:gap-3 sm:rounded-2xl sm:p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold sm:h-9 sm:w-9"><Search className="h-4 w-4" /></span><span><strong className="block text-xs text-gold sm:text-sm">{active.label}</strong><span className="block pt-0.5 text-[11px] text-cream/80 sm:text-xs">{active.description}</span></span></motion.button>}</AnimatePresence>
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-gold/35 bg-brown/90 px-4 py-2 text-xs font-medium text-cream shadow-lg backdrop-blur sm:block">Hover or tap a person or the mandap to explore services</div>
        </div>
        </div>
      </div>
    </section>
  );
};
