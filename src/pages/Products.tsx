import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { products, categories } from "@/data/products";
import { Button } from "@/components/ui/button";

const Products = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceRange] = useState<[number, number]>([0, 10000000]);
  const [sortBy, setSortBy] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    return result;
  }, [selectedCategory, priceRange, sortBy]);

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
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${!selectedCategory ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Todos los productos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${selectedCategory === cat.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-foreground text-sm mb-3">Ordenar por</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
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
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Todos los productos</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">Ordenar por</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
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

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filtered.length === 0 && (
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
