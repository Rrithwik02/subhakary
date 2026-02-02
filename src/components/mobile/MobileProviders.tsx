import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Filter, X, BadgeCheck, Heart } from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { indianStates, getCitiesByState } from "@/data/indianLocations";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";

export const MobileProviders = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  
  const serviceParam = searchParams.get("service");
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Set initial category from URL param when categories are loaded
  useEffect(() => {
    if (serviceParam && categories.length > 0 && selectedCategory === "all") {
      const matchedCategory = categories.find(
        (cat) => cat.slug?.toLowerCase() === serviceParam.toLowerCase() ||
                 cat.name.toLowerCase().includes(serviceParam.toLowerCase())
      );
      if (matchedCategory) {
        setSelectedCategory(matchedCategory.id);
      }
    }
  }, [serviceParam, categories, selectedCategory]);

  // Fetch providers using public_service_providers view for anonymous access
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["approved-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_service_providers")
        .select(`*, category:service_categories(name, icon, slug)`)
        .eq("status", "approved")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get cities based on selected state
  const stateCities = useMemo(() => {
    if (selectedState === "all") return [];
    return getCitiesByState(selectedState);
  }, [selectedState]);

  // Filter and sort providers
  const filteredProviders = useMemo(() => {
    let result = [...providers];

    // Text search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.business_name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query) ||
          p.category?.name?.toLowerCase().includes(query) ||
          p.category?.slug?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // State filter
    if (selectedState !== "all") {
      const citiesInState = getCitiesByState(selectedState).map((c) => c.toLowerCase());
      result = result.filter((p) =>
        citiesInState.includes(p.city?.toLowerCase() || "") ||
        p.service_cities?.some((c: string) => citiesInState.includes(c.toLowerCase()))
      );
    }

    // City filter
    if (selectedCity !== "all") {
      result = result.filter((p) =>
        p.city?.toLowerCase().includes(selectedCity.toLowerCase()) ||
        p.service_cities?.some((c: string) => c.toLowerCase().includes(selectedCity.toLowerCase()))
      );
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => {
          if (a.is_premium !== b.is_premium) return b.is_premium ? 1 : -1;
          return (b.rating || 0) - (a.rating || 0);
        });
        break;
      case "price_low":
        result.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
        break;
      case "price_high":
        result.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
        break;
    }

    return result;
  }, [providers, searchQuery, selectedCategory, selectedState, selectedCity, sortBy]);

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedCity("all");
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedState !== "all" || selectedCity !== "all";
  const activeFilterCount = [
    selectedCategory !== "all",
    selectedState !== "all",
    selectedCity !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedState("all");
    setSelectedCity("all");
    setFiltersOpen(false);
  };

  const isFavorite = (providerId: string) => favorites.some((f) => f.provider_id === providerId);

  return (
    <MobileLayout hideHeader>
      <div className="pt-2 pb-4">
        {/* Search Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Pandits, Decorators, Catering..."
                className="pl-10 h-11 rounded-xl bg-muted/50"
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex-shrink-0 rounded-full gap-1.5 ${hasActiveFilters ? 'bg-primary text-primary-foreground border-primary' : ''}`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="h-5 w-5 p-0 text-[10px] flex items-center justify-center">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
                <SheetHeader className="mb-4">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">State</label>
                    <Select value={selectedState} onValueChange={handleStateChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">All States</SelectItem>
                        {indianStates.map((state) => (
                          <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* City */}
                  {selectedState !== "all" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">City</label>
                      <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Cities" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all">All Cities</SelectItem>
                          {stateCities.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Sort */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Top Rated</SelectItem>
                        <SelectItem value="price_low">Price: Low to High</SelectItem>
                        <SelectItem value="price_high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>
                      Clear All
                    </Button>
                    <Button className="flex-1 bg-primary" onClick={() => setFiltersOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Quick filter chips */}
            <Button
              variant={sortBy === "rating" ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0 rounded-full gap-1"
              onClick={() => setSortBy("rating")}
            >
              <Star className="h-3 w-3" />
              Rating
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 rounded-full gap-1"
              onClick={() => setSortBy("price_low")}
            >
              Pricing
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Top Rated Specialists
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredProviders.length} found
            </span>
          </div>

          {/* Provider Cards */}
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No providers found</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <AnimatePresence>
                {filteredProviders.map((provider, index) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/provider/${provider.id}`)}
                    className="bg-card rounded-2xl overflow-hidden border border-border/50 touch-active"
                  >
                    {/* Image */}
                    <div className="relative h-36">
                      {provider.portfolio_images?.[0] ? (
                        <img
                          src={provider.portfolio_images[0]}
                          alt={provider.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-4xl">{provider.category?.icon || "🙏"}</span>
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {provider.is_verified && (
                          <Badge className="bg-green-500/90 text-white text-[10px] gap-1">
                            <BadgeCheck className="h-3 w-3" />
                            VERIFIED
                          </Badge>
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user) {
                            toggleFavorite.mutate(provider.id);
                          } else {
                            navigate("/auth");
                          }
                        }}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center touch-active"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isFavorite(provider.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          }`}
                        />
                      </button>

                      {/* Rating Badge */}
                      <div className="absolute bottom-3 right-3">
                        <Badge variant="secondary" className="bg-white/95 text-foreground gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          {provider.rating?.toFixed(1) || "New"}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
                        {provider.business_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{provider.city || "India"}</span>
                        <span>•</span>
                        <span>{provider.category?.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">Starting from</span>
                          <p className="text-lg font-bold text-foreground">
                            ₹{provider.base_price?.toLocaleString("en-IN") || "N/A"}
                            <span className="text-xs font-normal text-muted-foreground"> / session</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
