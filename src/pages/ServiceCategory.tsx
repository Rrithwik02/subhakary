import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEOHead, generateServiceSchema, generateBreadcrumbSchema } from "@/components/SEOHead";
import { getServiceFromSlug, topCitiesSEO, createCitySlug, servicesSEO } from "@/data/seoData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, ChevronRight, Users, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const ServiceCategory = () => {
  const { service } = useParams();
  const navigate = useNavigate();
  
  const serviceData = getServiceFromSlug(service || "");

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

  const pageTitle = `${serviceData.pluralName} Near Me | Book ${serviceData.name} Services Across India - Subhakary`;
  const pageDescription = `Find and book trusted ${serviceData.pluralName.toLowerCase()} near you. ${serviceData.description}. Available in 50+ cities across India. Compare prices, read reviews, book online.`;
  const pageKeywords = serviceData.keywords.map(k => `${k} near me, ${k} in India`).join(", ") + ", " + topCitiesSEO.slice(0, 10).map(c => `${serviceData.name.toLowerCase()} in ${c.name}`).join(", ");
  const canonicalUrl = `https://subhakary.com/services/${service}`;

  const breadcrumbs = [
    { name: "Home", url: "https://subhakary.com/" },
    { name: "Services", url: "https://subhakary.com/services" },
    { name: serviceData.pluralName, url: canonicalUrl }
  ];

  // Group cities by state
  const citiesByState = topCitiesSEO.reduce((acc, city) => {
    if (!acc[city.state]) acc[city.state] = [];
    acc[city.state].push(city);
    return acc;
  }, {} as Record<string, typeof topCitiesSEO>);

  // Sort states by number of cities
  const sortedStates = Object.entries(citiesByState)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <main className="min-h-screen bg-background">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={pageKeywords}
        canonicalUrl={canonicalUrl}
        jsonLd={[
          generateServiceSchema(serviceData.pluralName, serviceData.description),
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
          <li className="text-foreground font-medium">{serviceData.pluralName}</li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge variant="secondary" className="mb-4">
              <Users className="w-3 h-3 mr-1" />
              Available in {topCitiesSEO.length}+ Cities
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
              Find {serviceData.pluralName} Near You
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {serviceData.description}. Book verified professionals across India for weddings, ceremonies, and special events.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate(`/providers?service=${serviceData.filter}`)}
              >
                Browse All {serviceData.pluralName}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/contact")}>
                Get Custom Quote
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Verified Professionals</h3>
              <p className="text-muted-foreground text-sm">
                All {serviceData.pluralName.toLowerCase()} are background-verified for quality assurance
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Genuine Reviews</h3>
              <p className="text-muted-foreground text-sm">
                Read authentic reviews from verified customers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Pan-India Coverage</h3>
              <p className="text-muted-foreground text-sm">
                Available in {topCitiesSEO.length}+ cities across all major states
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Popular Cities Section */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-4">
            Find {serviceData.pluralName} by City
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Select your city to find the best {serviceData.pluralName.toLowerCase()} near you
          </p>

          {/* Tier 1 Cities - Featured */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Popular Cities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {topCitiesSEO.filter(c => c.priority === 1).map(city => (
                <Link
                  key={city.name}
                  to={`/services/${service}/${createCitySlug(city.name)}`}
                  className="p-4 bg-background rounded-lg hover:shadow-md transition-all hover:-translate-y-1 text-center border"
                >
                  <p className="font-medium">{city.name}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* All Cities by State */}
          <div className="space-y-6">
            {sortedStates.map(([state, cities]) => (
              <div key={state}>
                <h3 className="font-semibold mb-3">{state}</h3>
                <div className="flex flex-wrap gap-2">
                  {cities.map(city => (
                    <Link
                      key={city.name}
                      to={`/services/${service}/${createCitySlug(city.name)}`}
                      className="px-4 py-2 bg-background rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors border"
                    >
                      {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-display font-bold mb-6">
            About {serviceData.name} Services on Subhakary
          </h2>
          <div className="prose prose-gray max-w-none">
            <p>
              Subhakary is India's premier platform for booking {serviceData.pluralName.toLowerCase()} for weddings, traditional ceremonies, and special events. Whether you're searching for "{serviceData.keywords[0]} near me" or looking for specific {serviceData.pluralName.toLowerCase()} in cities like Hyderabad, Bangalore, or Mumbai, we have you covered.
            </p>
            <p>
              Our verified {serviceData.pluralName.toLowerCase()} bring years of experience in delivering exceptional services for weddings, religious ceremonies, and cultural events. Each professional on our platform goes through a rigorous verification process to ensure quality and reliability.
            </p>
            <h3>How to Book {serviceData.pluralName} on Subhakary</h3>
            <ol>
              <li>Select your city or allow location access to find {serviceData.pluralName.toLowerCase()} near you</li>
              <li>Browse profiles, compare prices, and read genuine reviews</li>
              <li>Contact professionals directly or request quotes</li>
              <li>Book securely through our platform with flexible payment options</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Other Services */}
      <section className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold mb-6 text-center">
            Explore Other Services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {servicesSEO.filter(s => s.slug !== service).map(otherService => (
              <Link
                key={otherService.slug}
                to={`/services/${otherService.slug}`}
                className="p-4 bg-background rounded-lg hover:shadow-md transition-shadow text-center border"
              >
                <p className="font-medium">{otherService.pluralName}</p>
                <p className="text-xs text-muted-foreground mt-1">Near Me</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default ServiceCategory;
