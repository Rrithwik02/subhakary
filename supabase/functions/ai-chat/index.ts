import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = type === "search" 
      ? `You are a helpful AI assistant for Subhakary, a platform for booking traditional and cultural services in India. 
         Help users find the right service provider based on their requirements.
         When users describe what they need, suggest relevant service categories and what to look for.
         Be concise and helpful. Focus on services like: Poojari/Priest Services, Photography, Videography, 
         Makeup (Bridal, Groom, HD), Mehandi, Mangala Vayudyam, Decoration, Catering, Function Halls, Event Managers.
         Always respond in a friendly, conversational tone.`
      : `You are Subhakary AI Assistant, helping users discover and book traditional, cultural, and event-based services in India.
         
         You can help users with:
         1. Finding services by category (Poojari, Photography, Makeup, Mehandi, Catering, etc.)
         2. Finding providers by location/city
         3. Getting recommendations based on ratings and reviews
         4. Understanding pricing and availability
         5. Answering questions about booking process
         
         Guide users through a conversational flow:
         - First understand what service they need
         - Then ask about their location/city
         - Provide recommendations based on ratings
         - Help them understand next steps for booking
         
         Be friendly, helpful, and speak in a warm conversational tone. 
         Keep responses concise but informative. Use emojis sparingly for a friendly touch.
         If you don't know something specific, guide them to browse the platform or contact support.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
