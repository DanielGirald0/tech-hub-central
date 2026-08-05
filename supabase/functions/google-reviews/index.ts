const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
        "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews",
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

    // Fallback: the new Places API sometimes returns no reviews for a place
    // (language filtering / field availability). Use the legacy Details API.
    if (data.reviews.length === 0) {
      console.log("No reviews from Places v1, trying legacy Details API");
      const legacyUrl =
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}` +
        `&fields=name,rating,user_ratings_total,reviews&reviews_no_translations=false&key=${API_KEY}`;
      const legacyRes = await fetch(legacyUrl);
      if (legacyRes.ok) {
        const legacyJson = await legacyRes.json();
        if (legacyJson.status !== "OK") {
          console.error("Legacy Places error", legacyJson.status, legacyJson.error_message);
        }
        const r0 = legacyJson.result;
        if (r0) {
          data.name = data.name || r0.name || "";
          data.rating = data.rating || r0.rating || 0;
          data.total = data.total || r0.user_ratings_total || 0;
          data.reviews = (r0.reviews ?? []).map((r: any) => ({
            author: r.author_name ?? "Anónimo",
            photo: r.profile_photo_url ?? null,
            rating: r.rating ?? 0,
            text: r.text ?? "",
            relativeTime: r.relative_time_description ?? "",
          }));
        }
      } else {
        console.error("Legacy Places HTTP error", legacyRes.status);
      }
    }

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
