import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Loader2, Star, MapPin, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { extractSearchParams, fetchProviders, type SearchProvider } from "@/lib/searchUtils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

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

  const getAISuggestion = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowResults(true);
    setSuggestion("");
    setProviders([]);

    const params = extractSearchParams(query);

    try {
      const providersPromise = fetchProviders(params);

      // Only call AI for logged-in users
      if (user) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          if (accessToken) {
            const response = await fetch(CHAT_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                messages: [{ role: "user", content: `I'm looking for: ${query}. Give me a brief suggestion on what service category and type of provider would be best for my needs. Keep it to 2-3 sentences.` }],
                type: "search"
              }),
            });

            if (response.ok) {
              const reader = response.body?.getReader();
              const decoder = new TextDecoder();
              let content = "";

              if (reader) {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = decoder.decode(value, { stream: true });
                  const lines = chunk.split("\n");

                  for (const line of lines) {
                    if (line.startsWith("data: ") && line !== "data: [DONE]") {
                      try {
                        const json = JSON.parse(line.slice(6));
                        const delta = json.choices?.[0]?.delta?.content;
                        if (delta) {
                          content += delta;
                          setSuggestion(content);
                        }
                      } catch {
                        // Skip invalid JSON
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("AI suggestion error:", err);
        }
      }

      const fetchedProviders = await providersPromise;
      setProviders(fetchedProviders);
    } catch (error) {
      console.error("AI search error:", error);
      setSuggestion("I couldn't process your request. Try browsing our service categories directly.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
    getAISuggestion();
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
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {provider.business_name}
                        </p>
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
