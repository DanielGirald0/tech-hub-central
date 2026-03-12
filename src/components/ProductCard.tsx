import { ShoppingCart, Heart } from "lucide-react";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
}

const formatCOP = (price: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);

const ProductCard = ({ product }: ProductCardProps) => {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
            -{discount}%
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-foreground font-display font-semibold text-sm bg-secondary px-3 py-1 rounded-md">Agotado</span>
          </div>
        )}
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card">
          <Heart className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
        <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-xs ${i < Math.floor(product.rating) ? "text-warning" : "text-muted"}`}>★</span>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{product.rating}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="font-display font-bold text-lg text-primary">{formatCOP(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through ml-2">{formatCOP(product.originalPrice)}</span>
            )}
          </div>
          <Button
            size="sm"
            disabled={!product.inStock}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 p-0"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
