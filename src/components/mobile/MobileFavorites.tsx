import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Star, Loader2 } from "lucide-react";
import { MobileLayout } from "./MobileLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

export const MobileFavorites = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading } = useFavorites();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in to view favorites</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Save your favorite service providers for quick access
          </p>
          <Button onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideHeader>
      <div
        ref={scrollRef}
        className="min-h-screen bg-background pb-24"
      >

        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <Heart className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-lg font-bold">My Favorites</h1>
              <p className="text-xs text-muted-foreground">
                {favorites.length} saved provider{favorites.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No favorites yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start exploring providers and save your favorites
              </p>
              <Button onClick={() => navigate("/providers")}>
                Browse Providers
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {favorites.map((favorite: any, index: number) => (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/provider/${favorite.provider_id}`)}
                    className="bg-card rounded-xl border border-border/50 p-3 active:scale-[0.98] transition-transform touch-active"
                  >
                    <div className="flex items-center gap-3">
                      {/* Provider image */}
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                        {favorite.provider?.logo_url ? (
                          <img
                            src={favorite.provider.logo_url}
                            alt={favorite.provider?.business_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          favorite.provider?.category?.icon || "🙏"
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm truncate">
                            {favorite.provider?.business_name}
                          </h3>
                          <div onClick={(e) => e.stopPropagation()}>
                            <FavoriteButton providerId={favorite.provider_id} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {favorite.provider?.category?.name && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {favorite.provider.category.name}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                          {favorite.provider?.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {favorite.provider.city}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            {favorite.provider?.rating?.toFixed(1) || "New"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default MobileFavorites;
