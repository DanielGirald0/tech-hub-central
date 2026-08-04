import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { listProducts, type CatalogProduct } from "@/lib/alegra-catalog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Star } from "lucide-react";
import { toast } from "sonner";

const MAX_FEATURED = 12;

const AdminFeatured = () => {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [featured, setFeatured] = useState<{ alegra_id: string; name: string | null }[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const featuredIds = useMemo(() => new Set(featured.map((f) => f.alegra_id)), [featured]);

  const loadFeatured = async () => {
    const { data, error } = await supabase
      .from("featured_products")
      .select("alegra_id,name,position")
      .order("position", { ascending: true });
    if (error) {
      toast.error("No se pudieron cargar los destacados");
      return;
    }
    setFeatured((data || []).map((d: any) => ({ alegra_id: String(d.alegra_id), name: d.name })));
  };

  useEffect(() => {
    loadFeatured();
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listProducts({ page: 1, pageSize: 24, search: term, inStockOnly: false })
      .then((res) => {
        if (active) setItems(res.items);
      })
      .catch(() => {
        if (active) toast.error("No se pudo cargar el catálogo");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [term]);

  const toggle = async (product: CatalogProduct, checked: boolean) => {
    setSavingId(product.id);
    if (checked) {
      if (featured.length >= MAX_FEATURED) {
        toast.error(`Máximo ${MAX_FEATURED} productos destacados`);
        setSavingId(null);
        return;
      }
      const { error } = await supabase
        .from("featured_products")
        .insert({ alegra_id: product.id, name: product.name, position: featured.length });
      if (error) toast.error("No se pudo destacar: " + error.message);
      else toast.success("Producto destacado");
    } else {
      const { error } = await supabase.from("featured_products").delete().eq("alegra_id", product.id);
      if (error) toast.error("No se pudo quitar: " + error.message);
      else toast.success("Producto quitado de destacados");
    }
    await loadFeatured();
    setSavingId(null);
  };

  const removeById = async (alegraId: string) => {
    setSavingId(alegraId);
    const { error } = await supabase.from("featured_products").delete().eq("alegra_id", alegraId);
    if (error) toast.error("No se pudo quitar: " + error.message);
    await loadFeatured();
    setSavingId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <BackButton />
      <div className="flex items-center gap-3 mb-8">
        <Star className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-wider">Productos Destacados</h1>
          <p className="text-muted-foreground text-sm">
            Marca los productos que se mostrarán en la página principal (máx. {MAX_FEATURED}).
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-display font-semibold text-foreground uppercase tracking-wider mb-3">
          Seleccionados ({featured.length}/{MAX_FEATURED})
        </h2>
        {featured.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has destacado ningún producto.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {featured.map((f) => (
              <li key={f.alegra_id} className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 text-sm">
                <span className="text-foreground">{f.name || f.alegra_id}</span>
                <button
                  onClick={() => removeById(f.alegra_id)}
                  disabled={savingId === f.alegra_id}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Quitar ${f.name || f.alegra_id} de destacados`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        className="flex gap-2 mb-5"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(search.trim());
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto en el catálogo..."
          aria-label="Buscar producto"
        />
        <Button type="submit">
          <Search className="w-4 h-4 mr-2" /> Buscar
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando catálogo...
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => {
            const checked = featuredIds.has(p.id);
            return (
              <label
                key={p.id}
                className="flex items-center gap-4 bg-card border border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary/30 transition-colors"
              >
                <Checkbox
                  checked={checked}
                  disabled={savingId === p.id}
                  onCheckedChange={(v) => toggle(p, Boolean(v))}
                  aria-label={`Destacar ${p.name}`}
                />
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="w-12 h-12 object-contain rounded bg-secondary" />
                ) : (
                  <div className="w-12 h-12 rounded bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.reference || p.id}</p>
                </div>
              </label>
            );
          })}
          {items.length === 0 && <p className="text-sm text-muted-foreground">Sin resultados.</p>}
        </div>
      )}
    </div>
  );
};

export default AdminFeatured;
