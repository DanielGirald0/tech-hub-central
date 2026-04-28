import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ShoppingCart, Loader2, Package, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";

const formatCOP = (price: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("products").select("*").eq("id", id!).gt("stock", 0).maybeSingle();
      setProduct(data);
      if (data) {
        const { data: rel } = await supabase
          .from("products")
          .select("*")
          .eq("category", data.category)
          .gt("stock", 0)
          .neq("id", data.id)
          .limit(4);
        setRelated(rel || []);
      }
      setLoading(false);
    };
    if (id) fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground text-lg">Producto no encontrado.</p>
        <Link to="/products" className="text-primary underline mt-4 inline-block">Volver a productos</Link>
      </div>
    );
  }

  const image = product.image_url || "/placeholder.svg";
  const originalPrice = product.original_price;
  const inStock = product.stock > 0;
  const displayPrice = product.final_price ?? product.price;
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;
  const specs: { label: string; value: string }[] = Array.isArray(product.specifications) ? product.specifications : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-foreground transition-colors">Productos</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?category=${product.category}`} className="hover:text-foreground transition-colors">{product.category}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-8 mb-16">
        {/* Image */}
        <div className="bg-secondary rounded-2xl overflow-hidden aspect-square relative">
          <img src={image} alt={product.name} className="w-full h-full object-cover" />
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-lg">-{discount}%</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.brand && <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>}
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? "text-warning fill-warning" : "text-muted"}`} />
            ))}
            <span className="text-sm text-muted-foreground ml-2">{product.rating ?? 0} / 5</span>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="font-display font-bold text-3xl text-primary">{formatCOP(displayPrice)}</span>
            {originalPrice && originalPrice > displayPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatCOP(originalPrice)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground -mt-4 mb-6">Precio incluye IVA</p>

          <div className="flex items-center gap-2 mb-6">
            <Package className="w-4 h-4 text-muted-foreground" />
            {inStock ? (
              <span className="text-sm text-green-500 font-medium">{product.stock} unidades disponibles</span>
            ) : (
              <span className="text-sm text-destructive font-medium">Agotado</span>
            )}
          </div>

          {product.description && (
            <div className="mb-6">
              <h2 className="font-display font-semibold text-foreground mb-2">Descripción</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Specifications */}
          <div className="mb-6">
            <h2 className="font-display font-semibold text-foreground mb-2">Especificaciones</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary rounded-lg px-4 py-2.5">
                <span className="text-muted-foreground">Categoría</span>
                <p className="font-medium text-foreground">{product.category}</p>
              </div>
              {product.subcategory && (
                <div className="bg-secondary rounded-lg px-4 py-2.5">
                  <span className="text-muted-foreground">Subcategoría</span>
                  <p className="font-medium text-foreground">{product.subcategory}</p>
                </div>
              )}
              {product.brand && (
                <div className="bg-secondary rounded-lg px-4 py-2.5">
                  <span className="text-muted-foreground">Marca</span>
                  <p className="font-medium text-foreground">{product.brand}</p>
                </div>
              )}
              {(product.reference || product.sku) && (
                <div className="bg-secondary rounded-lg px-4 py-2.5">
                  <span className="text-muted-foreground">Referencia</span>
                  <p className="font-medium text-foreground">{product.reference || product.sku}</p>
                </div>
              )}
              <div className="bg-secondary rounded-lg px-4 py-2.5">
                <span className="text-muted-foreground">Stock</span>
                <p className="font-medium text-foreground">{product.stock}</p>
              </div>
              {specs.map((spec, i) => (
                <div key={i} className="bg-secondary rounded-lg px-4 py-2.5">
                  <span className="text-muted-foreground">{spec.label}</span>
                  <p className="font-medium text-foreground">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            disabled={!inStock}
            onClick={() => addItem({ id: product.id, name: product.name, price: displayPrice, image })}
            className="w-full mt-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Agregar al carrito
          </Button>
        </div>
      </div>

      {/* Full description */}
      {product.full_description && (
        <section className="mb-16">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Descripción completa</h2>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.full_description}</p>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold text-foreground mb-5">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
