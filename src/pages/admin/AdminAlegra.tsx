import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  message: string | null;
  items_synced: number | null;
  items_failed: number | null;
  started_at: string;
  finished_at: string | null;
}

const AdminAlegra = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const loadLogs = async () => {
    const { data } = await supabase
      .from("alegra_sync_log" as any)
      .select("*")
      .order("started_at", { ascending: false })
      .limit(20);
    setLogs((data as any) || []);
  };

  useEffect(() => { loadLogs(); }, []);

  const runSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("alegra-sync-products");
      if (error) throw error;
      if ((data as any)?.success) {
        toast({ title: "Sincronización completa", description: `${(data as any).synced} productos sincronizados.` });
      } else {
        toast({ title: "Error en sincronización", description: (data as any)?.error || "Error desconocido", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo sincronizar", variant: "destructive" });
    } finally {
      setSyncing(false);
      loadLogs();
    }
  };

  const lastSync = logs[0];
  const statusIcon = (s: string) => {
    if (s === "success") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (s === "error") return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (s === "running") return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
    return <AlertCircle className="w-4 h-4 text-orange-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Alegra Sync</h1>
          <p className="text-sm text-muted-foreground">Sincronización de productos e inventario con Alegra</p>
        </div>
        <Button onClick={runSync} disabled={syncing} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Sincronizando..." : "Sincronizar ahora"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Última sincronización</p>
          <p className="font-display text-lg text-foreground">
            {lastSync ? new Date(lastSync.started_at).toLocaleString("es-CO") : "Nunca"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Estado</p>
          <div className="flex items-center gap-2">
            {lastSync && statusIcon(lastSync.status)}
            <p className="font-display text-lg text-foreground capitalize">{lastSync?.status || "—"}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Productos sincronizados</p>
          <p className="font-display text-lg text-foreground">{lastSync?.items_synced ?? 0}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="font-display font-semibold text-foreground">Historial</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Tipo</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Sincronizados</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Fallidos</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Mensaje</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="p-3 text-foreground text-xs">{new Date(l.started_at).toLocaleString("es-CO")}</td>
                  <td className="p-3 text-foreground">{l.sync_type}</td>
                  <td className="p-3"><div className="flex items-center gap-2">{statusIcon(l.status)}<span className="capitalize">{l.status}</span></div></td>
                  <td className="p-3 text-right text-foreground">{l.items_synced ?? 0}</td>
                  <td className="p-3 text-right text-foreground">{l.items_failed ?? 0}</td>
                  <td className="p-3 text-muted-foreground text-xs max-w-md truncate">{l.message || "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin sincronizaciones aún.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAlegra;