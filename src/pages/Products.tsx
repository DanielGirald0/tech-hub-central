import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import BackButton from "@/components/BackButton";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Filter, Loader2, Search, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const db = supabase as any;

interface Category {
  id: string;
  name: string;
  slug: string;
}

const MAX_PRICE = 8000000;
const PAGE_SIZE = 24;

const Products = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [appliedCategory, setAppliedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [appliedType, setAppliedType] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, MAX_PRICE]);

  // Categories: cached for 10 min, rarely change
  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await db.from("categories").select("id,name,slug").eq("active", true).order("name");
      return (data as unknown as Category[]) || [];
    },
  });

  // Apply URL params once categories are loaded
  useEffect(() => {
    if (!categories.length) return;
    const categoryParam = searchParams.get("category") || "";
    if (categoryParam) {
      const matched = categories.find((cat) => cat.id === categoryParam || cat.slug === categoryParam);
      setSelectedCategory(matched?.id || "");
      setAppliedCategory(matched?.id || "");
    }
    const typeParam = searchParams.get("type") || "";
    if (["product", "service"].includes(typeParam)) {
      setSelectedType(typeParam);
      setAppliedType(typeParam);
    }
  }, [categories, searchParams]);

  // Products query: cached per filter combo, keeps previous page during transitions
  const { data: productsData, isFetching: loading } = useQuery({
    queryKey: ["products", { appliedCategory, appliedType, appliedSearch, appliedPriceRange, page }],
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async () => {
      let productIds: string[] | null = null;

      if (appliedCategory) {
        const { data: links } = await supabase
          .from("product_categories" as any)
          .select("product_id")
          .eq("category_id", appliedCategory);
        productIds = ((links as unknown as { product_id: string }[]) || []).map((l) => l.product_id);
        if (productIds.length === 0) return { products: [], totalCount: 0, inStockCount: 0 };
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const isSearching = Boolean(appliedSearch);

      let query = db
        .from("products")
        .select("*, product_categories(category_id, categories(id, name, slug))", { count: "exact" })
        .gte("final_price", appliedPriceRange[0])
        .lte("final_price", appliedPriceRange[1])
        .order("stock", { ascending: false })
        .order("name", { ascending: true })
        .range(from, to);

      if (!isSearching) query = query.gt("stock", 0);
      if (productIds) query = query.in("id", productIds);
      if (appliedType) query = query.eq("product_type", appliedType);
      if (isSearching) {
        const term = appliedSearch.replace(/[%_]/g, "");
        query = query.or(
          `name.ilike.%${term}%,description.ilike.%${term}%,full_description.ilike.%${term}%,sku.ilike.%${term}%,reference.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%`,
        );
      }

      const { data, error, count } = await query;
      if (error) return { products: [], totalCount: 0, inStockCount: 0 };

      let inStockCount = count || 0;
      if (isSearching) {
        let countQuery = db
          .from("products")
          .select("id", { count: "exact", head: true })
          .gt("stock", 0)
          .gte("final_price", appliedPriceRange[0])
          .lte("final_price", appliedPriceRange[1]);
        if (productIds) countQuery = countQuery.in("id", productIds);
        if (appliedType) countQuery = countQuery.eq("product_type", appliedType);
        const term = appliedSearch.replace(/[%_]/g, "");
        countQuery = countQuery.or(
          `name.ilike.%${term}%,description.ilike.%${term}%,full_description.ilike.%${term}%,sku.ilike.%${term}%,reference.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%`,
        );
        const { count: inStock } = await countQuery;
        inStockCount = inStock || 0;
      }

      return { products: data || [], totalCount: count || 0, inStockCount };
    },
  });

  const products = productsData?.products || [];
  const totalCount = productsData?.totalCount || 0;
  const inStockCount = productsData?.inStockCount || 0;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [appliedCategory, appliedType, appliedPriceRange, appliedSearch]);

  const activeFilters = useMemo(
    () => Boolean(selectedCategory || selectedType || searchTerm || priceRange[0] > 0 || priceRange[1] < MAX_PRICE),
    [selectedCategory, selectedType, searchTerm, priceRange],
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedType("");
    setPriceRange([0, MAX_PRICE]);
    setAppliedSearch("");
    setAppliedCategory("");
    setAppliedType("");
    setAppliedPriceRange([0, MAX_PRICE]);
  };

  const applyFilters = () => {
    setAppliedSearch(searchTerm.trim());
    setAppliedCategory(selectedCategory);
    setAppliedType(selectedType);
    setAppliedPriceRange(priceRange);
    setFiltersOpen(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const formatCOP = (value: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-foreground text-sm mb-3 uppercase tracking-wider">Categoría</h3>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="">Todas</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
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
        <Slider value={priceRange} min={0} max={MAX_PRICE} step={50000} onValueChange={(value) => setPriceRange(value as [number, number])} />
        <div className="flex items-center justify-between gap-3 mt-3 text-xs text-muted-foreground">
          <span>{formatCOP(priceRange[0])}</span>
          <span>{formatCOP(priceRange[1])}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Input type="number" min={0} value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} />
          <Input type="number" min={0} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} />
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
          Aplicar filtros
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
                {totalCount.toLocaleString("es-CO")} {totalCount === 1 ? "producto" : "productos"}
                {totalPages > 1 && ` · Pág. ${page}/${totalPages}`}
              </div>
              {appliedSearch && totalCount > 0 && (
                <div className="text-xs mt-0.5 whitespace-nowrap">
                  <span className="text-green-500">{inStockCount} disponibles</span>
                  {totalCount - inStockCount > 0 && (
                    <span className="text-destructive"> · {totalCount - inStockCount} agotados</span>
                  )}
                </div>
              )}
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
              {totalPages > 1 && (
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
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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
