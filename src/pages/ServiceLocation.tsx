import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead, generateServiceSchema, generateLocalBusinessSchema, generateBreadcrumbSchema } from "@/components/SEOHead";
import { getServiceFromSlug, getCityFromSlug, topCitiesSEO, createCitySlug } from "@/data/seoData";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, CheckCircle2, ArrowRight, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const ServiceLocation = () => {
  const { service, city } = useParams();
  const navigate = useNavigate();
  
  const serviceData = getServiceFromSlug(service || "");
  const cityName = getCityFromSlug(city || "");
  const cityData = topCitiesSEO.find(c => createCitySlug(c.name) === city);
  const stateName = cityData?.state || "";

  // Fetch providers for this service and city
  const { data: providers, isLoading } = useQuery({
    queryKey: ["providers", serviceData?.filter, cityName],
    queryFn: async () => {
      if (!serviceData) return [];
      
      let query = supabase
        .from("service_providers")
        .select("*")
        .eq("status", "approved")
        .eq("service_type", serviceData.filter);
      
      // Filter by city - check primary city and service_cities array
      const { data } = await query;
      
      if (!data) return [];
      
      return data.filter(provider => 
        provider.city?.toLowerCase() === cityName.toLowerCase() ||
        provider.service_cities?.some((c: string) => c.toLowerCase() === cityName.toLowerCase())
      ).slice(0, 12);
    },
    enabled: !!serviceData
  });

  if (!serviceData) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <Link to="/services" className="text-primary hover:underline">
            Browse all services
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const pageTitle = `${serviceData.pluralName} in ${cityName} | Book ${serviceData.name} Near You - Subhakary`;
  const pageDescription = `Find and book trusted ${serviceData.pluralName.toLowerCase()} in ${cityName}, ${stateName}. ${serviceData.description}. Compare prices, read reviews, and book online.`;
  const pageKeywords = serviceData.keywords.map(k => `${k} in ${cityName}, ${k} near me`).join(", ") + `, ${cityName} ${serviceData.name.toLowerCase()}, best ${serviceData.name.toLowerCase()} ${cityName}`;
  const canonicalUrl = `https://subhakary.com/services/${service}/${city}`;

  const breadcrumbs = [
    { name: "Home", url: "https://subhakary.com/" },
    { name: "Services", url: "https://subhakary.com/services" },
    { name: serviceData.pluralName, url: `https://subhakary.com/services/${service}` },
    { name: cityName, url: canonicalUrl }
  ];

  // Get nearby cities for internal linking
  const nearbyCities = topCitiesSEO
    .filter(c => c.state === stateName && c.name !== cityName)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-background">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={pageKeywords}
        canonicalUrl={canonicalUrl}
        jsonLd={[
          generateServiceSchema(serviceData.pluralName, serviceData.description, cityName, stateName),
          generateLocalBusinessSchema(serviceData.pluralName, cityName, stateName),
          generateBreadcrumbSchema(breadcrumbs)
        ]}
      />
      
      <Navbar />
      
      {/* Breadcrumb Navigation */}
      <nav className="container mx-auto px-4 py-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-primary">Home</Link></li>
          <ChevronRight className="w-4 h-4" />
          <li><Link to="/services" className="hover:text-primary">Services</Link></li>
          <ChevronRight className="w-4 h-4" />
          <li><Link to={`/services/${service}`} className="hover:text-primary">{serviceData.pluralName}</Link></li>
          <ChevronRight className="w-4 h-4" />
          <li className="text-foreground font-medium">{cityName}</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <Badge variant="secondary" className="mb-4">
              <MapPin className="w-3 h-3 mr-1" />
              {cityName}, {stateName}
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Best {serviceData.pluralName} in {cityName}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {serviceData.description}. Compare verified professionals, read reviews, and book instantly for your events in {cityName}.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate(`/providers?service=${serviceData.filter}&city=${cityName}`)}
              >
                View All {serviceData.pluralName}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/contact")}>
                Get Free Quotes
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Providers Grid */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-display font-bold mb-8">
          Top {serviceData.pluralName} in {cityName}
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-40 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : providers && providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{provider.business_name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {provider.city}
                        </p>
                      </div>
                      {provider.is_verified && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {provider.description || `Professional ${serviceData.name.toLowerCase()} services in ${cityName}`}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{provider.rating?.toFixed(1) || "New"}</span>
                        <span className="text-sm text-muted-foreground">
                          ({provider.total_reviews || 0} reviews)
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/provider/${provider.url_slug || provider.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                No {serviceData.pluralName.toLowerCase()} found in {cityName} yet.
              </p>
              <Button onClick={() => navigate(`/providers?service=${serviceData.filter}`)}>
                Browse All {serviceData.pluralName}
              </Button>
            </CardContent>
          </Card>
        )}

        {providers && providers.length > 0 && (
          <div className="text-center mt-8">
            <Button 
              size="lg"
              onClick={() => navigate(`/providers?service=${serviceData.filter}&city=${cityName}`)}
            >
              View All {serviceData.pluralName} in {cityName}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </section>

      {/* SEO Content Section */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-display font-bold mb-6">
              About {serviceData.name} Services in {cityName}
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Looking for the best {serviceData.pluralName.toLowerCase()} in {cityName}? Subhakary connects you with verified and experienced {serviceData.name.toLowerCase()} professionals who specialize in weddings, traditional ceremonies, and events throughout {cityName} and {stateName}.
              </p>
              <p>
                Whether you need a {serviceData.name.toLowerCase()} for a wedding, religious ceremony, or special celebration in {cityName}, our platform makes it easy to compare options, read genuine reviews, and book with confidence. All our {serviceData.pluralName.toLowerCase()} are background-verified to ensure quality service.
              </p>
              <h3>Why Choose Subhakary for {serviceData.pluralName} in {cityName}?</h3>
              <ul>
                <li>Verified and trusted {serviceData.pluralName.toLowerCase()} with proven track records</li>
                <li>Compare prices, portfolios, and reviews in one place</li>
                <li>Easy online booking with secure payments</li>
                <li>Dedicated customer support for {cityName} clients</li>
                <li>Flexible cancellation policies</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Cities */}
      {nearbyCities.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-display font-bold mb-6">
            {serviceData.pluralName} in Nearby Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {nearbyCities.map(nearbyCity => (
              <Link
                key={nearbyCity.name}
                to={`/services/${service}/${createCitySlug(nearbyCity.name)}`}
                className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-center"
              >
                <p className="font-medium">{nearbyCity.name}</p>
                <p className="text-sm text-muted-foreground">{serviceData.pluralName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Other Services in City */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold mb-6">
            Other Services in {cityName}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { slug: "poojari", name: "Poojaris" },
              { slug: "photographer", name: "Photographers" },
              { slug: "makeup-artist", name: "Makeup Artists" },
              { slug: "mehandi-artist", name: "Mehandi Artists" },
              { slug: "decoration", name: "Decorators" },
              { slug: "catering", name: "Caterers" },
              { slug: "function-halls", name: "Function Halls" },
              { slug: "event-managers", name: "Event Managers" }
            ].filter(s => s.slug !== service).map(otherService => (
              <Link
                key={otherService.slug}
                to={`/services/${otherService.slug}/${city}`}
                className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow"
              >
                <p className="font-medium">{otherService.name}</p>
                <p className="text-sm text-muted-foreground">in {cityName}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ServiceLocation;
