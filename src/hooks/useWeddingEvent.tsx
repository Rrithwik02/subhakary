import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type WeddingEvent = {
  id: string;
  user_id: string;
  name: string;
  event_date: string | null;
  city: string | null;
  total_budget: number | null;
  wedding_style: string | null;
  wedding_size: string | null;
  is_primary: boolean;
  progress_percent: number;
};

export const useWeddingEvent = (eventId?: string | null) => {
  const { user } = useAuth();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = useCallback(async () => {
    if (!user) {
      setEvent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from("wedding_events")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (eventId) {
      query = query.eq("id", eventId);
    } else {
      query = query.order("is_primary", { ascending: false }).order("created_at", { ascending: false });
    }

    const { data } = await query.maybeSingle();
    setEvent((data as WeddingEvent) ?? null);
    setLoading(false);
  }, [user, eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, refetch: fetchEvent };
};
