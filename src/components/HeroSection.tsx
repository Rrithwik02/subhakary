import { motion } from "framer-motion";
import { Calendar, Users, LayoutDashboard, IndianRupee, CheckCircle2 } from "lucide-react";
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cream text-brown-dark pt-28 pb-16">
      {/* Background radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-60 z-0 pointer-events-none" />

      {/* Main Grid Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading, Slides & Call-to-Action Buttons */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            
            {/* Title & Carousel Text */}
            <div className="space-y-4">
              <motion.h1
                key={selectedIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight text-brown-dark"
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
                className="font-body text-base sm:text-lg text-brown/70 max-w-xl leading-relaxed"
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
                    selectedIndex === index ? "w-6 bg-gold" : "w-2 bg-brown/20"
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
                className="rounded-full px-8 py-6 font-semibold text-brown-dark hover:scale-105 transition-transform cursor-pointer shadow-lg"
                onClick={() => navigate("/auth?redirect=/providers")}
              >
                Book a Service Provider
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 font-semibold text-brown-dark border-brown/30 hover:bg-brown/5 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => navigate("/become-provider")}
              >
                Register as a Provider
              </Button>
            </div>

          </div>

          {/* Right Column: Wedding Planning Quiz Mockup (1st Image Product Representation) */}
          <div className="lg:col-span-6 relative w-full h-[480px] flex items-center justify-center">
            {/* Outer Browser Frame */}
            <div className="w-full max-w-[520px] bg-white border border-brown/15 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[440px] relative z-10 transition-transform hover:scale-[1.01] duration-300">
              {/* Browser Title Bar */}
              <div className="bg-cream/45 px-4 py-3 flex items-center justify-between border-b border-brown/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E6A085]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EAD8A7]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A2D3C2]" />
                </div>
                <div className="bg-white border border-brown/10 px-6 py-0.5 rounded-md text-[9px] text-brown/50 font-mono w-44 text-center truncate">
                  subhakary.com/quiz
                </div>
                <div className="w-10" />
              </div>

              {/* Quiz UI Mockup Content Area */}
              <div className="flex-1 flex overflow-hidden text-brown-dark text-[11px] bg-[#FCFBF9] p-4 gap-4">
                {/* Left Side: Form Mockup */}
                <div className="flex-grow space-y-3 overflow-y-auto pr-1">
                  <h3 className="font-display text-sm font-bold text-brown-dark border-b border-brown/10 pb-1">
                    Wedding Planning Quiz
                  </h3>

                  {/* Input Rows */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-semibold text-brown/60">Bride Name</span>
                      <div className="bg-white border border-brown/15 px-2 py-1.5 rounded-lg text-brown-dark font-medium">Priya</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-semibold text-brown/60">Groom Name</span>
                      <div className="bg-white border border-brown/15 px-2 py-1.5 rounded-lg text-brown-dark font-medium">Rohan</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-semibold text-brown/60">Wedding Date</span>
                      <div className="bg-white border border-brown/15 px-2 py-1.5 rounded-lg text-brown-dark font-medium flex justify-between items-center">
                        <span>28-11-2026</span>
                        <Calendar className="w-3.5 h-3.5 text-gold" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-semibold text-brown/60">Number of Guests</span>
                      <div className="bg-white border border-brown/15 px-2 py-1.5 rounded-lg text-brown-dark font-medium">300</div>
                    </div>
                  </div>

                  {/* Events Checklist Cards */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-semibold text-brown/60 block">Events Required</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white border border-gold p-2 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-bold text-[10px] text-brown-dark">Engagement</p>
                          <p className="text-[8px] text-brown/50">10% default allocation</p>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold fill-gold/10" />
                      </div>
                      <div className="bg-white border border-gold p-2 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-bold text-[10px] text-brown-dark">Wedding</p>
                          <p className="text-[8px] text-brown/50">40% default allocation</p>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold fill-gold/10" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: "What you will get" Mockup Card */}
                <div className="w-48 bg-white border border-brown/15 rounded-2xl p-3 flex flex-col justify-between shadow-sm flex-shrink-0">
                  <div className="space-y-3">
                    <h4 className="font-display text-[11px] font-bold text-brown-dark pb-1 border-b border-brown/10">
                      What you will get
                    </h4>

                    {/* Stat box */}
                    <div className="bg-cream/40 p-2.5 rounded-xl border border-gold/25 space-y-0.5">
                      <span className="text-[8px] text-brown/60 block">Projected total budget</span>
                      <span className="font-bold text-brown-dark text-[13px]">₹12,00,000</span>
                    </div>

                    {/* Bullet lists */}
                    <ul className="space-y-1.5 text-[9px] text-brown/70 leading-normal">
                      <li className="flex items-start gap-1">
                        <span className="text-gold font-bold">•</span>
                        <span>Budget buckets generated automatically</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-gold font-bold">•</span>
                        <span>Timeline & event workspaces</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-cream/20 p-2 rounded-xl border border-dashed border-gold/30">
                    <p className="text-[8px] font-bold text-brown/50 uppercase tracking-wide block mb-1">Starter tasks</p>
                    <div className="space-y-0.5 text-[8px] text-brown/80 font-medium">
                      <p>✓ Finalize photographer</p>
                      <p>✓ Book puja items</p>
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
