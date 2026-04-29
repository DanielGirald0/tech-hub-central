import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle2, AlertCircle, Clock, ChevronDown } from "lucide-react";

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  message: string | null;
  items_synced: number | null;
  items_failed: number | null;
  items_processed?: number | null;
  duration_ms?: number | null;
  error_detail?: string | null;
  technical_details?: {
    failed_products?: Array<{ reference?: string; name?: string; reason?: string; timestamp?: string }>;
    total?: number;
    synced?: number;
    failed?: number;
    error?: string;
  } | null;
  started_at: string;
  finished_at: string | null;
}

const statusLabel = (status: string) => {
  const normalized = status.toLowerCase();
  if (["success", "completed", "complete"].includes(normalized)) return "Completado";
  if (normalized === "partial") return "Parcial";
  if (normalized === "running") return "En proceso";
  if (normalized === "error") return "Error";
  return status;
};

const formatDuration = (ms?: number | null) => {
  if (!ms) return "—";
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.round(ms / 1000);
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
};

const failedProductsFromLog = (log: SyncLog) => log.technical_details?.failed_products || [];

const AdminAlegra = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
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
        toast({ title: "Sincronización completada correctamente", description: `${(data as any).synced} productos sincronizados.` });
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
  const lastSuccessfulSync = logs.find((log) => ["success", "completed", "complete"].includes(log.status.toLowerCase()));
  const lastError = logs.find((log) => log.status === "error" || log.status === "partial");
  const statusIcon = (s: string) => {
    const normalized = s.toLowerCase();
    if (["success", "completed", "complete"].includes(normalized)) return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (normalized === "error") return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (normalized === "running") return <Clock className="w-4 h-4 text-primary animate-pulse" />;
    return <AlertCircle className="w-4 h-4 text-warning" />;
  };
  const rowClass = (s: string) => {
    const normalized = s.toLowerCase();
    if (["success", "completed", "complete"].includes(normalized)) return "bg-success/5";
    if (normalized === "error") return "bg-destructive/10";
    if (normalized === "partial") return "bg-warning/10";
    return "";
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
            <p className="font-display text-lg text-foreground">{lastSync ? statusLabel(lastSync.status) : "—"}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Productos sincronizados</p>
          <p className="font-display text-lg text-foreground">{lastSync?.items_synced ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Última sincronización exitosa</p>
          <p className="text-sm text-foreground">{lastSuccessfulSync ? new Date(lastSuccessfulSync.started_at).toLocaleString("es-CO") : "Sin registros exitosos"}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Último error</p>
          <p className="text-sm text-foreground line-clamp-2">{lastError?.message || "Sin errores recientes"}</p>
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
              <th className="text-right p-3 text-muted-foreground font-medium">Tiempo</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Mensaje</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <Fragment key={l.id}>
                  <tr className={`border-b border-border/50 ${rowClass(l.status)}`}>
                    <td className="p-3 text-foreground text-xs whitespace-nowrap">{new Date(l.started_at).toLocaleString("es-CO")}</td>
                    <td className="p-3 text-foreground">{l.sync_type}</td>
                    <td className="p-3"><div className="flex items-center gap-2 whitespace-nowrap">{statusIcon(l.status)}<span>{statusLabel(l.status)}</span></div></td>
                    <td className="p-3 text-right text-foreground">{l.items_synced ?? 0}</td>
                    <td className="p-3 text-right text-foreground">{l.items_failed ?? 0}</td>
                    <td className="p-3 text-right text-foreground whitespace-nowrap">{formatDuration(l.duration_ms)}</td>
                    <td className="p-3 text-muted-foreground text-xs max-w-lg">
                      <div className="flex items-start gap-2">
                        <span className="whitespace-normal">{l.message || "—"}</span>
                        {l.error_detail && <button onClick={() => setExpandedLogId(expandedLogId === l.id ? null : l.id)} className="shrink-0 text-primary hover:text-primary/80" aria-label="Ver detalles"><ChevronDown className={`w-4 h-4 transition-transform ${expandedLogId === l.id ? "rotate-180" : ""}`} /></button>}
                      </div>
                    </td>
                  </tr>
                  {expandedLogId === l.id && l.error_detail && (
                    <tr className="border-b border-border/50 bg-secondary/40">
                      <td colSpan={7} className="p-4 text-xs text-muted-foreground whitespace-pre-wrap break-words">{l.error_detail}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {logs.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sin sincronizaciones aún.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAlegra;