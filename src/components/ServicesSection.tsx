import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Camera, 
  Brush, 
  Hand, 
  Drum, 
  Flower2, 
  UtensilsCrossed, 
  Building2, 
  CalendarCheck 
} from "lucide-react";

const services = [
  {
    icon: Sparkles,
    name: "Poojari / Priest",
    description: "Experienced pandits for all ceremonies",
    color: "from-amber-500 to-orange-600",
    filter: "poojari",
  },
  {
    icon: Camera,
    name: "Photography",
    description: "Capture every precious moment",
    color: "from-rose-500 to-pink-600",
    filter: "photography",
  },
  {
    icon: Brush,
    name: "Makeup Artist",
    description: "Bridal & groom makeup services",
    color: "from-purple-500 to-violet-600",
    filter: "makeup",
  },
  {
    icon: Hand,
    name: "Mehandi",
    description: "Traditional & modern designs",
    color: "from-emerald-500 to-green-600",
    filter: "mehandi",
  },
  {
    icon: Drum,
    name: "Mangala Vadyam",
    description: "Auspicious traditional music",
    color: "from-yellow-500 to-amber-600",
    filter: "mangala-vadyam",
  },
  {
    icon: Flower2,
    name: "Decoration",
    description: "Stunning venue transformations",
    color: "from-sky-500 to-blue-600",
    filter: "decoration",
  },
  {
    icon: UtensilsCrossed,
    name: "Catering",
    description: "Delicious traditional cuisines",
    color: "from-red-500 to-rose-600",
    filter: "catering",
  },
  {
    icon: Building2,
    name: "Function Halls",
    description: "Perfect venues for your events",
    color: "from-teal-500 to-cyan-600",
    filter: "function-halls",
  },
  {
    icon: CalendarCheck,
    name: "Event Managers",
    description: "End-to-end event planning",
    color: "from-indigo-500 to-purple-600",
    filter: "event-managers",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const ServicesSection = () => {
  const navigate = useNavigate();

  const handleServiceClick = (filter: string) => {
    navigate(`/providers?service=${filter}`);
  };

  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
          >
            Our Services
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4"
          >
            Everything You Need for
            <br />
            <span className="text-gradient-gold">Your Special Occasion</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            From sacred rituals to grand celebrations, find verified professionals
            for every traditional service across India
          </motion.p>
        </div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.name}
              variants={itemVariants}
              onClick={() => handleServiceClick(service.filter)}
              className="group relative bg-card rounded-2xl p-5 sm:p-6 border border-border hover:border-primary/30 transition-all duration-300 hover-lift cursor-pointer overflow-hidden active:scale-[0.98] active:opacity-95 touch-manipulation">
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <service.icon className="w-6 h-6 sm:w-7 sm:h-7 text-cream" />
                </div>

                {/* Content */}
                <h3 className="font-display text-base sm:text-xl font-semibold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-1">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 hidden sm:block">
                  {service.description}
                </p>

                {/* Arrow - hidden on mobile */}
                <div className="mt-3 sm:mt-4 hidden sm:flex items-center gap-2 text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Explore</span>
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
