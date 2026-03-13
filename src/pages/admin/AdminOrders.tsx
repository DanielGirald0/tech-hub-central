import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusOptions = ["pendiente", "procesando", "enviado", "completado", "cancelado"];

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const { toast } = useToast();

  const load = () => supabase.from("orders").select("*, profiles!orders_customer_id_fkey(name, email)").order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
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
              <th className="text-right p-3 text-muted-foreground font-medium">Total</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
            </tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-foreground font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="p-3 text-foreground">{(o as any).profiles?.name || (o as any).profiles?.email || "—"}</td>
                  <td className="p-3 text-right text-foreground">{formatCOP(o.total_price)}</td>
                  <td className="p-3">
                    <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground">
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("es-CO")}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay pedidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
