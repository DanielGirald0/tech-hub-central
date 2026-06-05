import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Package, CheckCircle2, LogIn } from "lucide-react";
import { REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, formatCOP, formatDate, formatDateTime, RepairStatus } from "@/lib/repairs";
import { useAuth } from "@/contexts/AuthContext";
import RegisterCTAModal from "@/components/RegisterCTAModal";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderResult {
  id?: string;
  order_number: string;
  status: RepairStatus;
  received_at: string;
  estimated_date: string | null;
  delivered_at: string | null;
  cost: number;
  warranty_days: number;
  reported_issue: string;
  diagnosis: string;
  device_type: string;
  brand: string;
  model: string;
  customer_name: string;
}

interface HistoryRow {
  from_status: RepairStatus | null;
  to_status: RepairStatus;
  note: string;
  created_at: string;
}

const TrackRepair = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showCTA, setShowCTA] = useState(false);
  const [approving, setApproving] = useState(false);
  const [params] = useSearchParams();

  useEffect(() => {
    const q = params.get("q");
    if (q) setOrderNumber(q);
  }, [params]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    setHistory([]);
    const [{ data: orderData, error: orderErr }, { data: histData }] = await Promise.all([
      (supabase.rpc as any)("lookup_repair_order", { _order_number: orderNumber.trim(), _phone: phone.trim() }),
      (supabase.rpc as any)("get_repair_order_history", { _order_number: orderNumber.trim(), _phone: phone.trim() }),
    ]);
    setLoading(false);
    if (orderErr || !orderData || (Array.isArray(orderData) && orderData.length === 0)) {
      setError("No encontramos ninguna orden con esos datos. Verifica el número y el teléfono.");
      return;
    }
    const o = Array.isArray(orderData) ? orderData[0] : orderData;
    setOrder(o as OrderResult);
    setHistory((histData as HistoryRow[]) || []);
    if (!user) {
      setTimeout(() => setShowCTA(true), 800);
    }
  };

  const approve = async () => {
    if (!order?.id) return;
    setApproving(true);
    const { error } = await (supabase.rpc as any)("approve_repair_order", { _order_id: order.id });
    setApproving(false);
    if (error) {
      toast({ title: "No se pudo aprobar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "¡Aprobado!", description: "Has aprobado la reparación correctamente." });
    // refresh
    const [{ data: orderData }, { data: histData }] = await Promise.all([
      (supabase.rpc as any)("lookup_repair_order", { _order_number: orderNumber.trim(), _phone: phone.trim() }),
      (supabase.rpc as any)("get_repair_order_history", { _order_number: orderNumber.trim(), _phone: phone.trim() }),
    ]);
    const o = Array.isArray(orderData) ? orderData[0] : orderData;
    if (o) setOrder({ ...(o as OrderResult), id: order.id });
    setHistory((histData as HistoryRow[]) || []);
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <SEO
        title="Seguimiento de Reparación | Tecno Gz"
        description="Consulta el estado de tu orden de servicio técnico con tu número de orden y teléfono."
        path="/seguimiento"
      />
      <BackButton />
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground uppercase tracking-wider mb-2">
          Seguimiento de Orden
        </h1>
        <p className="text-muted-foreground">Consulta el estado de tu reparación en tiempo real.</p>
      </div>

      <form onSubmit={search} className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Número de orden</label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="OS-2026-0001"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Teléfono registrado</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="3001234567"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full md:w-auto bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Consultar
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-md p-4 text-sm">{error}</div>
      )}

      {loading && !order && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <Skeleton className="h-8 w-40" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}><Skeleton className="h-3 w-16 mb-2" /><Skeleton className="h-5 w-24" /></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && !order && !error && (
        <div className="text-center text-muted-foreground text-sm py-6">
          Ingresa el número de tu orden y el teléfono registrado para ver el estado.
        </div>
      )}

      {order && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-xs uppercase text-muted-foreground tracking-wider">Orden</div>
                <div className="font-display text-2xl font-bold text-foreground">{order.order_number}</div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${REPAIR_STATUS_COLOR[order.status]}`}>
                {REPAIR_STATUS_LABEL[order.status]}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Info label="Cliente" value={order.customer_name} />
              <Info label="Equipo" value={`${order.device_type} ${order.brand} ${order.model}`.trim()} />
              <Info label="Ingreso" value={formatDate(order.received_at)} />
              <Info label="Entrega estimada" value={formatDate(order.estimated_date)} />
              <Info label="Costo" value={formatCOP(Number(order.cost))} />
              <Info label="Garantía" value={order.warranty_days ? `${order.warranty_days} días` : "—"} />
              <Info label="Entregado" value={formatDate(order.delivered_at)} />
            </div>
            {order.reported_issue && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Falla reportada</div>
                <p className="text-foreground text-sm">{order.reported_issue}</p>
              </div>
            )}
            {order.diagnosis && (
              <div className="mt-3">
                <div className="text-xs uppercase text-muted-foreground tracking-wider mb-1">Diagnóstico</div>
                <p className="text-foreground text-sm">{order.diagnosis}</p>
              </div>
            )}

            {order.status === "pendiente_aprobacion" && (
              <div className="mt-5 pt-5 border-t border-border">
                {user ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-emerald-200 font-semibold text-sm uppercase tracking-wider">Aprobación requerida</p>
                      <p className="text-foreground text-sm mt-1">
                        Revisa el diagnóstico y el valor cotizado{order.cost ? ` (${formatCOP(Number(order.cost))})` : ""}. Aprueba para que iniciemos la reparación.
                      </p>
                    </div>
                    <button
                      onClick={approve}
                      disabled={approving}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-md uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-60 whitespace-nowrap"
                    >
                      {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Aprobar reparación
                    </button>
                  </div>
                ) : (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <p className="text-foreground text-sm mb-3">
                      Inicia sesión o crea una cuenta para aprobar la reparación y acceder al historial completo de tus servicios.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/login"
                        className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md text-sm uppercase tracking-wider flex items-center gap-2 hover:bg-primary/90"
                      >
                        <LogIn className="w-4 h-4" /> Iniciar sesión
                      </Link>
                      <Link
                        to="/register"
                        className="border border-primary text-primary font-semibold px-4 py-2 rounded-md text-sm uppercase tracking-wider hover:bg-primary/10"
                      >
                        Crear cuenta
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Historial de estados
              </h2>
              <ol className="space-y-3">
                {history.map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${REPAIR_STATUS_COLOR[h.to_status]}`}>
                          {REPAIR_STATUS_LABEL[h.to_status]}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(h.created_at)}</span>
                      </div>
                      {h.note && <p className="text-sm text-foreground mt-1">{h.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      <RegisterCTAModal open={showCTA} onClose={() => setShowCTA(false)} />
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs uppercase text-muted-foreground tracking-wider">{label}</div>
    <div className="text-foreground font-medium">{value || "—"}</div>
  </div>
);

export default TrackRepair;