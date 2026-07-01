import { motion } from "framer-motion";
import { Calendar, Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import heroWedding from "@/assets/hero-wedding.jpg";
import heroPuja from "@/assets/hero-puja.jpg";
import heroCelebration from "@/assets/hero-celebration.jpg";

const heroSlides = [
  {
    image: heroWedding,
    title: "Sacred Ceremonies &",
    highlight: "Traditional",
    subtitle: "Indian Services",
    description: "Connect with experienced pandits, catering services, photographers, and decorators - all reviewed and vetted by families like yours."
  },
  {
    image: heroPuja,
    title: "Celebrate Your",
    highlight: "Special",
    subtitle: "Moments",
    description: "From intimate home pujas to grand wedding celebrations, find professionals who understand your regional traditions and rituals."
  },
  {
    image: heroCelebration,
    title: "Your Event",
    highlight: "Planning OS",
    subtitle: "Simplified",
    description: "Budget tracking, guest RSVPs, and checklist management - everything you need to organize your auspicious events in one place."
  }
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 6000, stopOnInteraction: false })]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#121110] via-[#221e1a] to-[#0f0e0d] text-cream pt-28 pb-16">
      {/* Background radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-60 z-0 pointer-events-none" />

      {/* Main Grid Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading, Slides & Call-to-Action Buttons */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            
            {/* Title & Carousel Text */}
            <div className="space-y-4">
              <motion.h1
                key={selectedIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight text-cream"
              >
                {heroSlides[selectedIndex].title}{" "}
                <span className="text-gold">{heroSlides[selectedIndex].highlight}</span>
                <br />
                {heroSlides[selectedIndex].subtitle}
              </motion.h1>

              <motion.p
                key={`desc-${selectedIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-body text-base sm:text-lg text-cream/80 max-w-xl leading-relaxed"
              >
                {heroSlides[selectedIndex].description}
              </motion.p>
            </div>

            {/* Carousel indicators */}
            <div className="flex gap-2 py-1">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi && emblaApi.scrollTo(index)}
                  className={`h-1.5 transition-all duration-300 rounded-full ${
                    selectedIndex === index ? "w-6 bg-gold" : "w-2 bg-cream/30"
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                variant="gold"
                size="lg"
                className="rounded-full px-8 py-6 font-semibold text-brown hover:scale-105 transition-transform cursor-pointer shadow-lg"
                onClick={() => navigate("/auth?redirect=/providers")}
              >
                Book a Service Provider
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 font-semibold text-cream border-cream/30 hover:bg-cream/10 hover:text-cream hover:scale-105 transition-transform cursor-pointer"
                onClick={() => navigate("/become-provider")}
              >
                Register as a Provider
              </Button>
            </div>

          </div>

          {/* Right Column: Webapp Browser Mockup */}
          <div className="lg:col-span-5 relative w-full h-[450px] lg:h-[500px] flex items-center justify-center">
            {/* Outer Browser Frame */}
            <div className="w-full max-w-[480px] bg-[#1E1C1A]/95 border border-cream/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[420px] relative z-10 transition-transform hover:scale-[1.02] duration-300">
              {/* Browser Title Bar */}
              <div className="bg-[#2D2A26] px-4 py-3 flex items-center justify-between border-b border-cream/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="bg-background/40 px-6 py-0.5 rounded-md text-[9px] text-cream/40 font-mono w-44 text-center truncate">
                  subhakary.com/workspace
                </div>
                <div className="w-10" />
              </div>

              {/* Webapp Content Grid */}
              <div className="flex-1 flex overflow-hidden text-cream/90 text-xs">
                {/* Left Sidebar */}
                <div className="w-16 bg-[#171514] border-r border-cream/10 flex flex-col items-center py-4 gap-4 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                    S
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-cream/40">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-cream/40">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>

                {/* Main Dashboard Content */}
                <div className="flex-1 bg-[#121110] p-4 space-y-4 overflow-y-auto">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-cream text-xs sm:text-sm">Ceremony Workspace</h4>
                      <p className="text-[9px] text-cream/50">Muhurtham Planning OS</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px]">Live</Badge>
                  </div>

                  {/* Stats Widget */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1E1C1A] p-2.5 rounded-xl border border-cream/10">
                      <span className="text-[9px] text-cream/50 block">Guest RSVP</span>
                      <span className="font-bold text-gold text-xs">245 / 310</span>
                    </div>
                    <div className="bg-[#1E1C1A] p-2.5 rounded-xl border border-cream/10">
                      <span className="text-[9px] text-cream/50 block">Budget Spent</span>
                      <span className="font-bold text-gold text-xs">78%</span>
                    </div>
                  </div>

                  {/* Booking Progress List */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-cream/40 uppercase tracking-wider block">Upcoming Bookings</span>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-cream/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-[9px] text-gold font-bold">
                            PR
                          </div>
                          <div>
                            <p className="font-semibold text-[9px]">Pandit Ramaswamy</p>
                            <p className="text-[8px] text-cream/50">Vedic Priest • Hyderabad</p>
                          </div>
                        </div>
                        <Badge className="bg-gold/20 text-gold border border-gold/30 text-[8px] px-1 py-0">Approved</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-cream/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center text-[9px] text-gold font-bold">
                            SC
                          </div>
                          <div>
                            <p className="font-semibold text-[9px]">Sai Catering Services</p>
                            <p className="text-[8px] text-cream/50">Traditional Food • Hyderabad</p>
                          </div>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] px-1.5 py-0">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
