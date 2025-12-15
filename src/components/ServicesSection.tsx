import { motion } from "framer-motion";
import { 
  BookOpen, 
  Camera, 
  Palette, 
  Flower2, 
  Music, 
  PartyPopper, 
  UtensilsCrossed, 
  Building2, 
  Users 
} from "lucide-react";

const services = [
  {
    icon: BookOpen,
    name: "Poojari / Priest",
    description: "Experienced pandits for all ceremonies",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Camera,
    name: "Photography",
    description: "Capture every precious moment",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: Palette,
    name: "Makeup Artist",
    description: "Bridal & groom makeup services",
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: Flower2,
    name: "Mehandi",
    description: "Traditional & modern designs",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: Music,
    name: "Mangala Vadyam",
    description: "Auspicious traditional music",
    color: "from-yellow-500 to-amber-600",
  },
  {
    icon: PartyPopper,
    name: "Decoration",
    description: "Stunning venue transformations",
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: UtensilsCrossed,
    name: "Catering",
    description: "Delicious traditional cuisines",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: Building2,
    name: "Function Halls",
    description: "Perfect venues for your events",
    color: "from-teal-500 to-cyan-600",
  },
  {
    icon: Users,
    name: "Event Managers",
    description: "End-to-end event planning",
    color: "from-indigo-500 to-purple-600",
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {services.map((service) => (
            <motion.div
              key={service.name}
              variants={itemVariants}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover-lift cursor-pointer overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <service.icon className="w-7 h-7 text-cream" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {service.description}
                </p>

                {/* Arrow */}
                <div className="mt-4 flex items-center gap-2 text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
