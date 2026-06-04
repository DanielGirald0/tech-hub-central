import BackButton from "@/components/BackButton";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Plus, Users, ClipboardList, Activity, BarChart3 } from "lucide-react";
import { REPAIR_STATUSES, REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, formatCOP, formatDate, RepairStatus } from "@/lib/repairs";

const AdminRepairsDashboard = () => {
  const { data } = useQuery({
    queryKey: ["admin", "repair-dashboard"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_repair_dashboard_stats");
      if (error || !data) return { counts: {} as Record<string, number>, recent: [] as any[], revenue: 0 };
      return {
        counts: (data.counts_by_status || {}) as Record<string, number>,
        recent: (data.recent || []) as any[],
        revenue: Number(data.revenue_month) || 0,
      };
    },
  });
  const counts = data?.counts || {};
  const recent = data?.recent || [];
  const revenue = data?.revenue || 0;

  const active = REPAIR_STATUSES.filter((s) => s !== "entregado" && s !== "cancelado").reduce((sum, s) => sum + (counts[s] || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-wider flex items-center gap-3">
            <Wrench className="w-7 h-7 text-primary" /> Servicio Técnico
          </h1>
          <p className="text-muted-foreground">Gestión de órdenes de reparación</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/repairs/customers" className="bg-card border border-border px-4 py-2.5 rounded-md text-sm font-medium hover:border-primary/30 flex items-center gap-2">
            <Users className="w-4 h-4" /> Clientes
          </Link>
          <Link to="/admin/repairs/reports" className="bg-card border border-border px-4 py-2.5 rounded-md text-sm font-medium hover:border-primary/30 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Reportes
          </Link>
          <Link to="/admin/repairs/orders" className="bg-card border border-border px-4 py-2.5 rounded-md text-sm font-medium hover:border-primary/30 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Todas las órdenes
          </Link>
          <Link to="/admin/repairs/orders/new" className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90 flex items-center gap-2 uppercase tracking-wider">
            <Plus className="w-4 h-4" /> Nueva orden
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Órdenes activas" value={active} icon={Activity} color="text-blue-400" />
        <StatCard label="Ingresos del mes" value={formatCOP(revenue)} icon={Wrench} color="text-green-400" />
        <StatCard label="Listas para entregar" value={counts.listo_entrega || 0} icon={ClipboardList} color="text-emerald-400" />
        <StatCard label="Esperando repuesto" value={counts.esperando_repuesto || 0} icon={ClipboardList} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {REPAIR_STATUSES.map((s) => (
          <Link
            key={s}
            to={`/admin/repairs/orders?status=${s}`}
            className={`rounded-md p-3 border text-center transition-all hover:scale-105 ${REPAIR_STATUS_COLOR[s as RepairStatus]}`}
          >
            <div className="text-2xl font-bold">{counts[s] || 0}</div>
            <div className="text-[10px] uppercase tracking-wider mt-1">{REPAIR_STATUS_LABEL[s as RepairStatus]}</div>
          </Link>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Órdenes recientes</h2>
          <Link to="/admin/repairs/orders" className="text-xs text-primary hover:underline">Ver todas →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">Orden</th>
                <th className="p-3 font-medium">Cliente</th>
                <th className="p-3 font-medium">Equipo</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">Costo</th>
                <th className="p-3 font-medium">Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3">
                    <Link to={`/admin/repairs/orders/${r.id}`} className="text-primary font-medium hover:underline">
                      {r.order_number}
                    </Link>
                  </td>
                  <td className="p-3 text-foreground">{r.repair_customers?.name}</td>
                  <td className="p-3 text-muted-foreground">{[r.repair_devices?.device_type, r.repair_devices?.brand, r.repair_devices?.model].filter(Boolean).join(" ")}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] border ${REPAIR_STATUS_COLOR[r.status as RepairStatus]}`}>
                      {REPAIR_STATUS_LABEL[r.status as RepairStatus]}
                    </span>
                  </td>
                  <td className="p-3 text-foreground">{formatCOP(Number(r.cost))}</td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDate(r.received_at)}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay órdenes todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <Icon className={`w-6 h-6 ${color} mb-3`} />
    <div className="font-display text-2xl font-bold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
  </div>
);

export default AdminRepairsDashboard;