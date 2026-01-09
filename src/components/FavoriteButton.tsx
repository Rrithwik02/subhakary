import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { trackFavoriteAdded, trackFavoriteRemoved } from "@/lib/analytics";
interface FavoriteButtonProps {
  providerId: string;
  variant?: "icon" | "button";
  className?: string;
}

export const FavoriteButton = ({ 
  providerId, 
  variant = "icon",
  className 
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const favorited = isFavorite(providerId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Track favorite action
    if (favorited) {
      trackFavoriteRemoved({ providerId });
    } else {
      trackFavoriteAdded({ providerId });
    }
    
    toggleFavorite.mutate(providerId);
  };

  if (variant === "button") {
    return (
      <Button
        variant={favorited ? "default" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={toggleFavorite.isPending}
        className={cn(
          favorited && "bg-destructive hover:bg-destructive/90",
          className
        )}
      >
        <Heart 
          className={cn(
            "h-4 w-4 mr-2",
            favorited && "fill-current"
          )} 
        />
        {favorited ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      className={cn(
        "p-2 rounded-full transition-all duration-200",
        "hover:bg-muted/80 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={cn(
          "h-5 w-5 transition-colors",
          favorited 
            ? "fill-destructive text-destructive" 
            : "text-muted-foreground hover:text-destructive"
        )} 
      />
    </button>
  );
};
