import { motion } from "framer-motion";
import { Check, Shield, Users } from "lucide-react";

const indicators = [
  { icon: Check, label: "Verified Experts", color: "text-green-600" },
  { icon: Shield, label: "Secure Payments", color: "text-blue-600" },
  { icon: Users, label: "10k+ Families", color: "text-purple-600" },
];

export const MobileTrustIndicators = () => {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-around bg-muted/30 rounded-2xl py-4 px-2">
        {indicators.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center gap-1"
          >
            <div className={`h-10 w-10 rounded-full bg-card flex items-center justify-center shadow-sm`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium text-center whitespace-nowrap">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
