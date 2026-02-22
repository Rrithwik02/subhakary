import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, Clock, Languages, BadgeCheck, Crown, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProviderComparison } from "@/hooks/useProviderComparison";

const Compare = () => {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompare } = useProviderComparison();

  if (compareList.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Not enough providers to compare</h1>
            <p className="text-muted-foreground mb-6">
              Please select at least 2 providers to compare.
            </p>
            <Button onClick={() => navigate("/providers")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Providers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const comparisonRows = [
    {
      label: "Rating",
      render: (p: typeof compareList[0]) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="font-semibold">{p.rating?.toFixed(1) || "New"}</span>
          <span className="text-muted-foreground text-sm">({p.total_reviews || 0})</span>
        </div>
      ),
    },
    {
      label: "Starting Price",
      render: (p: typeof compareList[0]) => (
        <span className="font-semibold text-primary">
          {p.base_price ? `₹${p.base_price.toLocaleString("en-IN")}` : "Contact for price"}
        </span>
      ),
    },
    {
      label: "Experience",
      render: (p: typeof compareList[0]) => (
        <span>{p.experience_years ? `${p.experience_years}+ years` : "Not specified"}</span>
      ),
    },
    {
      label: "Location",
      render: (p: typeof compareList[0]) => (
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {p.city || "Not specified"}
        </span>
      ),
    },
    {
      label: "Category",
      render: (p: typeof compareList[0]) => (
        <Badge variant="secondary" className="text-xs">
          {p.category?.name || "N/A"}
        </Badge>
      ),
    },
    {
      label: "Subcategory",
      render: (p: typeof compareList[0]) => (
        <span className="text-sm">{p.subcategory || "N/A"}</span>
      ),
    },
    {
      label: "Verified",
      render: (p: typeof compareList[0]) => (
        p.is_verified ? (
          <span className="flex items-center gap-1 text-green-500">
            <BadgeCheck className="h-4 w-4" /> Yes
          </span>
        ) : (
          <span className="text-muted-foreground">No</span>
        )
      ),
    },
    {
      label: "Premium",
      render: (p: typeof compareList[0]) => (
        p.is_premium ? (
          <span className="flex items-center gap-1 text-amber-500">
            <Crown className="h-4 w-4" /> Yes
          </span>
        ) : (
          <span className="text-muted-foreground">No</span>
        )
      ),
    },
    {
      label: "Languages",
      render: (p: typeof compareList[0]) => (
        <span className="text-sm">
          {p.languages?.join(", ") || "Not specified"}
        </span>
      ),
    },
    {
      label: "Specializations",
      render: (p: typeof compareList[0]) => (
        <div className="flex flex-wrap gap-1">
          {p.specializations?.slice(0, 3).map((spec, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">
              {spec}
            </Badge>
          )) || <span className="text-muted-foreground text-sm">None listed</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 md:pt-32 pb-6 md:pb-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="-ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={clearCompare}>
              Clear All
            </Button>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-4xl font-bold text-foreground mb-2 text-center"
          >
            Compare <span className="text-gradient-gold">Providers</span>
          </motion.h1>
          <p className="text-muted-foreground text-center mb-8">
            Side-by-side comparison of {compareList.length} providers
          </p>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Provider Headers */}
              <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `150px repeat(${compareList.length}, 1fr)` }}>
                <div></div>
                {compareList.map((provider) => (
                  <Card key={provider.id} className="relative overflow-hidden">
                    <button
                      onClick={() => removeFromCompare(provider.id)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-muted hover:bg-destructive/20 transition-colors z-10"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <CardContent className="p-4 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-muted overflow-hidden mb-3 border-2 border-primary/20">
                        {provider.logo_url ? (
                          <img
                            src={provider.logo_url}
                            alt={provider.business_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {provider.category?.icon || "👤"}
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                        {provider.business_name}
                      </h3>
                      <Button
                        size="sm"
                        className="w-full gradient-gold text-primary-foreground"
                        onClick={() => navigate(`/provider/${(provider as any).url_slug || provider.id}`)}
                      >
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Comparison Rows */}
              <div className="space-y-1">
                {comparisonRows.map((row, idx) => (
                  <div
                    key={row.label}
                    className={`grid gap-4 py-3 px-4 rounded-lg ${
                      idx % 2 === 0 ? "bg-muted/50" : ""
                    }`}
                    style={{ gridTemplateColumns: `150px repeat(${compareList.length}, 1fr)` }}
                  >
                    <div className="font-medium text-sm text-muted-foreground flex items-center">
                      {row.label}
                    </div>
                    {compareList.map((provider) => (
                      <div key={provider.id} className="flex items-center justify-center text-sm">
                        {row.render(provider)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Description Row */}
              <div className="mt-6">
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `150px repeat(${compareList.length}, 1fr)` }}
                >
                  <div className="font-medium text-sm text-muted-foreground pt-2">
                    Description
                  </div>
                  {compareList.map((provider) => (
                    <Card key={provider.id}>
                      <CardContent className="p-3">
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {provider.description || "No description provided."}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Compare;
