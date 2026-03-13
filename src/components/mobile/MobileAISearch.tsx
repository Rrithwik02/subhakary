import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const EMOJI_MAP: Record<string, string> = {
  poojari: "🙏",
  photography: "📸",
  videography: "🎥",
  makeup: "💄",
  mehandi: "🎨",
  decoration: "🎊",
  catering: "🍽️",
  "function-halls": "🏛️",
  "event-managers": "📋",
  "mangala-vadyam": "🎵",
};

const DEFAULT_CHIPS = [
  { label: "Catering", emoji: "🍽️" },
  { label: "Photography", emoji: "📸" },
  { label: "Decoration", emoji: "🎊" },
];

export const MobileAISearch = () => {
  const [query, setQuery] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const { data: trendingChips } = useQuery({
    queryKey: ["trending-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trending_service_categories");
      if (error) throw error;
      return (data as { name: string; slug: string; booking_count: number }[]).map((c) => ({
        label: c.name,
        emoji: EMOJI_MAP[c.slug] || "✨",
      }));
    },
    staleTime: 1000 * 60 * 30,
  });

  const quickChips =
    trendingChips && trendingChips.length >= 3
      ? trendingChips.slice(0, 5)
      : [...(trendingChips || []), ...DEFAULT_CHIPS].slice(0, 5);

  const placeholderExamples = [
    "Find Poojari for Ganesh Puja",
    "Photographers in Mumbai",
    "Catering for 500 people",
    "Mehandi artist near me",
    "Wedding decorators in Hyderabad",
  ];
  const [placeholderIndex] = useState(0);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsNavigating(true);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="px-4 py-3">
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}>
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
            disabled={isNavigating}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full hover:bg-primary/10"
          >
            {isNavigating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </form>

      {/* Quick suggestion chips */}
      <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, index) => (
          <motion.button
            key={chip.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => {
              setQuery(chip.label);
              handleSearch(chip.label);
            }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors touch-active ${
              index === 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground border border-border/50"
            }`}
          >
            {chip.emoji} {chip.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
