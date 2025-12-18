import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MapPin, Star, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Favorites = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { favorites, isLoading } = useFavorites();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-12 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 bg-muted rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-full bg-destructive/10">
                <Heart className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">
                  My Favorites
                </h1>
                <p className="text-muted-foreground">
                  {favorites.length} saved provider{favorites.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {favorites.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Start exploring providers and save your favorites
                  </p>
                  <Button onClick={() => navigate("/providers")}>
                    Browse Providers
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {favorites.map((favorite: any, index: number) => (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="hover-lift cursor-pointer group"
                      onClick={() => navigate(`/provider/${favorite.provider_id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                              {favorite.provider?.category?.icon || "🙏"}
                            </div>
                            <div>
                              <h3 className="font-display font-semibold text-lg group-hover:text-primary transition-colors">
                                {favorite.provider?.business_name}
                              </h3>
                              {favorite.provider?.category?.name && (
                                <Badge variant="secondary" className="text-xs">
                                  {favorite.provider.category.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <FavoriteButton providerId={favorite.provider_id} />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {favorite.provider?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {favorite.provider.city}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                            {favorite.provider?.rating?.toFixed(1) || "New"}
                            <span className="text-xs">
                              ({favorite.provider?.total_reviews || 0})
                            </span>
                          </span>
                        </div>

                        {favorite.provider?.pricing_info && (
                          <p className="text-sm text-secondary font-medium mt-2">
                            {favorite.provider.pricing_info}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Favorites;
