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

export const useWeddingEvent = () => {
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
    const { data } = await supabase
      .from("wedding_events")
      .select("*")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setEvent((data as WeddingEvent) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, refetch: fetchEvent };
};
