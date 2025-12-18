import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

interface AISearchProps {
  onSearch?: (query: string) => void;
}

export const AISearch = ({ onSearch }: AISearchProps) => {
  const [query, setQuery] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const getAISuggestion = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowSuggestion(true);
    setSuggestion("");

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `I'm looking for: ${query}. Give me a brief suggestion on what service category and type of provider would be best for my needs. Keep it to 2-3 sentences.` }],
          type: "search"
        }),
      });

      if (!response.ok) throw new Error("Failed to get AI suggestion");

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
              placeholder="Describe what you're looking for... (e.g., 'priest for house warming in Hyderabad')"
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
        {showSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl"
          >
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
                  onClick={() => setShowSuggestion(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
