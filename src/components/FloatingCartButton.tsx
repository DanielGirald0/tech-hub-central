import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

/** Botón de carrito flotante para móviles (esquina superior derecha). */
const FloatingCartButton = () => {
  const { totalItems } = useCart();

  return (
    <Link
      to="/cart"
      aria-label={`Carrito de compras${totalItems > 0 ? ` (${totalItems} artículos)` : ""}`}
      className="lg:hidden fixed top-[68px] right-4 z-40 inline-flex items-center justify-center w-11 h-11 rounded-full bg-foreground text-background shadow-lg border border-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center"
        >
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
};

export default FloatingCartButton;
