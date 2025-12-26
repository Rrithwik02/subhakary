import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Star, Filter, X, BadgeCheck, Images, ChevronLeft, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

// Areas for cities (used when a city is selected)
const CITY_AREAS: Record<string, string[]> = {
  "Hyderabad": ["Madhapur", "Gachibowli", "Hitech City", "Kondapur", "Kukatpally", "Ameerpet", "Dilsukhnagar", "LB Nagar", "ECIL", "Uppal", "Miyapur", "Secunderabad"],
  "Bangalore": ["Koramangala", "Whitefield", "Electronic City", "Indiranagar", "HSR Layout", "BTM Layout", "Marathahalli"],
  "Chennai": ["T Nagar", "Anna Nagar", "Velachery", "Adyar", "Nungambakkam"],
  "Vijayawada": ["Benz Circle", "Labbipet", "Governorpet", "Patamata"],
  "Visakhapatnam": ["Madhurawada", "Gajuwaka", "MVP Colony", "Dwaraka Nagar"],
};

const Providers = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    const cityParam = searchParams.get("city");
    
    if (serviceParam) {
      // Map service name to category - will be matched in filteredProviders
      setSearchQuery(serviceParam);
    }
    if (cityParam) {
      setSelectedCity(cityParam);
    }
  }, [searchParams]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch approved providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["approved-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          *,
          category:service_categories(name, icon)
        `)
        .eq("status", "approved")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Get unique cities from providers only (cities with at least one provider)
  const cities = useMemo(() => {
    const providerCities = providers.map((p) => p.city).filter(Boolean);
    return Array.from(new Set(providerCities)).sort();
  }, [providers]);

  // Get areas for selected city
  const areas = useMemo(() => {
    if (selectedCity === "all") return [];
    return CITY_AREAS[selectedCity as keyof typeof CITY_AREAS] || [];
  }, [selectedCity]);

  // Get unique subcategories from providers
  const subcategories = useMemo(() => {
    const subs = providers
      .filter((p) => selectedCategory === "all" || p.category_id === selectedCategory)
      .map((p) => p.subcategory)
      .filter(Boolean);
    return Array.from(new Set(subs)).sort();
  }, [providers, selectedCategory]);

  // Filter and sort providers
  const filteredProviders = useMemo(() => {
    let result = [...providers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.business_name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory !== "all") {
      result = result.filter((p) => p.subcategory === selectedSubcategory);
    }

    // City filter
    if (selectedCity !== "all") {
      result = result.filter((p) => 
        p.city?.toLowerCase().includes(selectedCity.toLowerCase()) ||
        p.service_cities?.some((c: string) => c.toLowerCase().includes(selectedCity.toLowerCase()))
      );
    }

    // Area filter (search in city or address)
    if (selectedArea !== "all") {
      result = result.filter((p) =>
        p.city?.toLowerCase().includes(selectedArea.toLowerCase()) ||
        p.address?.toLowerCase().includes(selectedArea.toLowerCase()) ||
        p.service_cities?.some((c: string) => c.toLowerCase().includes(selectedArea.toLowerCase()))
      );
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "reviews":
        result.sort((a, b) => (b.total_reviews || 0) - (a.total_reviews || 0));
        break;
      case "experience":
        result.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
        break;
      case "name":
        result.sort((a, b) => a.business_name.localeCompare(b.business_name));
        break;
    }

    return result;
  }, [providers, searchQuery, selectedCategory, selectedSubcategory, selectedCity, selectedArea, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSelectedCity("all");
    setSelectedArea("all");
    setSortBy("rating");
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory("all"); // Reset subcategory when category changes
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setSelectedArea("all"); // Reset area when city changes
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || selectedSubcategory !== "all" || selectedCity !== "all" || selectedArea !== "all";

  const activeFilterCount = [
    searchQuery,
    selectedCategory !== "all" ? selectedCategory : null,
    selectedSubcategory !== "all" ? selectedSubcategory : null,
    selectedCity !== "all" ? selectedCity : null,
    selectedArea !== "all" ? selectedArea : null,
  ].filter(Boolean).length;

  // Filter component for reuse in both mobile and desktop
  const FilterControls = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex flex-col gap-3 ${isMobile ? '' : 'lg:flex-row lg:items-center'}`}>
      {/* Category Filter */}
      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className={isMobile ? "w-full" : "w-full lg:w-48"}>
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Subcategory Filter */}
      {subcategories.length > 0 && (
        <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
          <SelectTrigger className={isMobile ? "w-full" : "w-full lg:w-44"}>
            <SelectValue placeholder="All Services" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {subcategories.map((sub) => (
              <SelectItem key={sub} value={sub!}>
                {sub}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* City Filter */}
      <Select value={selectedCity} onValueChange={handleCityChange}>
        <SelectTrigger className={isMobile ? "w-full" : "w-full lg:w-44"}>
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="All Cities" />
        </SelectTrigger>
        <SelectContent className="bg-background border z-50">
          <SelectItem value="all">All Cities</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city} value={city!}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Area Filter - only show when city is selected */}
      {selectedCity !== "all" && areas.length > 0 && (
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className={isMobile ? "w-full" : "w-full lg:w-44"}>
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            <SelectItem value="all">All Areas in {selectedCity}</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort */}
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className={isMobile ? "w-full" : "w-full lg:w-40"}>
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rating">Top Rated</SelectItem>
          <SelectItem value="reviews">Most Reviews</SelectItem>
          <SelectItem value="experience">Experience</SelectItem>
          <SelectItem value="name">Name (A-Z)</SelectItem>
        </SelectContent>
      </Select>

      {isMobile && hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full text-destructive border-destructive/30">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section - Compact on mobile */}
      <section className="pt-24 md:pt-32 pb-6 md:pb-12 px-4 bg-gradient-to-b from-muted to-background">
        <div className="container max-w-6xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 md:mb-4 text-center"
          >
            Find Trusted <span className="text-gradient-gold">Service Providers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-center text-sm md:text-base"
          >
            Browse verified providers for all your traditional and cultural service needs
          </motion.p>
        </div>
      </section>

      {/* Mobile Search & Filter Bar */}
      <section className="lg:hidden sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          
          {/* Filter Button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 relative flex-shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full py-4">
                <FilterControls isMobile />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Pills - Horizontal Scroll */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => setSearchQuery("")}>
                {searchQuery}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => { setSelectedCategory("all"); setSelectedSubcategory("all"); }}>
                {categories.find(c => c.id === selectedCategory)?.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            {selectedCity !== "all" && (
              <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer whitespace-nowrap flex-shrink-0" onClick={() => { setSelectedCity("all"); setSelectedArea("all"); }}>
                {selectedCity}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive text-xs whitespace-nowrap flex-shrink-0 h-6 px-2">
              Clear
            </Button>
          </div>
        )}
      </section>

      {/* Desktop Filters */}
      <section className="hidden lg:block py-6 px-4 border-b border-border sticky top-20 bg-background/95 backdrop-blur-sm z-40">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search providers, services, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <FilterControls />
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20" onClick={() => setSearchQuery("")}>
                  Search: {searchQuery}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20" onClick={() => { setSelectedCategory("all"); setSelectedSubcategory("all"); }}>
                  {categories.find(c => c.id === selectedCategory)?.name || "Category"}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              
              {selectedSubcategory !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20" onClick={() => setSelectedSubcategory("all")}>
                  Service: {selectedSubcategory}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              
              {selectedCity !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20" onClick={() => { setSelectedCity("all"); setSelectedArea("all"); }}>
                  City: {selectedCity}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              
              {selectedArea !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20" onClick={() => setSelectedArea("all")}>
                  Area: {selectedArea}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-6 md:py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-center md:justify-between mb-4 md:mb-6">
            <p className="text-muted-foreground text-sm md:text-base">
              {filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 md:p-6">
                    <div className="h-12 w-12 rounded-full bg-muted mb-4" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <Filter className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-lg md:text-xl font-semibold mb-2">No providers found</h3>
              <p className="text-muted-foreground mb-4 text-sm md:text-base">
                Try adjusting your filters or search terms
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProviders.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/provider/${provider.id}`}>
                    <Card className="hover-lift cursor-pointer h-full bg-card border-border/50 overflow-hidden group">
                      <CardContent className="p-4 md:p-6">
                        {/* Header with Avatar, Name and Verification Badge */}
                        <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                          <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                            {provider.logo_url ? (
                              <img 
                                src={provider.logo_url} 
                                alt={provider.business_name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl md:text-3xl">👤</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-display text-base md:text-lg font-semibold line-clamp-1 text-foreground">
                                  {provider.business_name}
                                </h3>
                                {provider.is_verified ? (
                                  <span className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 bg-green-500/20 text-green-500 text-[10px] md:text-xs font-medium rounded-md whitespace-nowrap border border-green-500/30 flex-shrink-0">
                                    ✓ Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 bg-yellow-500/20 text-yellow-600 text-[10px] md:text-xs font-medium rounded-md whitespace-nowrap border border-yellow-500/30 flex-shrink-0">
                                    Unverified
                                  </span>
                                )}
                              </div>
                              {provider.is_premium && (
                                <span className="self-start flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[10px] md:text-xs font-bold rounded-md whitespace-nowrap shadow-sm">
                                  ⭐ Premium
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {provider.category?.name && (
                                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0 text-[10px] md:text-xs px-1.5 md:px-2">
                                  {provider.category.name}
                                </Badge>
                              )}
                              {provider.subcategory && (
                                <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2">
                                  {provider.subcategory}
                                </Badge>
                              )}
                            </div>
                            {provider.specializations && provider.specializations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {provider.specializations.slice(0, 2).map((spec: string, idx: number) => (
                                  <span key={idx} className="text-[10px] md:text-xs text-muted-foreground bg-muted px-1 md:px-1.5 py-0.5 rounded">
                                    {spec}
                                  </span>
                                ))}
                                {provider.specializations.length > 2 && (
                                  <span className="text-[10px] md:text-xs text-muted-foreground">
                                    +{provider.specializations.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 md:line-clamp-3">
                          {provider.description || "Professional service provider offering quality services."}
                        </p>

                        {/* Portfolio Preview - Shows on hover if portfolio images exist */}
                        {provider.portfolio_images && provider.portfolio_images.length > 0 && (
                          <div className="mb-3 md:mb-4 overflow-hidden rounded-lg">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="flex items-center gap-2 text-xs md:text-sm text-primary cursor-pointer hover:underline">
                                  <Images className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  <span>{provider.portfolio_images.length} Portfolio Images</span>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 md:w-80 p-2" side="top">
                                <div className="grid grid-cols-3 gap-1">
                                  {provider.portfolio_images.slice(0, 6).map((img: string, idx: number) => (
                                    <div key={idx} className="aspect-square rounded overflow-hidden bg-muted">
                                      <img 
                                        src={img} 
                                        alt={`Portfolio ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = '/placeholder.svg';
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                {provider.portfolio_images.length > 6 && (
                                  <p className="text-xs text-muted-foreground text-center mt-2">
                                    +{provider.portfolio_images.length - 6} more images
                                  </p>
                                )}
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        )}

                        {/* Location and Experience */}
                        <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 pb-3 md:pb-4 border-b border-border/50">
                          {provider.city && (
                            <span className="flex items-center gap-1 md:gap-1.5">
                              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                              <span className="truncate max-w-[100px] md:max-w-none">{provider.city}</span>
                            </span>
                          )}
                          {provider.experience_years ? (
                            <span className="font-medium">{provider.experience_years}+ yrs exp</span>
                          ) : null}
                        </div>

                        {/* Rating and Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 md:gap-1.5">
                            <Star className="h-3.5 w-3.5 md:h-4 md:w-4 fill-primary text-primary" />
                            <span className="font-semibold text-primary text-sm md:text-base">
                              {provider.rating?.toFixed(1) || "New"}
                            </span>
                            <span className="text-muted-foreground text-[10px] md:text-sm">
                              ({provider.total_reviews || 0})
                            </span>
                          </div>
                          {(provider.base_price || provider.pricing_info) && (
                            <span className="text-xs md:text-sm font-semibold text-primary">
                              {provider.base_price 
                                ? `₹${provider.base_price.toLocaleString()}` 
                                : provider.pricing_info}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Providers;
