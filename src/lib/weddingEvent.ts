import { supabase } from "@/integrations/supabase/client";

export async function getPrimaryWeddingEventId(userId: string) {
  const { data, error } = await supabase
    .from("wedding_events")
    .select("id")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Unable to load primary wedding event", error);
    return null;
  }

  return data?.id ?? null;
}
