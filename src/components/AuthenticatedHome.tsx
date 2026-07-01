import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Calendar, MapPin, Star, BadgeCheck, Sparkles, ChevronDown, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AISearch } from "@/components/AISearch";

export const AuthenticatedHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [locationInput, setLocationInput] = useState("");

  // Fetch user profile for display name
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-home", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch categories for search dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch approved featured providers
  const { data: featuredProviders = [], isLoading: providersLoading } = useQuery({
    queryKey: ["featured-providers-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_service_providers")
        .select(`
          id,
          business_name,
          city,
          rating,
          total_reviews,
          is_verified,
          is_premium,
          logo_url,
          url_slug,
          service_type
        `)
        .eq("status", "approved")
        .order("rating", { ascending: false })
        .limit(6);
      
      if (error) throw error;
      return data || [];
    },
  });

  const categoriesList = categories || [];
  const providersList = featuredProviders || [];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedService) params.set("category", selectedService);
    if (locationInput) params.set("city", locationInput);
    if (selectedDate) params.set("date", selectedDate);
    navigate(`/providers${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const displayName = userProfile?.full_name || "Ceremony Planner";

  return (
    <main className="min-h-screen bg-cream">
      <Navbar />

      {/* Main Search & Welcome Banner */}
      <section className="relative pt-36 pb-20 bg-gradient-to-b from-brown/95 via-brown/90 to-background overflow-hidden text-cream">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-60 z-0 pointer-events-none" />
        
        <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-semibold mb-4 tracking-wide uppercase border border-gold/20">
              Ceremony Dashboard
            </span>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-cream mb-4">
              Welcome back, <span className="text-gold">{displayName}</span>!
            </h1>
            <p className="text-lg text-cream/70 max-w-xl mx-auto mb-10">
              Find and book verified professionals for your special events and traditional ceremonies.
            </p>
          </motion.div>

          {/* Pill Search Bar (Horizontal on Desktop, Vertical on Mobile) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-4xl mx-auto mb-8"
          >
            {/* Mobile Layout */}
            <div className="lg:hidden flex flex-col gap-3 bg-background/5 p-4 rounded-2xl border border-cream/20 backdrop-blur-md">
              <div className="flex items-center gap-3 px-4 py-3 border border-cream/20 rounded-xl bg-background/20">
                <Search className="w-4 h-4 text-gold flex-shrink-0" />
                <select 
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-cream cursor-pointer text-sm font-medium appearance-none"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="text-foreground">Choose a Service</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.slug} className="text-foreground">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 border border-cream/20 rounded-xl bg-background/20">
                <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 bg-transparent border-none outline-none text-cream text-sm font-medium [color-scheme:dark] cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 px-4 py-3 border border-cream/20 rounded-xl bg-background/20">
                <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Location of the Event" 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-cream placeholder:text-cream/50 text-sm font-medium"
                />
              </div>

              <Button
                variant="gold"
                className="w-full h-12 rounded-xl gap-2 mt-2 font-semibold text-brown cursor-pointer"
                onClick={handleSearch}
              >
                <Search className="w-5 h-5" />
                <span>Search Providers</span>
              </Button>
            </div>

            {/* Desktop Layout (Horizontal Pill Bar) */}
            <div className="hidden lg:flex items-center max-w-4xl mx-auto rounded-full border border-cream/30 bg-background/10 backdrop-blur-md p-1.5 shadow-xl">
              {/* Choose Service */}
              <div className="flex-1 flex items-center justify-between gap-2 px-5 py-2.5 hover:bg-white/5 rounded-full transition-colors cursor-pointer relative">
                <select 
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-cream/90 cursor-pointer text-sm font-medium appearance-none focus:ring-0 focus:outline-none"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="text-foreground bg-background">Choose a Service</option>
                  {categoriesList.map((cat) => (
                    <option key={cat.id} value={cat.slug} className="text-foreground bg-background">{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-cream/70 flex-shrink-0 pointer-events-none" />
              </div>

              <div className="w-px h-8 bg-cream/25" />

              {/* Event Date */}
              <div className="flex-1 flex items-center gap-2 px-5 py-2.5 hover:bg-white/5 rounded-full transition-colors">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 bg-transparent border-none outline-none text-cream/90 text-sm font-medium [color-scheme:dark] cursor-pointer"
                />
              </div>

              <div className="w-px h-8 bg-cream/25" />

              {/* Location */}
              <div className="flex-1 flex items-center justify-between gap-2 px-5 py-2.5 hover:bg-white/5 rounded-full transition-colors">
                <input 
                  type="text" 
                  placeholder="Location of the Event" 
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-cream/95 placeholder:text-cream/50 text-sm font-medium"
                />
                <MapPin className="w-4 h-4 text-cream/75 flex-shrink-0" />
              </div>

              {/* Search Button */}
              <Button
                variant="gold"
                size="icon"
                className="w-12 h-12 rounded-full flex-shrink-0 ml-2 cursor-pointer shadow-lg hover:scale-105 transition-transform"
                onClick={handleSearch}
              >
                <Search className="w-5 h-5 text-brown" />
              </Button>
            </div>
          </motion.div>

          {/* AI Search Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-cream/20" />
              <span className="text-cream/40 text-xs font-semibold uppercase tracking-wider">or search with AI</span>
              <div className="flex-1 h-px bg-cream/20" />
            </div>
            <div className="bg-background rounded-2xl p-2 shadow-xl border border-cream/10">
              <AISearch />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Service Providers Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-brown mb-3">
              Top Rated Professionals
            </h2>
            <p className="text-muted-foreground">
              Highly rated, vetted, and trusted service providers currently available on Subhakary.
            </p>
          </div>

          {providersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border border-border">
                  <CardContent className="p-6">
                    <Skeleton className="h-40 w-full rounded-xl mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : providersList.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {providersList.map((provider, index) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="h-full border border-border/80 hover:border-gold/30 hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group bg-card">
                      <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                          {/* Card Top */}
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-1 rounded-md border border-gold/10">
                              {provider.service_type || "Vendor"}
                            </span>
                            {provider.is_verified && (
                              <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 py-0.5">
                                <BadgeCheck className="w-3.5 h-3.5" />
                                Verified
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-display text-xl font-bold text-brown group-hover:text-gold transition-colors duration-200 mb-2">
                            {provider.business_name}
                          </h3>

                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" />
                            {provider.city}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-semibold text-foreground">
                                {provider.rating ? provider.rating.toFixed(1) : "New"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({provider.total_reviews || 0} reviews)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-semibold text-brown group-hover:text-gold cursor-pointer gap-1"
                              onClick={() => navigate(`/provider/${provider.url_slug || provider.id}`)}
                            >
                              <span>View Profile</span>
                              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => navigate("/providers")}
                  className="bg-brown hover:bg-brown/90 text-cream px-8 py-6 rounded-full text-base font-semibold shadow-md cursor-pointer transition-transform hover:-translate-y-0.5"
                >
                  Browse All Providers
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center p-12 bg-card rounded-2xl border border-border">
              <p className="text-muted-foreground font-medium mb-4">
                No verified service providers found in our catalog yet.
              </p>
              <Button onClick={() => navigate("/become-provider")} variant="outline" className="border-brown/25">
                Join as a Service Provider
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
};
