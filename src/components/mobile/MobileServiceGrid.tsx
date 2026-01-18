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
  CalendarCheck,
  Video,
} from "lucide-react";

const services = [
  { icon: Sparkles, name: "Poojari", filter: "poojari", emoji: "🙏" },
  { icon: Camera, name: "Photography", filter: "photography", emoji: "📸" },
  { icon: Video, name: "Videography", filter: "videography", emoji: "🎥" },
  { icon: Brush, name: "Makeup Artist", filter: "makeup", emoji: "💄" },
  { icon: Hand, name: "Mehandi", filter: "mehandi", emoji: "✋" },
  { icon: Drum, name: "Mangala Vadyam", filter: "mangala-vadyam", emoji: "🥁" },
  { icon: Flower2, name: "Decoration", filter: "decoration", emoji: "🌸" },
  { icon: UtensilsCrossed, name: "Catering", filter: "catering", emoji: "🍛" },
  { icon: Building2, name: "Function Halls", filter: "function-halls", emoji: "🏛️" },
  { icon: CalendarCheck, name: "Event Managers", filter: "event-managers", emoji: "📋" },
];

export const MobileServiceGrid = () => {
  const navigate = useNavigate();

  const handleServiceClick = (filter: string) => {
    navigate(`/providers?service=${filter}`);
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Discover Services
        </h2>
        <button
          onClick={() => navigate("/services")}
          className="text-xs font-medium text-primary hover:underline"
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {services.slice(0, 9).map((service, index) => (
          <motion.button
            key={service.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleServiceClick(service.filter)}
            className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-all touch-active"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-lg">{service.emoji}</span>
            </div>
            <span className="text-[11px] font-medium text-foreground text-center line-clamp-1">
              {service.name}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Last item for "Event Managers" */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        onClick={() => handleServiceClick("event-managers")}
        className="w-fit mx-auto mt-3 flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl border border-border/50 hover:border-primary/30 transition-all touch-active"
      >
        <span className="text-sm">{services[9].emoji}</span>
        <span className="text-xs font-medium text-foreground">
          {services[9].name}
        </span>
      </motion.button>
    </div>
  );
};
