import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";


interface Favorite {
  id: string;
  provider_id: string;
  created_at: string;
}

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

      let profileId = profile?.id;
      if (!profileId) {
        const { data: createdProfile, error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              email: user.email || null,
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "User",
              avatar_url: user.user_metadata?.avatar_url || null,
            },
            { onConflict: "user_id" }
          )
          .select("id")
          .single();

        if (profileError) throw profileError;
        profileId = createdProfile?.id;
      }

      if (!profileId) return [];

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
        .eq("user_id", profileId);

      if (error) throw error;
      return (data as unknown as Favorite[]) || [];
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

      let profileId = profile?.id;
      if (!profileId) {
        const { data: createdProfile, error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              email: user.email || null,
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "User",
              avatar_url: user.user_metadata?.avatar_url || null,
            },
            { onConflict: "user_id" }
          )
          .select("id")
          .single();

        if (profileError) throw profileError;
        profileId = createdProfile?.id;
      }

      if (!profileId) throw new Error("Profile not found");

      // Check if already favorited
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", profileId)
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
          .insert({ user_id: profileId, provider_id: providerId });
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
    return favorites.some((f) => f.provider_id === providerId);
  };

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
  };
};
