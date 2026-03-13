import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Category slug -> UUID mapping
const CATEGORY_MAP: Record<string, string> = {
  poojari: "7feb9e4f-372c-4430-94b4-7576c3508372",
  photographers: "aa827d7d-aaca-45ba-9420-44453f5a7f58",
  videographers: "4e209cfa-ab2a-4f10-b0b5-9533fb63621a",
  makeup: "a68ebe7c-1a7f-4e26-aceb-d1dfff0de5bf",
  mehndi: "aea07102-32ce-4a40-ae32-116acd5b1dfd",
  decorations: "f3ea05d0-c8a7-40bc-8b61-b3bbdc86d5b4",
  catering: "564b322b-7d44-422c-a9fd-bdcc11f9dc14",
  functionhalls: "912180c4-037c-4741-999c-d97744f5811b",
  eventplanners: "65131497-ef92-4971-94a5-ce747ec42fe2",
  mangalavaadhyams: "69eed3d0-bdc4-4822-a3d8-18298ee27beb",
  // aliases
  priests: "7feb9e4f-372c-4430-94b4-7576c3508372",
  photography: "aa827d7d-aaca-45ba-9420-44453f5a7f58",
  videography: "4e209cfa-ab2a-4f10-b0b5-9533fb63621a",
  mehandi: "aea07102-32ce-4a40-ae32-116acd5b1dfd",
  decoration: "f3ea05d0-c8a7-40bc-8b61-b3bbdc86d5b4",
  "function-halls": "912180c4-037c-4741-999c-d97744f5811b",
  "event-managers": "65131497-ef92-4971-94a5-ce747ec42fe2",
  "mangala-vadyam": "69eed3d0-bdc4-4822-a3d8-18298ee27beb",
};

async function detectCategories(
  query: string,
  apiKey: string
): Promise<{ categories: string[]; summary: string; location: string | null }> {
  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an assistant for an Indian event services platform called Subhakary/Saathi.
Given a user query, identify which service categories they need and extract any location mentioned.

Available categories (use ONLY these exact keys):
- photographers
- videographers
- catering
- mehndi
- makeup
- functionhalls
- priests
- mangalavaadhyams
- decorations
- eventplanners

Common mappings (match ANY of these terms to the category):
- "pandit", "poojari", "purohit", "priest", "priests", "pujari", "panditji", "guruji", "astrologer", "temple priest" → priests
- "nadaswaram", "shehnai", "mangala vadyam", "mangala vadhyam", "nadhaswaram", "band", "DJ", "music", "wedding band", "dhol", "drums" → mangalavaadhyams
- "venue", "hall", "banquet", "banquet hall", "function hall", "function halls", "marriage hall", "wedding venue", "kalyana mandapam", "convention center", "auditorium" → functionhalls
- "wedding planner", "wedding planners", "event manager", "event managers", "event planner", "event planners", "event organizer", "coordinator" → eventplanners
- "henna", "mehandi", "mehndi", "mehndi artist", "mehndi artists", "henna artist", "bridal mehndi" → mehndi
- "bridal makeup", "makeup artist", "makeup artists", "MUA", "beautician", "beauty", "bridal beauty", "makeover", "hair stylist", "hairdresser", "makeup near me", "best makeup" → makeup
- "decorator", "decorators", "flower decoration", "floral decoration", "mandap", "pandal", "stage decoration", "wedding decoration", "wedding decorations", "event decoration", "balloon decoration", "backdrop" → decorations
- "caterer", "caterers", "catering", "food", "food service", "wedding food", "best caterers", "catering service", "biryani", "veg catering", "non-veg catering", "buffet" → catering
- "photo", "photographer", "photographers", "photography", "wedding photographer", "wedding photography", "candid photographer", "pre-wedding shoot", "photo studio", "best photographers", "photographers near me" → photographers
- "video", "videographer", "videographers", "videography", "wedding videography", "cinematic", "drone videography", "wedding film", "video editor" → videographers

IMPORTANT: Be generous in matching. If the user mentions any variation, plural, or colloquial form of a service, map it to the correct category. For example "makeup artists in vizag" should map to "makeup", "best wedding photographers" should map to "photographers".

For location, normalize common aliases:
- "vizag" → "Visakhapatnam"
- "hyd" → "Hyderabad"
- "blr", "bengaluru" → "Bangalore"
- "sec", "secbad" → "Secunderabad"
- "chennai" → "Chennai"
- "mumbai", "bombay" → "Mumbai"
- "delhi", "new delhi" → "Delhi"
- "pune" → "Pune"
- "kolkata", "calcutta" → "Kolkata"`,
          },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_search_intent",
              description:
                "Extract service categories and location from a user search query.",
              parameters: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: [
                        "photographers",
                        "videographers",
                        "catering",
                        "mehndi",
                        "makeup",
                        "functionhalls",
                        "priests",
                        "mangalavaadhyams",
                        "decorations",
                        "eventplanners",
                      ],
                    },
                    description: "Detected service categories",
                  },
                  summary: {
                    type: "string",
                    description:
                      "A brief 1-2 sentence summary of what was found for the user",
                  },
                  location: {
                    type: "string",
                    description:
                      "The city/location mentioned, normalized. Null if none.",
                  },
                },
                required: ["categories", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "extract_search_intent" },
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("No tool call in AI response");
  }

  const args = JSON.parse(toolCall.function.arguments);
  return {
    categories: args.categories || [],
    summary: args.summary || "",
    location: args.location || null,
  };
}

function rankProviders(providers: any[]): any[] {
  return [...providers].sort((a, b) => {
    if (a.is_premium !== b.is_premium) {
      return b.is_premium ? 1 : -1;
    }
    return (b.rating || 0) - (a.rating || 0);
  });
}

function buildQuery(supabase: any, categoryIds: string[], location: string | null) {
  let qb = supabase
    .from("service_providers")
    .select(
      "id, business_name, service_type, city, rating, total_reviews, base_price, is_premium, is_verified, description, subcategory, category_id"
    )
    .eq("status", "approved")
    .limit(10);

  if (categoryIds.length > 0) {
    qb = qb.in("category_id", categoryIds);
  }

  if (location) {
    qb = qb.or(
      `city.ilike.%${location}%,service_cities.cs.{${location}}`
    );
  }

  return qb;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(
        JSON.stringify({ error: "query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: AI-powered category detection
    const { categories, summary, location } = await detectCategories(
      query.trim(),
      LOVABLE_API_KEY
    );

    // Step 2: Map categories to UUIDs
    const categoryIds = categories
      .map((c: string) => CATEGORY_MAP[c])
      .filter(Boolean);

    // Step 3: Query providers with location
    const { data: providers, error } = await buildQuery(supabase, categoryIds, location);
    if (error) {
      console.error("DB query error:", error);
      throw new Error("Failed to fetch providers");
    }

    let finalProviders = providers || [];
    let finalSummary = summary;
    let locationFallback = false;

    // Step 4: Location fallback — if no results found with location, try without location
    if (finalProviders.length === 0 && location && categoryIds.length > 0) {
      const { data: fallbackProviders, error: fallbackError } = await buildQuery(supabase, categoryIds, null);
      if (fallbackError) {
        console.error("Fallback query error:", fallbackError);
      } else if (fallbackProviders && fallbackProviders.length > 0) {
        finalProviders = fallbackProviders;
        locationFallback = true;
        finalSummary = `No providers found in ${location}. Showing top providers from other cities.`;
      }
    }

    // Step 5: Rank — premium first, then by rating
    const ranked = rankProviders(finalProviders);

    return new Response(
      JSON.stringify({
        query: query.trim(),
        detected_categories: categories,
        summary: finalSummary,
        location,
        location_fallback: locationFallback,
        total: ranked.length,
        results: ranked,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("ai-recommend error:", e);

    if (e instanceof Response) {
      if (e.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (e.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
