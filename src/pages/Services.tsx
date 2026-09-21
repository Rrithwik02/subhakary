import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SEOHead } from "@/components/SEOHead";
import { servicesSEO, getAllKeywords } from "@/data/seoData";
import poojariImage from "@/assets/service-illustrations/poojari.png";
import photographyImage from "@/assets/service-illustrations/photography.png";
import videographyImage from "@/assets/service-illustrations/videography.png";
import makeupImage from "@/assets/service-illustrations/makeup.png";
import mehandiImage from "@/assets/service-illustrations/mehandi.png";
import mangalaVadyamImage from "@/assets/service-illustrations/mangala-vadyam.png";
import decorationImage from "@/assets/service-illustrations/decoration.png";
import cateringImage from "@/assets/service-illustrations/catering.png";
import venuesImage from "@/assets/service-illustrations/venues.png";
import eventManagementImage from "@/assets/service-illustrations/event-management.png";

const services = [
  {
    image: poojariImage,
    name: "Poojari / Priest Services",
    slug: "poojari",
    seoSlug: "poojari",
    description: "Experienced pandits and priests for all Hindu ceremonies including weddings, griha pravesh, satyanarayan puja, and more.",
    features: ["Vedic rituals", "Multiple languages", "Custom ceremonies", "Travel available"],
    color: "from-amber-500 to-orange-600",
  },
  {
    image: photographyImage,
    name: "Photography",
    slug: "photography",
    seoSlug: "photographer",
    description: "Professional photographers to capture every precious moment of your special occasions.",
    features: ["Candid photography", "Drone coverage", "Same-day edits", "Album creation"],
    color: "from-rose-500 to-pink-600",
  },
  {
    image: videographyImage,
    name: "Videography",
    slug: "videography",
    seoSlug: "videographer",
    description: "Professional videographers for cinematic wedding films and event documentation.",
    features: ["4K video", "Drone shots", "Same-day edits", "Highlight reels"],
    color: "from-violet-500 to-purple-600",
  },
  {
    image: makeupImage,
    name: "Makeup Artists",
    slug: "makeup",
    seoSlug: "makeup-artist",
    description: "Expert bridal, groom, and family makeup services for all your wedding and celebration needs.",
    features: ["HD & airbrush makeup", "Bridal packages", "Groom grooming", "Family makeup"],
    color: "from-purple-500 to-violet-600",
  },
  {
    image: mehandiImage,
    name: "Mehandi Artists",
    slug: "mehandi",
    seoSlug: "mehandi-artist",
    description: "Talented mehandi artists offering traditional and contemporary henna designs for brides and guests.",
    features: ["Bridal mehandi", "Arabic designs", "Indo-Western", "Guest services"],
    color: "from-emerald-500 to-green-600",
  },
  {
    image: mangalaVadyamImage,
    name: "Mangala Vadyam",
    slug: "mangala-vadyam",
    seoSlug: "mangala-vadyam",
    description: "Traditional nadaswaram, shehnai, and other auspicious musical performances for ceremonies.",
    features: ["Nadaswaram", "Shehnai", "Traditional bands", "DJ services"],
    color: "from-yellow-500 to-amber-600",
  },
  {
    image: decorationImage,
    name: "Decoration Services",
    slug: "decoration",
    seoSlug: "decoration",
    description: "Stunning venue transformations with beautiful floral arrangements, lighting, and themed decorations.",
    features: ["Mandap design", "Floral arrangements", "Lighting setup", "Theme decorations"],
    color: "from-sky-500 to-blue-600",
  },
  {
    image: cateringImage,
    name: "Catering Services",
    slug: "catering",
    seoSlug: "catering",
    description: "Delicious traditional and multi-cuisine catering services for weddings and all types of events.",
    features: ["Regional cuisines", "Live counters", "Fusion menus", "Custom menus"],
    color: "from-red-500 to-rose-600",
  },
  {
    image: venuesImage,
    name: "Function Halls & Venues",
    slug: "venues",
    seoSlug: "function-halls",
    description: "Premium venues and function halls for weddings, receptions, and all ceremonial gatherings.",
    features: ["AC halls", "Outdoor venues", "Premium locations", "Full amenities"],
    color: "from-teal-500 to-cyan-600",
  },
  {
    image: eventManagementImage,
    name: "Event Managers",
    slug: "event-management",
    seoSlug: "event-managers",
    description: "End-to-end event planning and coordination services to make your celebrations stress-free.",
    features: ["Complete planning", "Vendor coordination", "Day management", "Budget handling"],
    color: "from-indigo-500 to-purple-600",
  },
];

// Generate combined keywords from all services for SEO
const getAllServicesKeywords = (): string => {
  return servicesSEO.flatMap(service => getAllKeywords(service)).slice(0, 50).join(", ");
};

const Services = () => {
  const pageKeywords = getAllServicesKeywords();
  const navigate = useNavigate();

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/providers?service=${encodeURIComponent(categorySlug)}`);
  };

  return (
    <>
      <SEOHead
        title="Wedding & Event Services Near Me - Photographers, Poojaris, Makeup Artists | Subhakary"
        description="Find photographers near me, poojaris near me, makeup artists near me, mehandi artists near me, videographers near me, decorators near me, caterers near me, function halls near me, and event managers near me. Book verified professionals for weddings & events across India."
        keywords={pageKeywords}
        canonicalUrl="https://subhakary.com/services"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Wedding & Event Services",
          "description": "Complete range of wedding and event services across India",
          "numberOfItems": services.length,
          "itemListElement": services.map((service, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Service",
              "name": service.name,
              "description": service.description,
              "url": `https://subhakary.com/services/${service.seoSlug}`
            }
          }))
        }}
      />
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
                  className="group bg-card rounded-2xl p-8 border border-border hover:border-gold/30 transition-all duration-300 hover:shadow-lg cursor-pointer"
                  onClick={() => handleCategoryClick(service.slug)}
                >
                  <div className="mb-6 h-20 w-20 overflow-hidden rounded-2xl border border-gold/15 bg-cream shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <img src={service.image} alt="" className="h-full w-full object-cover" />
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
                  <Button 
                    variant="outline" 
                    className="w-full border-brown/20 hover:bg-brown hover:text-cream group-hover:border-gold cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(service.slug);
                    }}
                  >
                    Explore Service
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              ))}
            </div>
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
    </>
  );
};

export default Services;
