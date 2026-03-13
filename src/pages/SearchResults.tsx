import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Star, MapPin, ArrowRight, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AISearch } from "@/components/AISearch";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useMobileLayout } from "@/hooks/useMobileLayout";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileAISearch } from "@/components/mobile/MobileAISearch";
import {
  fetchAIRecommendations,
  extractSearchParams,
  fetchProviders,
  type SearchProvider,
  type AIRecommendationResult,
} from "@/lib/searchUtils";
import { SEOHead } from "@/components/SEOHead";

const SearchResults = () => {
  const isMobile = useMobileLayout();
  if (isMobile) return <MobileSearchResults />;
  return <DesktopSearchResults />;
};

const MobileSearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { suggestion, providers, isLoading } = useSearchLogic(query);
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <SEOHead title={`Search: ${query} | Subhakary`} description={`AI-powered search results for "${query}"`} />
      <div className="px-4 pt-2 pb-20 space-y-4">
        <MobileAISearch />

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {suggestion && <AISuggestionCard suggestion={suggestion} />}
            <ProviderList providers={providers} navigate={navigate} />
            {!isLoading && providers.length === 0 && <EmptyState navigate={navigate} />}
          </>
        )}
      </div>
    </MobileLayout>
  );
};

const DesktopSearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { suggestion, providers, isLoading } = useSearchLogic(query);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`Search: ${query} | Subhakary`} description={`AI-powered search results for "${query}"`} />
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-16">
        {/* Search bar at top */}
        <div className="mb-8">
          <AISearch initialQuery={query} />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {suggestion && <AISuggestionCard suggestion={suggestion} />}
            <ProviderList providers={providers} navigate={navigate} />
            {!isLoading && providers.length === 0 && <EmptyState navigate={navigate} />}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// Shared search logic hook
function useSearchLogic(query: string) {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState("");
  const [providers, setProviders] = useState<SearchProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const runSearch = async () => {
      setIsLoading(true);
      setSuggestion("");
      setProviders([]);

      try {
        if (user) {
          const result = await fetchAIRecommendations(query);
          setSuggestion(result.summary);
          setProviders(result.results);
        } else {
          const params = extractSearchParams(query);
          const fetched = await fetchProviders(params);
          setProviders(fetched);
          if (fetched.length > 0 && params.location) {
            // Check if results are from the searched location or a fallback
            const hasLocalResults = fetched.some(
              (p) => p.city && p.city.toLowerCase().includes(params.location!.toLowerCase())
            );
            if (!hasLocalResults) {
              setSuggestion(
                `No providers found in ${params.location}. Showing top providers from other cities.`
              );
            } else {
              setSuggestion(`Found ${fetched.length} providers matching "${query}".`);
            }
          } else if (fetched.length > 0) {
            setSuggestion(`Found ${fetched.length} providers matching "${query}".`);
          } else {
            setSuggestion("No providers found. Try browsing our service categories.");
          }
        }
      } catch {
        try {
          const params = extractSearchParams(query);
          const fetched = await fetchProviders(params);
          setProviders(fetched);
          setSuggestion("Here are providers matching your search.");
        } catch {
          setSuggestion("Unable to search right now. Please browse our categories.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    runSearch();
  }, [query, user]);

  return { suggestion, providers, isLoading };
}

// Shared UI components
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">Finding the best providers for you...</p>
  </div>
);

const AISuggestionCard = ({ suggestion }: { suggestion: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 bg-primary/5 border border-primary/20 rounded-xl"
  >
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-primary mb-1">AI Recommendation</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{suggestion}</p>
      </div>
    </div>
  </motion.div>
);

const ProviderList = ({ providers, navigate }: { providers: SearchProvider[]; navigate: (path: string) => void }) => {
  if (providers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="space-y-3"
    >
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" />
        Top Providers ({providers.length})
      </h2>
      <div className="grid gap-3">
        {providers.map((provider, i) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/providers/${provider.id}`)}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {provider.business_name}
                </p>
                {provider.is_premium && (
                  <Badge variant="secondary" className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0 gap-0.5 flex-shrink-0">
                    <Crown className="h-2.5 w-2.5" />
                    Premium
                  </Badge>
                )}
                {provider.is_verified && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {provider.service_type && (
                  <span className="capitalize">{provider.service_type}</span>
                )}
                {provider.city && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {provider.city}
                  </span>
                )}
                {provider.rating != null && provider.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {provider.rating.toFixed(1)}
                    {provider.total_reviews ? ` (${provider.total_reviews})` : ""}
                  </span>
                )}
                {provider.base_price != null && (
                  <span className="font-medium text-foreground">₹{provider.base_price.toLocaleString()}</span>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-3" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const EmptyState = ({ navigate }: { navigate: (path: string) => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-12"
  >
    <p className="text-muted-foreground mb-4">No providers found matching your search.</p>
    <Button variant="outline" onClick={() => navigate("/providers")}>
      Browse All Providers
      <ArrowRight className="h-4 w-4 ml-2" />
    </Button>
  </motion.div>
);

export default SearchResults;
