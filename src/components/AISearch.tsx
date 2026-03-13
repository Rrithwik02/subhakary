import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Loader2, Star, MapPin, ArrowRight, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAIRecommendations, extractSearchParams, fetchProviders, type SearchProvider } from "@/lib/searchUtils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AISearchProps {
  onSearch?: (query: string) => void;
}

export const AISearch = ({ onSearch }: AISearchProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [providers, setProviders] = useState<SearchProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowResults(true);
    setSuggestion("");
    setProviders([]);

    try {
      if (user) {
        // Use AI recommendation engine for logged-in users
        const result = await fetchAIRecommendations(query.trim());
        setSuggestion(result.summary);
        setProviders(result.results);
      } else {
        // Fallback to client-side keyword search for anonymous users
        const params = extractSearchParams(query);
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
        toast.error("AI search temporarily unavailable. Please try again later.");
      }
      // Fallback to keyword search on AI failure
      try {
        const params = extractSearchParams(query);
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

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
    doSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe what you're looking for... (e.g., 'poojari for house warming in Hyderabad')"
              className="pl-12 pr-4 py-6 text-base rounded-xl border-2 focus:border-primary"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="px-6 py-6 rounded-xl bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                AI Search
              </>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 space-y-4"
          >
            {/* AI Suggestion */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary mb-1">AI Suggestion</p>
                  {isLoading && !suggestion ? (
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{suggestion}</p>
                  )}
                </div>
                {!isLoading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResults(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>

            {/* Provider Results */}
            {providers.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-background border rounded-xl p-4"
              >
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Top Providers Found
                </h3>
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/providers/${provider.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {provider.business_name}
                          </p>
                          {provider.is_premium && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                              <Crown className="h-2.5 w-2.5" />
                              Premium
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {provider.service_type && (
                            <span className="capitalize">{provider.service_type}</span>
                          )}
                          {provider.city && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {provider.city}
                            </span>
                          )}
                          {provider.rating !== null && provider.rating > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              {provider.rating.toFixed(1)}
                              {provider.total_reviews && ` (${provider.total_reviews})`}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-primary"
                  onClick={() => navigate('/providers')}
                >
                  View All Providers
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* No providers found */}
            {!isLoading && providers.length === 0 && suggestion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <p className="text-sm text-muted-foreground mb-2">No providers found matching your search.</p>
                <Button
                  variant="outline"
                  size="sm"
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
