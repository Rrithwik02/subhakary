import { supabase } from "@/integrations/supabase/client";

type BookingPayload = Record<string, unknown>;

const isMissingColumnError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  return code === "PGRST204" || message.includes("schema cache") || message.includes("Could not find");
};

export async function createBooking(payload: BookingPayload, weddingEventId?: string | null) {
  const attempts = weddingEventId
    ? [
        { ...payload, wedding_event_id: weddingEventId },
        { ...payload, event_id: weddingEventId },
        payload,
      ]
    : [payload];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("bookings")
      .insert(attempt as never)
      .select()
      .single();

    if (!error) return data;
    lastError = error;
    if (!isMissingColumnError(error)) throw error;
  }

  throw lastError;
}
