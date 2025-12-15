import { motion } from "framer-motion";
import { ChevronDown, Calendar, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
            className="font-body text-base sm:text-lg text-cream/80 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Book trusted pandits, photographers, caterers & decorators for authentic
            Indian weddings, pooja rituals, mehendi ceremonies & traditional events
            across India
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass-card rounded-full p-2 max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
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

      {/* Floating WhatsApp Button */}
      <motion.a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 gradient-gold rounded-full flex items-center justify-center shadow-gold hover:scale-110 transition-transform"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 text-brown-dark"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </motion.a>
    </section>
  );
};
