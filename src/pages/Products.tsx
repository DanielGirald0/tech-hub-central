import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import BackButton from "@/components/BackButton";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Filter, Loader2, Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SEO from "@/components/SEO";
import FloatingCartButton from "@/components/FloatingCartButton";
import { listProducts } from "@/lib/alegra-catalog";

const MAX_PRICE = 5000000;
const PAGE_SIZE = 20;

const Products = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [appliedType, setAppliedType] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, MAX_PRICE]);

  // Apply URL params once
  useEffect(() => {
    const typeParam = searchParams.get("type") || "";
    if (["product", "service"].includes(typeParam)) {
      setSelectedType(typeParam);
      setAppliedType(typeParam);
    }
  }, [searchParams]);

  // Products query: cached per filter combo, keeps previous page during transitions
  const { data: productsData, isFetching: loading } = useQuery({
    queryKey: ["catalog", { appliedType, appliedSearch, appliedPriceRange, page }],
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: () =>
      listProducts({
        page,
        pageSize: PAGE_SIZE,
        type: (appliedType || undefined) as "product" | "service" | undefined,
        search: appliedSearch || undefined,
        minPrice: appliedPriceRange[0],
        maxPrice: appliedPriceRange[1],
        // Hide out-of-stock in catalog, show them when user searches explicitly
        inStockOnly: !appliedSearch,
      }),
  });

  const products = productsData?.items || [];
  // Fallback: si llenó la página completa, asumimos que hay más aunque el backend no lo indique.
  const hasMore = Boolean(productsData?.hasMore) || (productsData?.items?.length ?? 0) >= PAGE_SIZE;
  const pageCount = products.length;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [appliedType, appliedPriceRange, appliedSearch]);

  const activeFilters = useMemo(
    () => Boolean(selectedType || searchTerm || priceRange[0] > 0 || priceRange[1] < MAX_PRICE),
    [selectedType, searchTerm, priceRange],
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setPriceRange([0, MAX_PRICE]);
    setAppliedSearch("");
    setAppliedType("");
    setAppliedPriceRange([0, MAX_PRICE]);
  };

  const applyFilters = () => {
    setAppliedSearch(searchTerm.trim());
    setAppliedType(selectedType);
    setAppliedPriceRange(priceRange);
    setFiltersOpen(false);
  };

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-foreground text-sm mb-3 uppercase tracking-wider">Tipo</h3>
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="">Todos</option>
          <option value="product">Producto</option>
          <option value="service">Servicio</option>
        </select>
      </div>
      <div>
        <h3 className="font-display font-semibold text-foreground text-sm mb-3 uppercase tracking-wider">Precio</h3>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" min={0} value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} placeholder="Mínimo" />
          <Input type="number" min={0} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} placeholder="Máximo" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Button size="sm" onClick={applyFilters} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Aplicar filtros
        </Button>
        {activeFilters && (
          <Button variant="outline" size="sm" onClick={resetFilters} className="w-full border-border text-foreground">
            <X className="w-4 h-4 mr-2" />Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <FloatingCartButton />
      <SEO
        title="Productos | Tecno Gz"
        description="Catálogo completo de tecnología, computadores, accesorios y equipos de seguridad. Precios en COP, envío en Rionegro y Antioquia."
        path="/products"
      />
      <BackButton />
      <h1 className="font-display text-3xl font-bold text-foreground mb-2 uppercase tracking-wider">Productos</h1>
      <p className="text-muted-foreground mb-6">Explora nuestro catálogo: convertidores, adaptadores, todo tipo de cables, accesorios y mucho más.</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, SKU o descripción" className="pl-10 h-11" />
        </div>
        <Button onClick={applyFilters} className="bg-primary text-primary-foreground hover:bg-primary/90 h-11">
          Buscar
        </Button>
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-card border border-border rounded-xl p-5"><Filters /></div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="border-border text-foreground lg:hidden">
              <Filter className="w-4 h-4 mr-2" /> Filtros
            </Button>
            <div className="text-sm text-muted-foreground ml-auto text-right min-w-0">
              <div className="whitespace-nowrap">
                {pageCount} {pageCount === 1 ? "producto" : "productos"} · Pág. {page}
              </div>
            </div>
          </div>

          {filtersOpen && <div className="lg:hidden mb-6 bg-card border border-border rounded-xl p-4"><Filters /></div>}

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
              {(page > 1 || hasMore) && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="border-border text-foreground"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Página {page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMore || loading}
                    onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="border-border text-foreground"
                  >
                    Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">No se encontraron productos con esos criterios.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
