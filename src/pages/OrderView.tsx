import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import SEO from "@/components/SEO";
import { Loader2, CheckCircle2, XCircle, LogIn, Pencil } from "lucide-react";
import {
  REPAIR_STATUS_LABEL,
  REPAIR_STATUS_COLOR,
  formatCOP,
  formatDate,
  formatDateTime,
  RepairStatus,
} from "@/lib/repairs";
import PriorityBadge from "@/components/PriorityBadge";

interface PublicOrder {
  id: string;
  order_number: string;
  status: RepairStatus;
  priority?: string | null;
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
  is_owner: boolean;
}

const OrderView = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isStaff = userRole === "admin" || userRole === "technician";

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await (supabase.rpc as any)("get_repair_order_public", { _order_id: id });
    setLoading(false);
    const o = Array.isArray(data) ? data[0] : data;
    setOrder((o as PublicOrder) || null);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const setStatus = async (status: "aprobado" | "cancelado") => {
    if (!order) return;
    setSaving(true);
    const { error } = await (supabase.rpc as any)("customer_set_repair_status", {
      _order_id: order.id,
      _status: status,
    });
    setSaving(false);
    if (error) {
      toast({ title: "No se pudo actualizar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "aprobado" ? "¡Aprobado!" : "Orden cancelada" });
    load();
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Cargando...</div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">No encontramos esta orden de servicio.</p>
        <Link to="/seguimiento" className="text-primary underline mt-3 inline-block">
          Buscar por número de orden
        </Link>
      </div>
    );
  }

  const canDecide =
    order.is_owner && (order.status === "pendiente_aprobacion" || order.status === "recibido");

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <SEO
        title={`Orden ${order.order_number} | Tecno Gz`}
        description="Estado y detalles de tu orden de servicio técnico."
        path={`/orden/${order.id}`}
      />
      <BackButton />

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wider">Orden de servicio</div>
            <h1 className="font-display text-3xl font-bold text-foreground">{order.order_number}</h1>
            <p className="text-sm text-muted-foreground">Ingreso: {formatDateTime(order.received_at)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={order.priority} />
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${REPAIR_STATUS_COLOR[order.status]}`}>
              {REPAIR_STATUS_LABEL[order.status]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Info label="Cliente" value={order.customer_name} />
          <Info label="Equipo" value={`${order.device_type || ""} ${order.brand || ""} ${order.model || ""}`.trim()} />
          <Info label="Entrega estimada" value={formatDate(order.estimated_date)} />
          <Info label="Costo" value={formatCOP(Number(order.cost))} />
          <Info label="Garantía" value={order.warranty_days ? `${order.warranty_days} días` : "—"} />
          <Info label="Entregado" value={formatDate(order.delivered_at)} />
        </div>

        {order.reported_issue && (
          <div className="mt-5 pt-4 border-t border-border">
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

        <div className="mt-6 pt-5 border-t border-border">
          {isStaff ? (
            <Link
              to={`/admin/repairs/orders/${order.id}`}
              className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-md uppercase tracking-wider text-sm inline-flex items-center gap-2 hover:bg-primary/90"
            >
              <Pencil className="w-4 h-4" /> Editar orden completa
            </Link>
          ) : !user ? (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <p className="text-foreground text-sm mb-3">
                Inicia sesión con tu cuenta para aprobar o cancelar esta orden y ver todo tu historial.
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
          ) : canDecide ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-foreground text-sm mb-3">
                Revisa el diagnóstico y el valor cotizado
                {order.cost ? ` (${formatCOP(Number(order.cost))})` : ""}. Puedes aprobar la reparación o cancelarla.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatus("aprobado")}
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-md uppercase tracking-wider text-sm flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Aprobar
                </button>
                <button
                  onClick={() => setStatus("cancelado")}
                  disabled={saving}
                  className="border border-red-500/40 text-red-400 font-semibold px-5 py-2.5 rounded-md uppercase tracking-wider text-sm flex items-center gap-2 disabled:opacity-60 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {order.is_owner
                ? "En este momento no hay acciones pendientes de tu parte."
                : "Esta orden está a nombre de otra persona; solo puedes ver su estado."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs uppercase text-muted-foreground tracking-wider">{label}</div>
    <div className="text-foreground font-medium">{value || "—"}</div>
  </div>
);

export default OrderView;
