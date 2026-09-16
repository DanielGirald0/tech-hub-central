import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import PriorityBadge from "@/components/PriorityBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { savePriorityQueue } from "@/lib/priorityQueue";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  ArrowRight,
  User,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
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

type Tab = "prioritarias" | "hoy" | "todas";

const AdminRepairPriorities = () => {
  const { data = [], isLoading } = usePriorityOrders();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const queryClient = useQueryClient();
  const today = todayISO();
  const [tab, setTab] = useState<Tab>("prioritarias");
  const [savingId, setSavingId] = useState<string | null>(null);

  const setPriority = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: "normal" | "prioritaria" }) => {
      setSavingId(id);
      const { error } = await (supabase.from("repair_orders") as any)
        .update({ priority })
        .eq("id", id);
      if (error) throw error;
      return priority;
    },
    onSuccess: (priority) => {
      toast.success(priority === "prioritaria" ? "Orden marcada como prioritaria" : "Prioridad retirada");
      queryClient.invalidateQueries({ queryKey: ["repair-priorities"] });
      queryClient.invalidateQueries({ queryKey: ["repair-priorities-summary"] });
      queryClient.invalidateQueries({ queryKey: ["repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["repair-dashboard"] });
    },
    onError: (e: any) => toast.error(e?.message || "No se pudo actualizar la prioridad"),
    onSettled: () => setSavingId(null),
  });

  const groups = useMemo(() => {
    const prioritarias = data.filter((o) => o.priority === "prioritaria");
    const entregasHoy = data.filter((o) => o.estimated_date && o.estimated_date <= today);
    const normales = data.filter(
      (o) => o.priority !== "prioritaria" && (!o.estimated_date || o.estimated_date > today)
    );
    return { prioritarias, entregasHoy, normales };
  }, [data, today]);

  useEffect(() => {
    if (data.length) savePriorityQueue(data.map((o) => o.id));
  }, [data]);

  const visible =
    tab === "prioritarias" ? groups.prioritarias : tab === "hoy" ? groups.entregasHoy : data;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "prioritarias", label: "Prioritarias", count: groups.prioritarias.length },
    { key: "hoy", label: "Entregas de hoy", count: groups.entregasHoy.length },
    { key: "todas", label: "Todas las pendientes", count: data.length },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton to="/admin/repairs" />
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground uppercase tracking-wider flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-primary" /> Prioridades
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAdmin
            ? "Marca, cambia o retira la prioridad de cada orden y revisa las entregas de hoy."
            : "Órdenes prioritarias y entregas programadas para hoy."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Counter label="Prioritarias" value={groups.prioritarias.length} icon={AlertTriangle} />
        <Counter label="Entregas hoy" value={groups.entregasHoy.length} icon={CalendarClock} />
        <Counter label="Pendientes" value={data.length} icon={ClipboardList} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">
          {tab === "prioritarias"
            ? "No hay órdenes marcadas como prioritarias."
            : tab === "hoy"
            ? "No hay entregas programadas para hoy."
            : "No tienes órdenes pendientes."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((o) => (
            <OrderCard
              key={o.id}
              o={o}
              today={today}
              isAdmin={isAdmin}
              saving={savingId === o.id}
              onToggle={(priority) => setPriority.mutate({ id: o.id, priority })}
            />
          ))}
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

const OrderCard = ({
  o,
  today,
  isAdmin,
  saving,
  onToggle,
}: {
  o: PriorityOrder;
  today: string;
  isAdmin: boolean;
  saving: boolean;
  onToggle: (priority: "normal" | "prioritaria") => void;
}) => {
  const dueToday = !!o.estimated_date && o.estimated_date <= today;
  const isPriority = o.priority === "prioritaria";
  return (
    <div
      className={`bg-card border rounded-xl p-4 flex flex-col gap-3 ${
        isPriority ? "border-primary/40" : "border-border"
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
        <span
          className={`px-2 py-0.5 rounded-full border ${
            dueToday ? "border-primary/40 text-primary bg-primary/10" : "border-border text-muted-foreground"
          }`}
        >
          <CalendarClock className="w-3 h-3 inline mr-1" />
          Entrega: {formatDate(o.estimated_date)}
        </span>
      </div>

      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
        <span>
          <User className="w-3 h-3 inline mr-1" />
          {o.technician_name ? `Técnico: ${o.technician_name}` : "Sin técnico asignado"}
        </span>
        <span>Ingreso: {formatDate(o.received_at)}</span>
      </div>

      <div className="mt-auto flex flex-col sm:flex-row gap-2">
        {isAdmin && (
          <button
            type="button"
            disabled={saving}
            onClick={() => onToggle(isPriority ? "normal" : "prioritaria")}
            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 ${
              isPriority
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPriority ? (
              <Trash2 className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isPriority ? "Quitar prioridad" : "Marcar prioritaria"}
          </button>
        )}
        <Link
          to={`/admin/repairs/orders/${o.id}`}
          className="flex-1 bg-secondary text-foreground hover:bg-secondary/80 rounded-md px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
        >
          Ver orden <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default AdminRepairPriorities;
