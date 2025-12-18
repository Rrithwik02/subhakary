import { motion } from "framer-motion";
import { Users, Heart, Compass, Target } from "lucide-react";

const values = [
  {
    icon: Users,
    title: "Our Community",
    description: "We've built a thriving community of verified service providers and satisfied families.",
  },
  {
    icon: Heart,
    title: "Our Values",
    description: "We're committed to preserving and promoting sacred traditions while ensuring convenience and trust.",
  },
  {
    icon: Compass,
    title: "Our Journey",
    description: "Started with a vision to make sacred ceremonies accessible, we continue to grow and serve.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export const AboutSection = () => {
  return (
    <section id="about" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-brown-dark mb-6">
            About Subhakary
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Subhakary is your trusted partner in celebrating life's most sacred moments. 
            We bridge the gap between traditional ceremonial service providers and modern 
            families seeking authentic spiritual experiences.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16"
        >
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              variants={itemVariants}
              className="group relative bg-card border border-border rounded-2xl p-8 text-center hover-lift hover:border-gold/40 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gold/10 text-gold group-hover:bg-gold group-hover:text-brown-dark transition-all duration-300">
                  <value.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl font-semibold text-brown-dark mb-4">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl bg-cream p-10 md:p-14 lg:p-16"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-saffron/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-gold/20 text-gold">
              <Target className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-brown-dark mb-6">
              Our Mission
            </h3>
            <p className="text-lg md:text-xl text-brown leading-relaxed">
              To preserve and promote sacred traditions while making them accessible to 
              everyone through a trusted platform that connects families with qualified 
              service providers.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
