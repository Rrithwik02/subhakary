import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          provider_id,
          created_at,
          provider:service_providers(
            id,
            business_name,
            city,
            rating,
            total_reviews,
            pricing_info,
            is_verified,
            category:service_categories(name, icon)
          )
        `)
        .eq("user_id", profile.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (providerId: string) => {
      if (!user) throw new Error("Please sign in to save favorites");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) throw new Error("Profile not found");

      // Check if already favorited
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", profile.id)
        .eq("provider_id", providerId)
        .maybeSingle();

      if (existing) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" };
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: profile.id, provider_id: providerId });
        if (error) throw error;
        return { action: "added" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast({
        title: result.action === "added" ? "Added to favorites" : "Removed from favorites",
        description: result.action === "added" 
          ? "Provider saved to your favorites" 
          : "Provider removed from your favorites",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isFavorite = (providerId: string) => {
    return favorites.some((f: any) => f.provider_id === providerId);
  };

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
  };
};
