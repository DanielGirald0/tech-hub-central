import { memo } from "react";
import { ShoppingCart, Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { openInquireWhatsApp } from "@/lib/inquire";

interface ProductCardProduct {
  id: string;
  name: string;
  category?: string;
  price: number;
  final_price?: number | null;
  originalPrice?: number | null;
  original_price?: number | null;
  image?: string;
  image_url?: string | null;
  brand?: string | null;
  reference?: string | null;
  sku?: string | null;
  inStock?: boolean;
  stock?: number;
}

interface ProductCardProps {
  product: ProductCardProduct;
}

const formatCOP = (price: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCart();
  const { settings } = useStoreSettings();
  const showPrices = settings.show_prices;

  const image = product.image || product.image_url || "/placeholder.svg";
  const originalPrice = product.originalPrice ?? product.original_price;
  const inStock = product.inStock ?? (product.stock !== undefined ? product.stock > 0 : true);
  const brand = product.brand ?? "";
  const displayPrice = product.final_price ?? product.price;
  const reference = product.reference || product.sku;

  const discount = originalPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: displayPrice, image });
  };

  const handleInquire = (e: React.MouseEvent) => {
    e.preventDefault();
    openInquireWhatsApp({ id: product.id, name: product.name, reference });
  };

  return (
    <Link to={`/products/${product.id}`} className="group bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1 block">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary via-secondary to-background p-3">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          width={400}
          height={300}
        />
        {showPrices && discount > 0 && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">-{discount}%</span>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-foreground font-display font-semibold text-sm bg-secondary px-3 py-1 rounded-md">Agotado</span>
          </div>
        )}
        <button
          aria-label={`Añadir ${product.name} a favoritos`}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
        >
          <Heart className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" aria-hidden="true" />
        </button>
      </div>
      <div className="p-4">
        {brand && <p className="text-xs text-muted-foreground mb-1">{brand}</p>}
        <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">{product.name}</h3>
        {showPrices ? (
          <div className="flex items-end justify-between mt-3">
            <div className="min-w-0 pr-2">
              <span className="block font-display font-bold text-lg text-primary leading-tight">{formatCOP(displayPrice)}</span>
              {reference && (
                <span className="block text-[11px] text-muted-foreground/80 leading-snug truncate">Ref: {reference}</span>
              )}
              {originalPrice && originalPrice > displayPrice && (
                <span className="block text-xs text-muted-foreground line-through mt-0.5">{formatCOP(originalPrice)}</span>
              )}
            </div>
            <Button
              size="sm"
              disabled={!inStock}
              onClick={(e) => { e.preventDefault(); handleAdd(); }}
              aria-label={inStock ? `Agregar ${product.name} al carrito` : `${product.name} agotado`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
            >
              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {reference && (
              <span className="block text-[11px] text-muted-foreground/80 leading-snug truncate">Ref: {reference}</span>
            )}
            <Button size="sm" onClick={handleInquire} className="w-full text-white hover:opacity-90" style={{ background: "#25D366" }}>
              <MessageCircle className="w-4 h-4 mr-1" />
              Consultar precio
            </Button>
          </div>
        )}
      </div>
    </Link>
  );
};

export default memo(ProductCard);
