import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const MobileAISearch = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const placeholderExamples = [
    "Find Poojari for Ganesh Puja",
    "Photographers in Mumbai",
    "Catering for 500 people",
    "Mehandi artist near me",
    "Wedding decorators",
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/providers?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="px-4 py-3">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholderExamples[placeholderIndex]}
            className="pl-10 pr-12 h-12 rounded-full bg-muted/50 border-border/50 focus:border-primary text-sm"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full hover:bg-primary/10"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </form>

      {/* Quick suggestion chips */}
      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
        {["Catering", "Nadaswaram", "Weddings"].map((chip, index) => (
          <motion.button
            key={chip}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/providers?search=${chip.toLowerCase()}`)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors touch-active ${
              index === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground border border-border/50"
            }`}
          >
            {index === 0 && "🍽️ "}
            {index === 1 && "🎵 "}
            {index === 2 && "💒 "}
            {chip}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
