import { corsHeaders } from "@supabase/supabase-js/cors";

const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
const PLACE_ID = Deno.env.get("GOOGLE_PLACE_ID");

let cache: { data: unknown; ts: number } | null = null;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!API_KEY || !PLACE_ID) {
      return new Response(JSON.stringify({ error: "Missing config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=es`;
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask":
          "id,displayName,rating,userRatingCount,reviews",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Google Places error", res.status, text);
      return new Response(JSON.stringify({ error: "Places API error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await res.json();
    const data = {
      name: json.displayName?.text ?? "",
      rating: json.rating ?? 0,
      total: json.userRatingCount ?? 0,
      reviews: (json.reviews ?? []).map((r: any) => ({
        author: r.authorAttribution?.displayName ?? "Anónimo",
        photo: r.authorAttribution?.photoUri ?? null,
        rating: r.rating ?? 0,
        text: r.text?.text ?? r.originalText?.text ?? "",
        relativeTime: r.relativePublishTimeDescription ?? "",
      })),
    };

    cache = { data, ts: Date.now() };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
