import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Star, MapPin, ArrowRight, X, Loader2, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchAIRecommendations, extractSearchParams, fetchProviders, type SearchProvider } from "@/lib/searchUtils";
import { toast } from "sonner";

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
  const [suggestion, setSuggestion] = useState("");
  const [providers, setProviders] = useState<SearchProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const doSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowResults(true);
    setSuggestion("");
    setProviders([]);

    try {
      if (user) {
        // Use AI recommendation engine for logged-in users
        const result = await fetchAIRecommendations(searchQuery.trim());
        setSuggestion(result.summary);
        setProviders(result.results);
      } else {
        // Fallback to client-side keyword search for anonymous users
        const params = extractSearchParams(searchQuery);
        const fetchedProviders = await fetchProviders(params);
        setProviders(fetchedProviders);
        setSuggestion(
          fetchedProviders.length > 0
            ? `Found ${fetchedProviders.length} providers matching your search.`
            : "No providers found. Try browsing our service categories."
        );
      }
    } catch (error: any) {
      console.error("Search error:", error);
      if (error.message?.includes("Rate limit")) {
        toast.error("Search is busy. Please try again in a moment.");
      } else if (error.message?.includes("credits")) {
        toast.error("AI search temporarily unavailable.");
      }
      // Fallback to keyword search on AI failure
      try {
        const params = extractSearchParams(searchQuery);
        const fetchedProviders = await fetchProviders(params);
        setProviders(fetchedProviders);
        setSuggestion("Here are providers matching your search.");
      } catch {
        setSuggestion("Unable to search right now. Please browse our categories.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    doSearch(query);
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
            disabled={isLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full hover:bg-primary/10"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </form>

      {/* Quick suggestion chips */}
      {!showResults && (
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {quickChips.map((chip, index) => (
            <motion.button
              key={chip.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                setQuery(chip.label);
                doSearch(chip.label);
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
      )}

      {/* Results Panel */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 space-y-3"
          >
            {/* AI Suggestion */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary mb-1">AI Suggestion</p>
                  {isLoading && !suggestion ? (
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">{suggestion || "Thinking..."}</p>
                  )}
                </div>
                <button onClick={() => setShowResults(false)} className="text-muted-foreground p-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Provider Results */}
            {providers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-background border border-border/50 rounded-xl p-3"
              >
                <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  Top Providers Found
                </h3>
                <div className="space-y-1">
                  {providers.map((provider) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2.5 rounded-lg active:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/providers/${provider.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-foreground text-sm truncate">
                            {provider.business_name}
                          </p>
                          {provider.is_premium && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-semibold flex-shrink-0">
                              <Crown className="h-2 w-2" />
                              Premium
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {provider.service_type && (
                            <span className="capitalize truncate">{provider.service_type}</span>
                          )}
                          {provider.city && (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                              <MapPin className="h-2.5 w-2.5" />
                              {provider.city}
                            </span>
                          )}
                          {provider.rating !== null && provider.rating > 0 && (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                              <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                              {provider.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
                    </motion.div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1.5 text-primary text-xs h-8"
                  onClick={() => navigate(`/providers?search=${encodeURIComponent(query)}`)}
                >
                  View All Providers
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* No results */}
            {!isLoading && providers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-3"
              >
                <p className="text-xs text-muted-foreground mb-2">No providers found matching your search.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => navigate('/providers')}
                >
                  Browse All Providers
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
