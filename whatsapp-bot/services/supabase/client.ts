import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from "../../types/database.ts";

export type SupabaseService = SupabaseClient<Database>;

export function createServiceClient(): SupabaseService {
  const url = Deno.env.get("SUPABASE_URL");
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !secretKey) {
    throw new Error("Missing Supabase service credentials");
  }

  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAnonymousClient(): SupabaseService | null {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) return null;
  return createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
