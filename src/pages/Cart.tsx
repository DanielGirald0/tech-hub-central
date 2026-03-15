import { ShoppingCart as CartIcon, Trash2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

const formatCOP = (price: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">Carrito de compras</h1>
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
          <CartIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6">Explora nuestros productos y agrega artículos a tu carrito.</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/products">Seguir comprando</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Carrito de compras</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex gap-4 items-center">
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-secondary" />
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground text-sm truncate">{item.name}</h3>
                <p className="text-primary font-bold mt-1">{formatCOP(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-medium text-foreground w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-bold text-foreground w-28 text-right hidden sm:block">{formatCOP(item.price * item.quantity)}</p>
              <button onClick={() => removeItem(item.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={clearCart} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
            Vaciar carrito
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 h-fit sticky top-24">
          <h2 className="font-display font-semibold text-foreground mb-4">Resumen del pedido</h2>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCOP(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Envío</span>
              <span>Por calcular</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary">{formatCOP(totalPrice)}</span>
            </div>
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              const msg = items.map((i) => `• ${i.name} x${i.quantity} - ${formatCOP(i.price * i.quantity)}`).join("\n");
              const text = encodeURIComponent(`Hola, quiero realizar un pedido:\n\n${msg}\n\nTotal: ${formatCOP(totalPrice)}`);
              window.open(`https://wa.me/573107476909?text=${text}`, "_blank");
            }}
          >
            Realizar pedido por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
