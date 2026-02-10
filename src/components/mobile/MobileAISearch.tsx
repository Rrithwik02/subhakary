import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Star, MapPin, ArrowRight, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { extractSearchParams, fetchProviders, type SearchProvider } from "@/lib/searchUtils";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export const MobileAISearch = () => {
  const [query, setQuery] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [providers, setProviders] = useState<SearchProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

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

    const params = extractSearchParams(searchQuery);

    try {
      const providersPromise = fetchProviders(params);

      // Stream AI suggestion only for logged-in users
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
                messages: [{ role: "user", content: `I'm looking for: ${searchQuery}. Give me a brief suggestion on what service category and type of provider would be best for my needs. Keep it to 2-3 sentences.` }],
                type: "search",
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
                      if (delta) { content += delta; setSuggestion(content); }
                    } catch { /* skip */ }
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
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    doSearch(query);
  };

  const quickChips = [
    { label: "Catering", emoji: "🍽️" },
    { label: "Nadaswaram", emoji: "🎵" },
    { label: "Weddings", emoji: "💒" },
  ];

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
            {/* AI Suggestion - only for logged-in users */}
            {user && (
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
            )}

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
                        <p className="font-medium text-foreground text-sm truncate">
                          {provider.business_name}
                        </p>
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

            {/* Close results - for non-logged-in users */}
            {!user && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowResults(false)}
                  className="text-xs text-muted-foreground underline"
                >
                  Close results
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
