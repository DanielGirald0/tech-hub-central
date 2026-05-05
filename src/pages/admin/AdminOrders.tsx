import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusOptions = ["pendiente de pago", "en proceso", "recibido", "completado", "cancelado"];

const statusColors: Record<string, string> = {
  "pendiente de pago": "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  "en proceso": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  recibido: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  completado: "bg-green-500/20 text-green-300 border border-green-500/30",
  cancelado: "bg-red-500/20 text-red-300 border border-red-500/30",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const { toast } = useToast();

  const load = () =>
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data || []));
  useEffect(() => { load(); }, []);

  const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", variant: "destructive" });
    else { toast({ title: "Estado actualizado" }); load(); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Gestión de Pedidos</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium">ID</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Cliente</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Entrega</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Total</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
            </tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-foreground font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="p-3 text-foreground">
                    <div>{o.customer_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_email || ""}</div>
                  </td>
                  <td className="p-3 text-muted-foreground capitalize text-xs">{o.delivery_type === "domicilio" ? "Domicilio" : "Recoger en tienda"}</td>
                  <td className="p-3 text-right text-foreground">{formatCOP(o.total_price)}</td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer appearance-none ${statusColors[o.status] || "bg-secondary text-foreground border border-border"}`}
                      style={{ colorScheme: "dark" }}
                    >
                      {statusOptions.map((s) => <option key={s} value={s} className="bg-card text-foreground">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("es-CO")}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay pedidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
