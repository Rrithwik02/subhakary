import { motion } from "framer-motion";
import { ChevronDown, Calendar, MapPin, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISearch } from "@/components/AISearch";
import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";

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

export const HeroSection = () => {
  const [showAISearch, setShowAISearch] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Traditional Indian ceremony"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-cream leading-tight mb-6"
          >
            Sacred Ceremonies &{" "}
            <span className="text-gradient-gold">Traditional</span>
            <br />
            Indian Services
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-body text-base sm:text-lg text-cream/80 max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Book trusted pandits, photographers, caterers & decorators for authentic
            Indian weddings, pooja rituals, mehendi ceremonies & traditional events
            across India
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
              <div className="glass-card rounded-full p-2 max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Service Dropdown */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-2 border-b sm:border-b-0 sm:border-r border-border/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <select className="w-full bg-transparent text-foreground font-medium text-sm appearance-none cursor-pointer focus:outline-none">
                      <option value="">Choose a Service</option>
                      {services.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Date Picker */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-2 border-b sm:border-b-0 sm:border-r border-border/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <input
                    type="date"
                    placeholder="Date of the Event"
                    className="flex-1 bg-transparent text-foreground font-medium text-sm appearance-none cursor-pointer focus:outline-none"
                  />
                </div>

                {/* Location */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <input
                    type="text"
                    placeholder="Location of the Event"
                    className="flex-1 bg-transparent text-foreground font-medium text-sm placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                {/* Search Button */}
                <Button
                  variant="gold"
                  size="icon"
                  className="w-12 h-12 rounded-full flex-shrink-0 self-center"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Carousel Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center justify-center gap-2 mt-16"
        >
          <div className="w-8 h-2 rounded-full bg-cream" />
          <div className="w-2 h-2 rounded-full bg-cream/40" />
          <div className="w-2 h-2 rounded-full bg-cream/40" />
          <div className="w-2 h-2 rounded-full bg-cream/40" />
        </motion.div>
      </div>
    </section>
  );
};
