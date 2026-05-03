import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Star,
  MapPin,
  ArrowRight,
  Crown,
  Loader2,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="space-y-4 px-4 pb-20 pt-2">
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
      <div className="container mx-auto px-4 pb-16 pt-28">
        <div className="mb-8">
          <AISearch initialQuery={query} />
        </div>

        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="mx-auto max-w-5xl space-y-6">
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
            const hasLocalResults = fetched.some(
              (provider) => provider.city && provider.city.toLowerCase().includes(params.location!.toLowerCase()),
            );
            if (!hasLocalResults) {
              setSuggestion(`No providers found in ${params.location}. Showing the strongest nearby matches instead.`);
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

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-16">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">Finding the best providers for you...</p>
  </div>
);

const AISuggestionCard = ({ suggestion }: { suggestion: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-background p-4 md:p-5"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-primary">AI Recommendation</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{suggestion}</p>
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
      className="space-y-4"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Star className="h-5 w-5 text-primary" />
        Best matches ({providers.length})
      </h2>

      <div className="grid gap-4">
        {providers.map((provider, index) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(`/provider/${provider.url_slug || provider.id}`)}
            className="cursor-pointer"
          >
            <Card className="overflow-hidden border-border/50 transition-all hover:border-primary/25 hover:shadow-lg">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {provider.service_type ? (
                        <Badge variant="secondary" className="capitalize">
                          {provider.service_type}
                        </Badge>
                      ) : null}
                      {provider.is_premium ? (
                        <Badge variant="outline" className="gap-1">
                          <Crown className="h-3 w-3 text-amber-500" />
                          Premium
                        </Badge>
                      ) : null}
                      {provider.is_verified ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Verified
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-foreground">{provider.business_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {provider.city ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {provider.city}
                            </span>
                          ) : null}
                          {provider.rating != null && provider.rating > 0 ? (
                            <span className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                              {provider.rating.toFixed(1)}
                              {provider.total_reviews ? ` (${provider.total_reviews})` : ""}
                            </span>
                          ) : (
                            <span>New listing</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Starting from</p>
                        <p className="mt-1 text-lg font-semibold text-primary">
                          {provider.base_price != null ? `Rs ${provider.base_price.toLocaleString("en-IN")}` : "Contact for price"}
                        </p>
                      </div>
                    </div>

                    {provider.recommendation_reason ? (
                      <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm">
                        <div className="mb-1 flex items-center gap-1.5 text-primary">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          <span className="font-medium">Why this vendor</span>
                        </div>
                        <p className="text-muted-foreground">{provider.recommendation_reason}</p>
                      </div>
                    ) : null}
                  </div>

                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
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
    className="py-12 text-center"
  >
    <p className="mb-4 text-muted-foreground">No providers found matching your search.</p>
    <Button variant="outline" onClick={() => navigate("/providers")}>
      Browse All Providers
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </motion.div>
);

export default SearchResults;
