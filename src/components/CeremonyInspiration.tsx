import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const GALLERY_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?q=80&w=600&auto=format&fit=crop",
    title: "Vibrant Mandap Decor",
    category: "Decoration"
  },
  {
    url: "https://images.unsplash.com/photo-1609137144813-91b42fa023e3?q=80&w=600&auto=format&fit=crop",
    title: "Sacred Homam & Puja Setup",
    category: "Poojari"
  },
  {
    url: "https://images.unsplash.com/photo-1590075865003-e48277faa558?q=80&w=600&auto=format&fit=crop",
    title: "Intricate Bridal Mehendi",
    category: "Mehandi"
  },
  {
    url: "https://images.unsplash.com/photo-1547928576-a4a33237cbc3?q=80&w=600&auto=format&fit=crop",
    title: "Traditional South Indian Feast",
    category: "Catering"
  },
  {
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop",
    title: "Candid Muhurtham Shots",
    category: "Photography"
  },
  {
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600&auto=format&fit=crop",
    title: "Traditional Haldi Celebrations",
    category: "Event Planning"
  }
];

export const CeremonyInspiration = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="border-gold/30 text-gold bg-gold/5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Inspiration Gallery
          </Badge>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-brown mb-4">
            Ceremony Inspiration
          </h2>
          <p className="text-muted-foreground text-lg">
            Browse beautiful setups, authentic decor designs, and emotional moments captured at ceremonies planned through Subhakary.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_IMAGES.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative overflow-hidden rounded-2xl group cursor-pointer shadow-md h-80"
            >
              {/* Image */}
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Tint Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-brown/90 via-brown/30 to-transparent opacity-85 transition-opacity duration-300 group-hover:opacity-90" />

              {/* Text details */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end text-cream">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold mb-1">
                  {item.category}
                </span>
                <h3 className="font-display text-lg font-semibold group-hover:text-gold transition-colors duration-200">
                  {item.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
