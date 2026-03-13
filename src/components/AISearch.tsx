import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Loader2 } from "lucide-react";

interface AISearchProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

export const AISearch = ({ initialQuery = "", onSearch }: AISearchProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsNavigating(true);
    onSearch?.(query.trim());
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
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
          disabled={!query.trim() || isNavigating}
          className="px-6 py-6 rounded-xl bg-primary hover:bg-primary/90"
        >
          {isNavigating ? (
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
  );
};
