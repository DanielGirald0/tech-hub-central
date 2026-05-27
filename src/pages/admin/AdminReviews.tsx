import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star, Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
  user_id: string | null;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("reviews" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("approved", false);
    if (filter === "approved") q = q.eq("approved", true);
    const { data } = await q;
    setReviews((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("reviews" as any)
      .update({ approved: true })
      .eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Reseña aprobada" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta reseña?")) return;
    const { error } = await supabase.from("reviews" as any).delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Reseña eliminada" });
    load();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-wider mb-6">
        Reseñas
      </h1>

      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "all"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "pending" ? "Pendientes" : f === "approved" ? "Aprobadas" : "Todas"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No hay reseñas.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-start gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-display font-semibold text-foreground">
                    {r.customer_name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.approved
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {r.approved ? "Aprobada" : "Pendiente"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("es-CO")}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < r.rating ? "fill-warning text-warning" : "text-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{r.comment}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!r.approved && (
                  <Button size="sm" onClick={() => approve(r.id)}>
                    <Check className="w-4 h-4 mr-1" /> Aprobar
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => remove(r.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;