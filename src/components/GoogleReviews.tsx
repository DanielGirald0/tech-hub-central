import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import LocalReviews from "@/components/LocalReviews";

interface Review {
  author: string;
  photo: string | null;
  rating: number;
  text: string;
  relativeTime: string;
}

interface ReviewsData {
  name: string;
  rating: number;
  total: number;
  reviews: Review[];
}

const CACHE_KEY = "google_reviews_cache_v1";
const CACHE_TTL = 24 * 60 * 60 * 1000;

const Stars = ({ value }: { value: number }) => {
  const full = Math.round(value);
  return (
    <div className="flex gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < full ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
};

const GoogleReviews = () => {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < CACHE_TTL) {
            setData(parsed.data);
            setLoading(false);
            return;
          }
        }
        const { data: res, error: err } = await supabase.functions.invoke("google-reviews");
        if (err || !res || (res as any).error) throw err || new Error("api");
        setData(res as ReviewsData);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: res }));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="py-16 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 uppercase tracking-wider">
            Opiniones de nuestros clientes
          </h2>
          {data && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Stars value={data.rating} />
              <span className="font-display text-lg font-semibold text-foreground">
                {data.rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({data.total} reseñas en Google)
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error || !data || data.reviews.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.reviews.slice(0, 6).map((r, i) => (
              <article
                key={i}
                className="bg-card rounded-xl border border-border p-6 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  {r.photo ? (
                    <img
                      src={r.photo}
                      alt={r.author}
                      className="w-10 h-10 rounded-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-display">
                      {r.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-foreground text-sm truncate">
                      {r.author}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.relativeTime}</p>
                  </div>
                </div>
                <Stars value={r.rating} />
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-6">
                  {r.text}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
      <LocalReviews />
    </section>
  );
};

export default GoogleReviews;