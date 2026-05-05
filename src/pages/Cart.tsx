import { ShoppingCart as CartIcon, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const formatCOP = (price: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    documentType: "CC" as "CC" | "NIT",
    documentNumber: "",
    invoiceType: "normal" as "normal" | "electronica",
    deliveryType: "tienda" as "tienda" | "domicilio",
  });

  const DELIVERY_COST = 10000;
  const deliveryCost = form.deliveryType === "domicilio" ? DELIVERY_COST : 0;
  const grandTotal = totalPrice + deliveryCost;

  const handleCheckout = async () => {
    if (!form.name || !form.email || !form.documentNumber || !form.phone) {
      toast({ title: "Datos incompletos", description: "Nombre, email, teléfono y número de documento son requeridos", variant: "destructive" });
      return;
    }
    if (form.deliveryType === "domicilio" && !form.address.trim()) {
      toast({ title: "Dirección requerida", description: "Ingresa la dirección de entrega para domicilio", variant: "destructive" });
      return;
    }
    if (!/^\d{5,15}$/.test(form.documentNumber.trim())) {
      toast({ title: "Documento inválido", description: "Ingresa un número de documento válido (solo dígitos)", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("alegra-create-order", {
        body: {
          customer: form,
          items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          delivery: { type: form.deliveryType, cost: deliveryCost },
        },
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Error al crear pedido");

      const msg = items.map((i) => `• ${i.name} x${i.quantity} - ${formatCOP(i.price * i.quantity)}`).join("\n");
      const invoiceLine = result.alegra_invoice_number ? `\nFactura Alegra: ${result.alegra_invoice_number}` : "";
      const deliveryLine = form.deliveryType === "domicilio" ? `\nDomicilio: ${formatCOP(deliveryCost)}` : "\nEntrega: Recoger en tienda";
      const text = encodeURIComponent(
        `Hola, acabo de realizar un pedido:\n\nNombre: ${form.name}\nEmail: ${form.email}\nTeléfono: ${form.phone}${deliveryLine}\n\n${msg}\n\nSubtotal: ${formatCOP(totalPrice)}\nTotal: ${formatCOP(grandTotal)}${invoiceLine}`
      );
      toast({ title: "Pedido creado", description: result.alegra_invoice_number ? `Factura ${result.alegra_invoice_number}` : "Pedido registrado" });
      clearCart();
      setOpen(false);
      window.open(`https://wa.me/573107476909?text=${text}`, "_blank");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo procesar el pedido", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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
              <span>Domicilio</span>
              <span>{form.deliveryType === "domicilio" ? formatCOP(deliveryCost) : "—"}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary">{formatCOP(grandTotal)}</span>
            </div>
          </div>
          <div className="mb-4">
            <Label className="mb-2 block">Tipo de entrega</Label>
            <RadioGroup
              value={form.deliveryType}
              onValueChange={(v: "tienda" | "domicilio") => setForm({ ...form, deliveryType: v })}
              className="gap-2"
            >
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <RadioGroupItem value="tienda" id="dt-tienda" />
                <span>Recoger en tienda</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <RadioGroupItem value="domicilio" id="dt-domicilio" />
                <span>Domicilio (+{formatCOP(DELIVERY_COST)})</span>
              </label>
            </RadioGroup>
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              setForm((f) => ({ ...f, email: user?.email || f.email }));
              setOpen(true);
            }}
          >
            Realizar pedido
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Datos para el pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Nombre completo *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="documentType">Tipo de documento *</Label>
                <Select value={form.documentType} onValueChange={(v: "CC" | "NIT") => setForm({ ...form, documentType: v })}>
                  <SelectTrigger id="documentType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentNumber">Número de documento *</Label>
                <Input id="documentNumber" inputMode="numeric" value={form.documentNumber}
                  onChange={(e) => setForm({ ...form, documentNumber: e.target.value.replace(/\D/g, "") })} />
              </div>
            </div>
            <div>
              <Label htmlFor="invoiceType">Tipo de factura *</Label>
              <Select value={form.invoiceType} onValueChange={(v: "normal" | "electronica") => setForm({ ...form, invoiceType: v })}>
                <SelectTrigger id="invoiceType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Factura normal</SelectItem>
                  <SelectItem value="electronica">Factura electrónica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button onClick={handleCheckout} disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar y enviar a WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
