import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Provider = {
  id: string;
  business_name: string;
  rating?: number | null;
  total_reviews?: number | null;
  base_price?: number | null;
  experience_years?: number | null;
  is_verified?: boolean | null;
  is_premium?: boolean | null;
  category?: { name?: string | null } | null;
  subcategory?: string | null;
};

type Preferences = {
  budget_max?: number | null;
  priorities?: string[] | null;
};

function scoreProvider(provider: Provider, prefs: Preferences | null) {
  let score = 0;
  score += Number(provider.rating || 0) * 10;
  score += Math.min(Number(provider.total_reviews || 0), 60) * 0.35;
  score += Number(provider.experience_years || 0) * 1.5;
  if (provider.is_verified) score += 12;
  if (provider.is_premium) score += 8;
  if (prefs?.budget_max && provider.base_price && provider.base_price <= prefs.budget_max) score += 14;
  const text = `${provider.category?.name || ""} ${provider.subcategory || ""}`.toLowerCase();
  if (prefs?.priorities?.some((p) => text.includes(p.toLowerCase()))) score += 10;
  return Math.round(score);
}

function tagline(provider: Provider, prefs: Preferences | null) {
  if (prefs?.budget_max && provider.base_price && provider.base_price <= prefs.budget_max) return "Best value fit";
  if (provider.is_premium) return "Best premium choice";
  if ((provider.rating || 0) >= 4.5) return "Best rated";
  if ((provider.experience_years || 0) >= 5) return "Most experienced";
  return "Solid balanced option";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { providers } = await req.json();
    if (!Array.isArray(providers) || providers.length < 2) {
      return new Response(JSON.stringify({ error: "At least two providers are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get("Authorization") || "";
    let preferences: Preferences | null = null;

    if (authHeader && Deno.env.get("SUPABASE_ANON_KEY")) {
      const token = authHeader.replace("Bearer ", "");
      const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await authClient.auth.getUser(token);
      if (userData.user?.id) {
        const { data } = await supabase
          .from("wedding_preferences")
          .select("budget_max,priorities")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        preferences = data as Preferences | null;
      }
    }

    const scored = (providers as Provider[])
      .slice(0, 3)
      .map((provider) => ({
        provider_id: provider.id,
        tagline: tagline(provider, preferences),
        score: scoreProvider(provider, preferences),
      }))
      .sort((a, b) => b.score - a.score);

    const winner = providers.find((p: Provider) => p.id === scored[0]?.provider_id);
    const verdict = winner
      ? `${winner.business_name} is the strongest fit based on rating, trust signals, experience, and your planning preferences.`
      : "These providers are closely matched; compare availability and package inclusions before booking.";

    return new Response(JSON.stringify({ verdict, providers: scored }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unable to compare providers" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
