import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, Star, Filter, X, BadgeCheck, Images } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

// Popular cities and areas for the dropdown
const POPULAR_LOCATIONS = {
  "Hyderabad": ["Madhapur", "Gachibowli", "Hitech City", "Kondapur", "Kukatpally", "Ameerpet", "Dilsukhnagar", "LB Nagar", "ECIL", "Uppal", "Miyapur", "Secunderabad"],
  "Bangalore": ["Koramangala", "Whitefield", "Electronic City", "Indiranagar", "HSR Layout", "BTM Layout", "Marathahalli"],
  "Chennai": ["T Nagar", "Anna Nagar", "Velachery", "Adyar", "Nungambakkam"],
  "Vijayawada": ["Benz Circle", "Labbipet", "Governorpet", "Patamata"],
  "Visakhapatnam": ["Madhurawada", "Gajuwaka", "MVP Colony", "Dwaraka Nagar"],
};

const Providers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState<boolean>(false);

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

  // Get unique cities from providers + popular cities
  const cities = useMemo(() => {
    const providerCities = providers.map((p) => p.city).filter(Boolean);
    const allCities = new Set([...Object.keys(POPULAR_LOCATIONS), ...providerCities]);
    return Array.from(allCities).sort();
  }, [providers]);

  // Get areas for selected city
  const areas = useMemo(() => {
    if (selectedCity === "all") return [];
    return POPULAR_LOCATIONS[selectedCity as keyof typeof POPULAR_LOCATIONS] || [];
  }, [selectedCity]);

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

    // Verified filter
    if (showVerifiedOnly) {
      result = result.filter((p) => p.is_verified === true);
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
  }, [providers, searchQuery, selectedCategory, selectedCity, selectedArea, sortBy, showVerifiedOnly]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedCity("all");
    setSelectedArea("all");
    setSortBy("rating");
    setShowVerifiedOnly(false);
  };

  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setSelectedArea("all"); // Reset area when city changes
  };

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || selectedCity !== "all" || selectedArea !== "all" || showVerifiedOnly;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 bg-gradient-to-b from-muted to-background">
        <div className="container max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Find Trusted <span className="text-gradient-gold">Service Providers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Browse verified providers for all your traditional and cultural service needs
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 border-b border-border sticky top-20 bg-background/95 backdrop-blur-sm z-40">
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

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
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

            {/* City Filter */}
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-full lg:w-44">
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
                <SelectTrigger className="w-full lg:w-44">
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
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {/* Verified Only Filter */}
            <div 
              className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                showVerifiedOnly 
                  ? 'bg-green-500/10 border-green-500/30 text-green-600' 
                  : 'border-border hover:bg-muted'
              }`}
              onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
            >
              <Checkbox 
                checked={showVerifiedOnly} 
                onCheckedChange={(checked) => setShowVerifiedOnly(checked as boolean)}
                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              />
              <BadgeCheck className="h-4 w-4" />
              <span className="text-sm font-medium whitespace-nowrap">Verified Only</span>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              {filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-muted mb-4" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-16">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No providers found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search terms
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/provider/${provider.id}`}>
                    <Card className="hover-lift cursor-pointer h-full bg-card border-border/50 overflow-hidden group">
                      <CardContent className="p-6">
                        {/* Header with Avatar, Name and Verification Badge */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
                            {provider.logo_url ? (
                              <img 
                                src={provider.logo_url} 
                                alt={provider.business_name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-3xl">👤</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-display text-lg font-semibold line-clamp-1 text-foreground">
                                {provider.business_name}
                              </h3>
                              {provider.is_verified ? (
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-md whitespace-nowrap border border-green-500/30">
                                  ✓ Verified
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-600 text-xs font-medium rounded-md whitespace-nowrap border border-yellow-500/30">
                                  Pending
                                </span>
                              )}
                            </div>
                            {provider.category?.name && (
                              <Badge className="mt-1 bg-primary/20 text-primary hover:bg-primary/30 border-0">
                                {provider.category.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {provider.description || "Professional service provider offering quality services."}
                        </p>

                        {/* Portfolio Preview - Shows on hover if portfolio images exist */}
                        {provider.portfolio_images && provider.portfolio_images.length > 0 && (
                          <div className="mb-4 overflow-hidden rounded-lg">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                                  <Images className="h-4 w-4" />
                                  <span>{provider.portfolio_images.length} Portfolio Images</span>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80 p-2" side="top">
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
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b border-border/50">
                          {provider.city && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-primary" />
                              {provider.city}, India
                            </span>
                          )}
                          {provider.experience_years ? (
                            <span className="font-medium">{provider.experience_years}+ yrs experience</span>
                          ) : null}
                        </div>

                        {/* Rating and Price */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="font-semibold text-primary">
                              {provider.rating?.toFixed(1) || "New"}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              ({provider.total_reviews || 0} reviews)
                            </span>
                          </div>
                          {(provider.base_price || provider.pricing_info) && (
                            <span className="text-sm font-semibold text-primary">
                              {provider.base_price 
                                ? `₹ ${provider.base_price.toLocaleString()}` 
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
