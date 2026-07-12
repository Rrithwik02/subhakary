import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WeddingEventOption = {
  id: string;
  name: string;
  event_date: string | null;
  is_primary: boolean;
};

export function useWeddingEvents(userId?: string) {
  return useQuery({
    queryKey: ["wedding-events-booking", userId],
    queryFn: async () => {
      if (!userId) return [] as WeddingEventOption[];

      const { data, error } = await supabase
        .from("wedding_events")
        .select("id, name, event_date, is_primary")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false })
        .order("event_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as WeddingEventOption[];
    },
    enabled: !!userId,
  });
}
