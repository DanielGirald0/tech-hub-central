import { useEffect, useState, FormEvent } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface LocalReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const reviewSchema = z.object({
  customer_name: z.string().trim().min(2, "Nombre requerido").max(80),
  rating: z.number().int().min(1, "Calificación requerida").max(5),
  comment: z.string().trim().min(5, "Comentario requerido").max(1000),
});

const PAGE_SIZE = 6;

const Stars = ({ value, size = "w-4 h-4" }: { value: number; size?: string }) => {
  const full = Math.round(value);
  return (
    <div className="flex gap-0.5" aria-label={`${value} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < full ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
        />
      ))}
    </div>
  );
};

const RatingInput = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-1 transition-transform hover:scale-110"
          aria-label={`${n} estrellas`}
        >
          <Star
            className={`w-7 h-7 ${
              n <= (hover || value)
                ? "fill-warning text-warning"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const LocalReviews = () => {
  const { user, profile } = useAuth() as any;
  const [reviews, setReviews] = useState<LocalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (user && profile?.name && !name) setName(profile.name);
  }, [user, profile]);

  const fetchReviews = async (p = 0) => {
    setLoading(true);
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from("reviews" as any)
      .select("id, customer_name, rating, comment, created_at", { count: "exact" })
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .range(from, to);
    setReviews((data as any[]) || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews(page);
  }, [page]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = reviewSchema.safeParse({
      customer_name: name,
      rating,
      comment,
    });
    if (!parsed.success) {
      toast({
        title: "Revisa los campos",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews" as any).insert({
      customer_name: parsed.data.customer_name,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      user_id: user?.id ?? null,
      approved: false,
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "No se pudo enviar la reseña",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "¡Gracias por tu reseña!",
      description: "Tu opinión será revisada antes de publicarse.",
    });
    setRating(0);
    setComment("");
    if (!user) setName("");
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container mx-auto px-4 mt-16">
      {/* Approved reviews */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="bg-card rounded-xl border border-border p-6 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-semibold">
                    {r.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-foreground text-sm truncate">
                      {r.customer_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Stars value={r.rating} />
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
                  {r.comment}
                </p>
              </article>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mb-10">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="px-3 py-1.5 text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      ) : null}

      {/* Review form */}
      <div className="mt-12 max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8">
        <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2 uppercase tracking-wider text-center">
          Deja tu reseña
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Tu opinión nos ayuda a mejorar. Será publicada tras revisión.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="review-name">Nombre</Label>
            <Input
              id="review-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={80}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Calificación</Label>
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <div>
            <Label htmlFor="review-comment">Comentario</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos tu experiencia..."
              rows={4}
              maxLength={1000}
              required
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000
            </p>
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" /> Enviar reseña
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LocalReviews;