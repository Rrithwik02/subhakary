import { motion } from "framer-motion";
import { ShieldCheck, Star, Clock, Users } from "lucide-react";

const stats = [
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Verified Providers",
    description: "All service providers are thoroughly verified",
  },
  {
    icon: Star,
    value: "4.8",
    label: "Average Rating",
    description: "Consistently high-quality services",
  },
  {
    icon: Clock,
    value: "24/7",
    label: "Support",
    description: "Round-the-clock customer assistance",
  },
  {
    icon: Users,
    value: "10K+",
    label: "Happy Families",
    description: "Trusted by thousands across India",
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
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export const TrustSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4"
          >
            Why Choose Us
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4"
          >
            Trusted by Families
            <br />
            <span className="text-gradient-gold">Across India</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            We take pride in connecting you with the most trusted and experienced
            service providers for your sacred ceremonies
          </motion.p>
        </div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="relative bg-card rounded-2xl p-8 border border-border text-center hover-lift"
            >
              {/* Icon */}
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-gold flex items-center justify-center mb-6 shadow-gold">
                <stat.icon className="w-8 h-8 text-brown-dark" />
              </div>

              {/* Value */}
              <div className="font-display text-4xl font-bold text-foreground mb-2">
                {stat.value}
              </div>

              {/* Label */}
              <div className="font-medium text-foreground mb-2">{stat.label}</div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Verification Badge Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 bg-card rounded-3xl p-8 md:p-12 border border-border"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Provider Verification Badges
              </h3>
              <p className="text-muted-foreground mb-6">
                Our rigorous verification process ensures you only connect with
                genuine, experienced professionals. Look for these badges when
                choosing a provider.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="verified-badge">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Identity Verified</span>
                </div>
                <div className="verified-badge">
                  <Star className="w-4 h-4" />
                  <span>Top Rated</span>
                </div>
                <div className="verified-badge">
                  <Users className="w-4 h-4" />
                  <span>10+ Years Experience</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto flex-shrink-0">
              <div className="w-48 h-48 mx-auto rounded-full gradient-gold flex items-center justify-center animate-float">
                <ShieldCheck className="w-24 h-24 text-brown-dark" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
