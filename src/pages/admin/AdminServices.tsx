import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusOptions = ["pendiente", "en progreso", "completado", "cancelado"];

const AdminServices = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const { toast } = useToast();

  const load = () => supabase.from("service_requests").select("*, profiles!service_requests_customer_id_fkey(name, email)").order("created_at", { ascending: false }).then(({ data }) => setRequests(data || []));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("service_requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", variant: "destructive" });
    else { toast({ title: "Estado actualizado" }); load(); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Solicitudes de Servicio</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium">Cliente</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Servicio</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Dispositivo</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
            </tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-foreground">{(r as any).profiles?.name || (r as any).profiles?.email || "—"}</td>
                  <td className="p-3 text-foreground">{r.service_type}</td>
                  <td className="p-3 text-muted-foreground">{r.device_type || "—"}</td>
                  <td className="p-3">
                    <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)} className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground">
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString("es-CO")}</td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay solicitudes.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminServices;
