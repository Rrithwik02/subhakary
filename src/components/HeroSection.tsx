import { motion } from "framer-motion";
import { ChevronDown, Calendar, MapPin, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISearch } from "@/components/AISearch";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import heroWedding from "@/assets/hero-wedding.jpg";
import heroPuja from "@/assets/hero-puja.jpg";
import heroCelebration from "@/assets/hero-celebration.jpg";

const services = [
  "Poojari / Priest",
  "Photography",
  "Makeup Artist",
  "Mehandi",
  "Decoration",
  "Catering",
  "Function Halls",
  "Event Manager",
];

const heroSlides = [
  {
    image: heroWedding,
    title: "Sacred Ceremonies &",
    highlight: "Traditional",
    subtitle: "Indian Services",
    description: "Book trusted pandits, photographers, caterers & decorators for authentic Indian weddings, pooja rituals, mehendi ceremonies & traditional events across India"
  },
  {
    image: heroPuja,
    title: "Celebrate Your",
    highlight: "Special",
    subtitle: "Moments",
    description: "From intimate pujas to grand weddings, find verified professionals who understand your traditions and deliver exceptional service"
  },
  {
    image: heroCelebration,
    title: "Trusted",
    highlight: "Professionals",
    subtitle: "Near You",
    description: "Connect with experienced pandits, photographers, makeup artists and more - all verified and reviewed by families like yours"
  },
  {
    image: heroWedding,
    title: "Your One-Stop",
    highlight: "Destination",
    subtitle: "For Events",
    description: "Whether it's a wedding, griha pravesh, or naming ceremony - we have the perfect service providers to make your event memorable"
  },
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const [showAISearch, setShowAISearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [locationInput, setLocationInput] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedService) params.set("service", selectedService);
    if (locationInput) params.set("city", locationInput);
    if (selectedDate) params.set("date", selectedDate);
    navigate(`/providers${params.toString() ? `?${params.toString()}` : ""}`);
  };
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
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

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Carousel Background */}
      <div className="absolute inset-0 z-0" ref={emblaRef}>
        <div className="flex h-full">
          {heroSlides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative h-full">
              <img
                src={slide.image}
                alt={`Traditional Indian ceremony ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 hero-overlay" />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline - Animated based on current slide */}
          <motion.h1
            key={selectedIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-cream leading-tight mb-6"
          >
            {heroSlides[selectedIndex].title}{" "}
            <span className="text-gradient-gold">{heroSlides[selectedIndex].highlight}</span>
            <br />
            {heroSlides[selectedIndex].subtitle}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            key={`desc-${selectedIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-body text-base sm:text-lg text-cream/80 max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            {heroSlides[selectedIndex].description}
          </motion.p>

          {/* Search Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex justify-center gap-2 mb-6"
          >
            <Button
              variant={!showAISearch ? "gold" : "outline"}
              size="sm"
              onClick={() => setShowAISearch(false)}
              className={!showAISearch ? "" : "bg-background/20 border-cream/30 text-cream hover:bg-background/30"}
            >
              <Search className="w-4 h-4 mr-2" />
              Quick Search
            </Button>
            <Button
              variant={showAISearch ? "gold" : "outline"}
              size="sm"
              onClick={() => setShowAISearch(true)}
              className={showAISearch ? "" : "bg-background/20 border-cream/30 text-cream hover:bg-background/30"}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Search
            </Button>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {showAISearch ? (
              <div className="glass-card rounded-2xl p-6 max-w-3xl mx-auto">
                <AISearch />
              </div>
            ) : (
              <div className="glass-card rounded-2xl sm:rounded-full p-4 sm:p-2 max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0">
                {/* Service Dropdown */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-2 border-2 border-primary/40 sm:border-0 rounded-xl sm:rounded-none bg-primary/5 sm:bg-transparent">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <select 
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-foreground/80 cursor-pointer text-sm sm:text-base"
                  >
                    <option value="">Choose a Service</option>
                    {services.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Divider - Desktop only */}
                <div className="hidden sm:block w-px h-8 bg-border/50 mx-1" />

                {/* Date Picker */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-2 border-2 border-primary/40 sm:border-0 rounded-xl sm:rounded-none bg-primary/5 sm:bg-transparent">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-foreground/80 text-sm sm:text-base"
                    placeholder="Date of the Event"
                  />
                </div>

                {/* Divider - Desktop only */}
                <div className="hidden sm:block w-px h-8 bg-border/50 mx-1" />

                {/* Location */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-2 border-2 border-primary/40 sm:border-0 rounded-xl sm:rounded-none bg-primary/5 sm:bg-transparent">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Location of the Event" 
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-foreground/80 placeholder:text-foreground/50 text-sm sm:text-base"
                  />
                </div>

                {/* Search Button */}
                <Button
                  variant="gold"
                  className="w-full sm:w-auto h-12 px-6 rounded-xl sm:rounded-full flex-shrink-0 self-center gap-2 sm:ml-2"
                  onClick={handleSearch}
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Interactive Carousel Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center justify-center gap-2 mt-16"
        >
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                selectedIndex === index
                  ? "w-8 h-2 bg-cream"
                  : "w-2 h-2 bg-cream/40 hover:bg-cream/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
