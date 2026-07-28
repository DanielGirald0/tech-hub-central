import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ShoppingCart, Loader2, Package, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { openInquireWhatsApp } from "@/lib/inquire";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import SEO from "@/components/SEO";
import { getProduct, listProducts, type CatalogProduct } from "@/lib/alegra-catalog";

const formatCOP = (price: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { settings } = useStoreSettings();
  const showPrices = settings.show_prices;
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [related, setRelated] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await getProduct(id!).catch(() => null);
      setProduct(data);
      if (data && data.category_id) {
        const rel = await listProducts({
          category: data.category_id,
          pageSize: 5,
          page: 1,
          inStockOnly: true,
        }).catch(() => ({ items: [] as CatalogProduct[] }));
        setRelated(rel.items.filter((p) => p.id !== data.id).slice(0, 4));
      } else {
        setRelated([]);
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
      <BackButton />
        <p className="text-muted-foreground text-lg">Producto no encontrado.</p>
        <Link to="/products" className="text-primary underline mt-4 inline-block">Volver a productos</Link>
      </div>
    );
  }

  const image = product.image_url || "/placeholder.svg";
  const originalPrice = product.original_price;
  const inStock = product.inStock;
  const displayPrice = product.final_price ?? product.price;
  const reference = product.reference;
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={(() => {
          const suffix = " | Tecno Gz";
          const max = 60;
          const name = product.name.length > max - suffix.length
            ? product.name.slice(0, max - suffix.length - 1).trimEnd() + "…"
            : product.name;
          return `${name}${suffix}`;
        })()}
        description={(product.description || `Compra ${product.name} en Tecno Gz. Envío en Rionegro y Antioquia.`).slice(0, 160)}
        path={`/products/${product.id}`}
        type="product"
        image={product.image_url || undefined}
        jsonLd={showPrices ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || undefined,
          image: product.image_url || undefined,
          sku: reference || undefined,
          brand: product.brand || undefined,
          offers: {
            "@type": "Offer",
            priceCurrency: "COP",
            price: displayPrice,
            availability: inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        } : {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || undefined,
          image: product.image_url || undefined,
          sku: reference || undefined,
          brand: product.brand || undefined,
        }}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-foreground transition-colors">Productos</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?category=${product.category_id || product.category}`} className="hover:text-foreground transition-colors">{product.category || "Categoría"}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-8 mb-16">
        {/* Image */}
        <div className="bg-gradient-to-br from-secondary via-secondary to-background rounded-2xl overflow-hidden aspect-square relative p-6">
          <img src={image} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-contain" />
          {showPrices && discount > 0 && (
            <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-lg">-{discount}%</span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.brand && <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>}
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

          {showPrices ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-3 mb-6">
                <span className="font-display font-bold text-3xl text-primary leading-tight">{formatCOP(displayPrice)}</span>
                {reference && (
                  <span className="text-xs sm:text-sm text-muted-foreground/80 leading-6 sm:pb-0.5">Ref: {reference}</span>
                )}
                {originalPrice && originalPrice > displayPrice && (
                  <span className="text-lg text-muted-foreground line-through sm:pb-0.5">{formatCOP(originalPrice)}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground -mt-4 mb-6">Precio incluye IVA</p>
            </>
          ) : (
            <div className="mb-6">
              {reference && (
                <p className="text-xs sm:text-sm text-muted-foreground/80 mb-2">Ref: {reference}</p>
              )}
              <p className="text-sm text-muted-foreground">Consulta el precio actualizado por WhatsApp.</p>
            </div>
          )}

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
              {product.brand && (
                <div className="bg-secondary rounded-lg px-4 py-2.5">
                  <span className="text-muted-foreground">Marca</span>
                  <p className="font-medium text-foreground">{product.brand}</p>
                </div>
              )}
              {reference && (
                <div className="bg-secondary rounded-lg px-4 py-2.5">
                  <span className="text-muted-foreground">Referencia</span>
                  <p className="font-medium text-foreground">{reference}</p>
                </div>
              )}
              <div className="bg-secondary rounded-lg px-4 py-2.5">
                <span className="text-muted-foreground">Stock</span>
                <p className="font-medium text-foreground">{product.stock}</p>
              </div>
            </div>
          </div>

          {showPrices ? (
            <Button
              size="lg"
              disabled={!inStock}
              onClick={() => addItem({ id: product.id, name: product.name, price: displayPrice, image })}
              className="w-full mt-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Agregar al carrito
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => openInquireWhatsApp({ id: product.id, name: product.name, reference })}
              className="w-full mt-auto text-white hover:opacity-90"
              style={{ background: "#25D366" }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Consultar precio
            </Button>
          )}
        </div>
      </div>

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
