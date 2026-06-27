import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export const MobileFeaturedBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-gold-dark p-5"
        onClick={() => navigate("/providers")}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Badge */}
        <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-medium text-white/90 mb-2">
          VASANT PANCHAMI SPECIAL
        </span>

        {/* Content */}
        <h3 className="font-display text-xl font-bold text-white mb-1">
          Plan Your Auspicious Day
        </h3>
        <p className="text-white/80 text-xs max-w-[200px]">
          Book verified service partners for your next ceremony.
        </p>

        {/* CTA */}
        <div className="mt-4">
          <span className="inline-flex items-center gap-1 text-white text-xs font-medium">
            Explore Now →
          </span>
        </div>
      </motion.div>
    </div>
  );
};
