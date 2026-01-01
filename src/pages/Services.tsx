import { useEffect } from "react";
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
  Users,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/NewsletterForm";

const services = [
  {
    icon: BookOpen,
    name: "Poojari / Priest Services",
    slug: "poojari",
    searchTerms: ["poojari near me", "pandit near me", "priest near me"],
    description: "Experienced pandits and priests for all Hindu ceremonies including weddings, griha pravesh, satyanarayan puja, and more.",
    features: ["Vedic rituals", "Multiple languages", "Custom ceremonies", "Travel available"],
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Camera,
    name: "Photography & Videography",
    slug: "photography",
    searchTerms: ["photographers near me", "wedding photographer near me"],
    description: "Professional photographers and videographers to capture every precious moment of your special occasions.",
    features: ["Candid photography", "Drone coverage", "Same-day edits", "Album creation"],
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: Palette,
    name: "Makeup Artists",
    slug: "makeup",
    searchTerms: ["makeup artist near me", "bridal makeup near me"],
    description: "Expert bridal, groom, and family makeup services for all your wedding and celebration needs.",
    features: ["HD & airbrush makeup", "Bridal packages", "Groom grooming", "Family makeup"],
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: Flower2,
    name: "Mehandi Artists",
    slug: "mehandi",
    searchTerms: ["mehandi artist near me", "henna artist near me"],
    description: "Talented mehandi artists offering traditional and contemporary henna designs for brides and guests.",
    features: ["Bridal mehandi", "Arabic designs", "Indo-Western", "Guest services"],
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: Music,
    name: "Mangala Vadyam",
    slug: "mangala-vadyam",
    searchTerms: ["mangala vadyam near me", "nadaswaram near me", "shehnai near me"],
    description: "Traditional nadaswaram, shehnai, and other auspicious musical performances for ceremonies.",
    features: ["Nadaswaram", "Shehnai", "Traditional bands", "DJ services"],
    color: "from-yellow-500 to-amber-600",
  },
  {
    icon: PartyPopper,
    name: "Decoration Services",
    slug: "decoration",
    searchTerms: ["decoration near me", "wedding decorators near me"],
    description: "Stunning venue transformations with beautiful floral arrangements, lighting, and themed decorations.",
    features: ["Mandap design", "Floral arrangements", "Lighting setup", "Theme decorations"],
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: UtensilsCrossed,
    name: "Catering Services",
    slug: "catering",
    searchTerms: ["catering near me", "caterers near me", "wedding catering"],
    description: "Delicious traditional and multi-cuisine catering services for weddings and all types of events.",
    features: ["Regional cuisines", "Live counters", "Fusion menus", "Custom menus"],
    color: "from-red-500 to-rose-600",
  },
  {
    icon: Building2,
    name: "Function Halls & Venues",
    slug: "venues",
    searchTerms: ["function halls near me", "wedding venues near me", "banquet halls near me"],
    description: "Premium venues and function halls for weddings, receptions, and all ceremonial gatherings.",
    features: ["AC halls", "Outdoor venues", "Premium locations", "Full amenities"],
    color: "from-teal-500 to-cyan-600",
  },
  {
    icon: Users,
    name: "Event Managers",
    slug: "event-management",
    searchTerms: ["event managers near me", "wedding planners near me"],
    description: "End-to-end event planning and coordination services to make your celebrations stress-free.",
    features: ["Complete planning", "Vendor coordination", "Day management", "Budget handling"],
    color: "from-indigo-500 to-purple-600",
  },
];

const Services = () => {
  // Set SEO meta tags dynamically
  useEffect(() => {
    document.title = "Wedding & Event Services Near Me - Photographers, Poojaris, Makeup Artists | Subhakary";
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Find photographers near me, poojaris near me, makeup artists near me, mehandi artists near me, decorators near me, caterers near me, function halls near me, event managers near me. Book verified professionals for weddings & events across India.");
    }
  }, []);

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
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
              Our Services
            </span>
            <h1 className="font-display text-4xl md:text-6xl text-brown mb-6">
              Everything You Need for
              <span className="block text-gold">Your Special Occasion</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              From sacred rituals to grand celebrations, find verified professionals
              for every traditional service across India.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card rounded-2xl p-8 border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-lg"
              >
                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <service.icon className="w-8 h-8 text-cream" />
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl font-semibold text-brown mb-3 group-hover:text-gold transition-colors">
                  {service.name}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {service.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 text-xs rounded-full bg-cream text-brown border border-border"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link to="/providers">
                  <Button variant="outline" className="w-full border-brown/20 hover:bg-brown hover:text-cream group-hover:border-gold">
                    Find Providers
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-brown rounded-3xl p-10 md:p-16 text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl text-cream mb-4">
              Ready to Find Your Perfect Provider?
            </h2>
            <p className="text-cream/80 mb-8 max-w-2xl mx-auto">
              Browse our verified service providers and book with confidence. 
              Every provider is vetted for quality and reliability.
            </p>
            <Link to="/providers">
              <Button className="bg-gold hover:bg-gold/90 text-brown px-8 py-6 rounded-full text-lg">
                Browse All Providers
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h3 className="font-display text-3xl text-brown mb-4">
              Stay Updated
            </h3>
            <p className="text-muted-foreground mb-6">
              Subscribe to receive updates on new services, exclusive offers, and ceremony guides.
            </p>
            <NewsletterForm source="services_page" className="max-w-md mx-auto" />
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Services;
