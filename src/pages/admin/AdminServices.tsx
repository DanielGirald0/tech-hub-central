import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusOptions = ["pendiente", "en progreso", "completado", "cancelado"];

const statusColors: Record<string, string> = {
  pendiente: "bg-yellow-500/20 text-yellow-400",
  "en progreso": "bg-blue-500/20 text-blue-400",
  completado: "bg-green-500/20 text-green-400",
  cancelado: "bg-red-500/20 text-red-400",
};

const AdminServices = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { toast } = useToast();

  const load = () =>
    supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRequests(data || []));

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
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Teléfono</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Servicio</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Equipo</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <>
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer"
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  >
                    <td className="p-3">
                      <div className="text-foreground font-medium">{r.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.email || ""}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.phone || "—"}</td>
                    <td className="p-3 text-foreground">{r.service_name || r.service_type}</td>
                    <td className="p-3 text-muted-foreground">{r.device_type || "—"}</td>
                    <td className="p-3">
                      <select
                        value={r.status}
                        onChange={(e) => { e.stopPropagation(); updateStatus(r.id, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer ${statusColors[r.status] || "bg-secondary text-foreground"}`}
                      >
                        {statusOptions.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString("es-CO")}</td>
                  </tr>
                  {expanded === r.id && (
                    <tr key={`${r.id}-detail`} className="border-b border-border/50">
                      <td colSpan={6} className="p-4 bg-secondary/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Dirección:</span>
                            <p className="text-foreground">{r.address || "No proporcionada"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Descripción del problema:</span>
                            <p className="text-foreground">{r.message || r.description || "Sin descripción"}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {requests.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay solicitudes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminServices;
