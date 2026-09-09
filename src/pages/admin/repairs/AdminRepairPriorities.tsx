import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import BackButton from "@/components/BackButton";
import PriorityBadge from "@/components/PriorityBadge";
import { supabase } from "@/integrations/supabase/client";
import { savePriorityQueue } from "@/lib/priorityQueue";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CalendarClock, ClipboardList, ArrowRight, User } from "lucide-react";
import {
  REPAIR_STATUS_COLOR,
  REPAIR_STATUS_LABEL,
  RepairStatus,
  formatDate,
  todayISO,
} from "@/lib/repairs";

export interface PriorityOrder {
  id: string;
  order_number: string;
  status: RepairStatus;
  priority: string;
  received_at: string;
  estimated_date: string | null;
  customer_name: string;
  customer_phone: string;
  device_type: string;
  brand: string | null;
  model: string | null;
  technician_name: string | null;
  technician_id: string | null;
  bucket: number;
}

export const usePriorityOrders = () =>
  useQuery({
    queryKey: ["repair-priorities"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<PriorityOrder[]> => {
      const { data, error } = await (supabase.rpc as any)("get_today_priorities");
      if (error) throw error;
      return (data || []) as PriorityOrder[];
    },
  });

const AdminRepairPriorities = () => {
  const { data = [], isLoading } = usePriorityOrders();
  const today = todayISO();

  const groups = useMemo(() => {
    const prioritarias = data.filter((o) => o.priority === "prioritaria");
    const entregasHoy = data.filter(
      (o) => o.priority !== "prioritaria" && o.estimated_date && o.estimated_date <= today
    );
    const proximas = data.filter(
      (o) => o.priority !== "prioritaria" && (!o.estimated_date || o.estimated_date > today)
    );
    return { prioritarias, entregasHoy, proximas };
  }, [data, today]);

  useEffect(() => {
    if (data.length) savePriorityQueue(data.map((o) => o.id));
  }, [data]);

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton to="/admin/repairs" />
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground uppercase tracking-wider flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-primary" /> Prioridades de hoy
        </h1>
        <p className="text-muted-foreground text-sm">Órdenes activas que requieren atención hoy.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Counter label="Prioritarias" value={groups.prioritarias.length} icon={AlertTriangle} />
        <Counter label="Entregas hoy" value={groups.entregasHoy.length} icon={CalendarClock} />
        <Counter label="Pendientes" value={data.length} icon={ClipboardList} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          No tienes órdenes pendientes para hoy. 
        </p>
      ) : (
        <div className="space-y-8">
          <Group title="Órdenes prioritarias" orders={groups.prioritarias} today={today} />
          <Group title="Entregas programadas para hoy" orders={groups.entregasHoy} today={today} />
          <Group title="Próximas entregas" orders={groups.proximas} today={today} />
        </div>
      )}
    </div>
  );
};

const Counter = ({ label, value, icon: Icon }: any) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <Icon className="w-5 h-5 text-primary mb-2" />
    <div className="font-display text-2xl font-bold text-foreground">{value}</div>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

const Group = ({ title, orders, today }: { title: string; orders: PriorityOrder[]; today: string }) => {
  if (!orders.length) return null;
  return (
    <section>
      <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
        {title} <span className="text-muted-foreground">({orders.length})</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((o) => <OrderCard key={o.id} o={o} today={today} />)}
      </div>
    </section>
  );
};

const OrderCard = ({ o, today }: { o: PriorityOrder; today: string }) => {
  const dueToday = !!o.estimated_date && o.estimated_date <= today;
  return (
    <div
      className={`bg-card border rounded-xl p-4 flex flex-col gap-3 ${
        o.priority === "prioritaria" ? "border-primary/40" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-foreground">{o.order_number}</p>
          <p className="text-sm text-foreground truncate">{o.customer_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[o.device_type, o.brand, o.model].filter(Boolean).join(" ")}
          </p>
        </div>
        <PriorityBadge priority={o.priority} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`px-2 py-0.5 rounded-full border ${REPAIR_STATUS_COLOR[o.status]}`}>
          {REPAIR_STATUS_LABEL[o.status]}
        </span>
        <span className={`px-2 py-0.5 rounded-full border ${dueToday ? "border-primary/40 text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
          <CalendarClock className="w-3 h-3 inline mr-1" />
          Entrega: {formatDate(o.estimated_date)}
        </span>
      </div>

      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span><User className="w-3 h-3 inline mr-1" />{o.technician_name ? `Técnico: ${o.technician_name}` : "Sin técnico asignado"}</span>
        <span>Ingreso: {formatDate(o.received_at)}</span>
      </div>

      <Link
        to={`/admin/repairs/orders/${o.id}`}
        className="mt-auto bg-secondary text-foreground hover:bg-secondary/80 rounded-md px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
      >
        Ver orden <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default AdminRepairPriorities;
