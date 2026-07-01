import { motion } from "framer-motion";
import { ChevronDown, Calendar, MapPin, Search, Star, Sparkles, CheckCircle2, IndianRupee, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { AISearch } from "@/components/AISearch";
import heroWedding from "@/assets/hero-wedding.jpg";
import heroPuja from "@/assets/hero-puja.jpg";
import heroCelebration from "@/assets/hero-celebration.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const heroSlides = [
  {
    image: heroWedding,
    title: "Sacred Ceremonies &",
    highlight: "Traditional",
    subtitle: "Indian Services",
    description: "Book trusted pandits, photographers, caterers & decorators for authentic Indian weddings, pooja rituals & traditional events."
  },
  {
    image: heroPuja,
    title: "Celebrate Your",
    highlight: "Special",
    subtitle: "Moments",
    description: "From intimate pujas to grand weddings, find verified professionals who understand your traditions and deliver exceptional service."
  },
  {
    image: heroCelebration,
    title: "Trusted",
    highlight: "Professionals",
    subtitle: "Near You",
    description: "Connect with experienced pandits, photographers, makeup artists and more - all verified and reviewed by families like yours."
  }
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [locationInput, setLocationInput] = useState("");

  // Fetch categories dynamically
  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories-hero"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_categories")
        .select("id, slug, name")
        .order("name");
      return data || [];
    }
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedService) params.set("category", selectedService);
    if (locationInput) params.set("city", locationInput);
    if (selectedDate) params.set("date", selectedDate);
    navigate(`/providers${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brown text-cream pt-28 pb-16">
      {/* Background radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-60 z-0 pointer-events-none" />

      {/* Main Grid Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading, Slides & Search Controls */}
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

            {/* Standard Search Bar (Image 3 Mockup) */}
            <div className="w-full">
              {/* Mobile layout */}
              <div className="lg:hidden flex flex-col gap-3 bg-background/5 p-4 rounded-2xl border border-cream/20 backdrop-blur-md">
                <div className="flex items-center gap-3 px-4 py-3 border border-cream/20 rounded-xl bg-background/20">
                  <Search className="w-4 h-4 text-gold flex-shrink-0" />
                  <select 
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-cream cursor-pointer text-sm font-medium appearance-none"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" className="text-foreground">Choose a Service</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug} className="text-foreground">{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 border border-cream/20 rounded-xl bg-background/20">
                  <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 bg-transparent border-none outline-none text-cream text-sm font-medium [color-scheme:dark] cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 px-4 py-3 border border-cream/20 rounded-xl bg-background/20">
                  <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Location of the Event" 
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-cream placeholder:text-cream/50 text-sm font-medium"
                  />
                </div>

                <Button
                  variant="gold"
                  className="w-full h-12 rounded-xl gap-2 mt-2 font-semibold text-brown cursor-pointer"
                  onClick={handleSearch}
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </Button>
              </div>

              {/* Desktop layout */}
              <div className="hidden lg:flex items-center rounded-full border border-cream/30 bg-background/10 backdrop-blur-md p-1.5 shadow-xl">
                <div className="flex-1 flex items-center justify-between gap-2 px-5 py-2.5 hover:bg-white/5 rounded-full transition-colors cursor-pointer relative">
                  <select 
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-cream/90 cursor-pointer text-sm font-medium appearance-none focus:ring-0 focus:outline-none"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" className="text-foreground bg-background">Choose a Service</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug} className="text-foreground bg-background">{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-cream/70 flex-shrink-0 pointer-events-none" />
                </div>

                <div className="w-px h-8 bg-cream/25" />

                <div className="flex-1 flex items-center gap-2 px-5 py-2.5 hover:bg-white/5 rounded-full transition-colors">
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 bg-transparent border-none outline-none text-cream/90 text-sm font-medium [color-scheme:dark] cursor-pointer"
                  />
                </div>

                <div className="w-px h-8 bg-cream/25" />

                <div className="flex-1 flex items-center justify-between gap-2 px-5 py-2.5 hover:bg-white/5 rounded-full transition-colors">
                  <input 
                    type="text" 
                    placeholder="Location of the Event" 
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-cream/95 placeholder:text-cream/50 text-sm font-medium"
                  />
                  <MapPin className="w-4 h-4 text-cream/75 flex-shrink-0" />
                </div>

                <Button
                  variant="gold"
                  size="icon"
                  className="w-12 h-12 rounded-full flex-shrink-0 ml-2 cursor-pointer shadow-lg hover:scale-105 transition-transform"
                  onClick={handleSearch}
                >
                  <Search className="w-5 h-5 text-brown" />
                </Button>
              </div>
            </div>

            {/* AI Search Section */}
            <div className="w-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-cream/20" />
                <span className="text-cream/40 text-xs font-semibold uppercase tracking-wider">or search with AI</span>
                <div className="flex-1 h-px bg-cream/20" />
              </div>
              <div className="bg-background rounded-2xl p-2 shadow-xl border border-cream/10">
                <AISearch />
              </div>
            </div>

          </div>

          {/* Right Column: Wedding OS Interactive Mockup & Image display display */}
          <div className="lg:col-span-5 relative w-full h-[450px] lg:h-[500px] flex items-center justify-center">
            
            {/* Carousel images in the background of the mockup */}
            <div className="absolute inset-0 z-0 rounded-3xl overflow-hidden shadow-2xl border-4 border-gold/10" ref={emblaRef}>
              <div className="flex h-full">
                {heroSlides.map((slide, index) => (
                  <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full">
                    <img
                      src={slide.image}
                      alt={`Traditional Indian ceremony slide`}
                      className="w-full h-full object-cover filter brightness-[0.4]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Wedding OS Glassmorphic Dashboard Card */}
            <div className="relative z-10 w-[90%] max-w-[360px] bg-background/25 backdrop-blur-lg border border-cream/20 rounded-3xl p-5 shadow-2xl space-y-4">
              
              {/* Card Header */}
              <div className="flex justify-between items-center pb-3 border-b border-cream/15">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
                  <span className="text-xs font-bold text-cream">Wedding OS Active</span>
                </div>
                <Badge className="bg-gold/25 text-gold border border-gold/30 hover:bg-gold/25 text-[10px]">v2.1</Badge>
              </div>

              {/* Budget Widget */}
              <div className="bg-background/20 p-3 rounded-2xl border border-cream/10 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[11px] text-cream/70">Budget Spent</span>
                  </div>
                  <span className="text-xs font-bold text-cream">78%</span>
                </div>
                <div className="w-full bg-cream/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gold h-full rounded-full" style={{ width: "78%" }} />
                </div>
                <div className="flex justify-between text-[10px] text-cream/60">
                  <span>Spent: ₹11,70,000</span>
                  <span>Goal: ₹15,00,000</span>
                </div>
              </div>

              {/* Guest RSVP Widget */}
              <div className="bg-background/20 p-3 rounded-2xl border border-cream/10 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[11px] text-cream/70">RSVP Confirmed</span>
                  </div>
                  <span className="text-xs font-bold text-cream">245 / 310</span>
                </div>
                <div className="w-full bg-cream/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gold h-full rounded-full" style={{ width: "79%" }} />
                </div>
              </div>

              {/* Checklist Widget */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-cream/50 uppercase tracking-wider">Pending tasks</span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-cream/80 bg-background/10 p-2 rounded-lg border border-cream/5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                    <span className="line-through text-cream/40">Book Poojari for Muhurtham</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-cream/80 bg-background/10 p-2 rounded-lg border border-cream/5">
                    <div className="w-3.5 h-3.5 rounded-full border border-cream/35 flex-shrink-0" />
                    <span>Finalize Catering Menu selections</span>
                  </div>
                </div>
              </div>

              {/* Rating Badges decoration */}
              <div className="flex items-center justify-between text-[11px] text-cream/70 pt-2 border-t border-cream/10">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  4.9 Rating
                </span>
                <span>500+ Verified Vendors</span>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
