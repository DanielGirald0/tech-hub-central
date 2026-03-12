import { ShoppingCart as CartIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Cart = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>
      <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center">
        <CartIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Browse our products and add items to your cart.</p>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
};

export default Cart;
