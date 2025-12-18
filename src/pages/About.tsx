import { motion } from "framer-motion";
import { Users, Heart, Compass, Target, ArrowLeft, Award, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/NewsletterForm";

const values = [
  {
    icon: Users,
    title: "Our Community",
    description: "We've built a thriving community of verified service providers and satisfied families across India.",
  },
  {
    icon: Heart,
    title: "Our Values",
    description: "We're committed to preserving and promoting sacred traditions while ensuring convenience and trust.",
  },
  {
    icon: Compass,
    title: "Our Journey",
    description: "Started with a vision to make sacred ceremonies accessible, we continue to grow and serve families nationwide.",
  },
];

const stats = [
  { number: "500+", label: "Verified Providers" },
  { number: "10,000+", label: "Happy Families" },
  { number: "50+", label: "Cities Covered" },
  { number: "4.8", label: "Average Rating" },
];

const features = [
  {
    icon: Shield,
    title: "Verified Providers",
    description: "Every service provider goes through a rigorous verification process to ensure quality and authenticity.",
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description: "We maintain high standards through customer reviews, ratings, and regular performance monitoring.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Our dedicated support team is always available to help you with any queries or concerns.",
  },
];

const About = () => {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-cream to-background">
        <div className="container mx-auto px-4">
          <Link to="/">
            <Button variant="ghost" className="mb-6 text-brown hover:text-gold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-6xl text-brown mb-6">
              About Subhakary
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Subhakary is your trusted partner in celebrating life's most sacred moments. 
              We bridge the gap between traditional ceremonial service providers and modern 
              families seeking authentic spiritual experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-brown">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-display text-4xl md:text-5xl text-gold mb-2">
                  {stat.number}
                </div>
                <div className="text-cream/80 text-sm md:text-base">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl text-brown text-center mb-12"
          >
            What Drives Us
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-card border border-border rounded-2xl p-8 text-center hover:border-gold/40 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gold/10 text-gold group-hover:bg-gold group-hover:text-brown transition-all duration-300">
                    <value.icon className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-brown mb-4">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-background p-10 md:p-16"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-saffron/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-gold/20 text-gold">
                <Target className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold text-brown mb-6">
                Our Mission
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                To preserve and promote sacred traditions while making them accessible to 
                everyone through a trusted platform that connects families with qualified 
                service providers. We believe in the power of tradition to bring families 
                together and create lasting memories.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl text-brown text-center mb-12"
          >
            Why Choose Subhakary?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-cream rounded-2xl p-8"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gold/10 text-gold">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-brown mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h3 className="font-display text-3xl text-brown mb-4">
              Stay Connected
            </h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to receive updates on Indian traditions, ceremony guides, and exclusive offers.
            </p>
            <NewsletterForm source="about_page" className="max-w-md mx-auto" />
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default About;
