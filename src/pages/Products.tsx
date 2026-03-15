import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { products as staticProducts, categories } from "@/data/products";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Products = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dbProducts, setDbProducts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync category from URL
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
  }, [searchParams]);

  // Fetch from database
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("products").select("*");
      if (!error && data && data.length > 0) {
        setDbProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const allProducts = dbProducts && dbProducts.length > 0 ? dbProducts : staticProducts;

  const filtered = useMemo(() => {
    let result = [...allProducts];
    if (selectedCategory) result = result.filter((p: any) => p.category === selectedCategory);
    if (sortBy === "price-low") result.sort((a: any, b: any) => a.price - b.price);
    if (sortBy === "price-high") result.sort((a: any, b: any) => b.price - a.price);
    if (sortBy === "rating") result.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
    return result;
  }, [allProducts, selectedCategory, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Productos</h1>
      <p className="text-muted-foreground mb-8">Explora nuestro catálogo completo de productos tecnológicos</p>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-3">Categoría</h3>
              <div className="space-y-1">
                <button onClick={() => setSelectedCategory("")} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${!selectedCategory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  Todos los productos
                </button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${selectedCategory === cat.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-3">Ordenar por</h3>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="featured">Destacados</option>
                <option value="price-low">Precio: Menor a mayor</option>
                <option value="price-high">Precio: Mayor a menor</option>
                <option value="rating">Mejor valorados</option>
              </select>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="border-border text-foreground">
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </Button>
            <span className="text-sm text-muted-foreground">{filtered.length} productos</span>
          </div>

          {filtersOpen && (
            <div className="lg:hidden mb-6 bg-card border border-border rounded-xl p-4 space-y-4">
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">Categoría</h3>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="">Todos los productos</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">Ordenar por</h3>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="featured">Destacados</option>
                  <option value="price-low">Precio: Menor a mayor</option>
                  <option value="price-high">Precio: Mayor a menor</option>
                  <option value="rating">Mejor valorados</option>
                </select>
              </div>
            </div>
          )}

          <div className="hidden lg:flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">{filtered.length} productos encontrados</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No se encontraron productos con esos criterios.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
