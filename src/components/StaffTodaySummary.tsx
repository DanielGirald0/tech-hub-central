import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Notificación compacta "Resumen de hoy" para administradores y técnicos.
 * Se muestra una sola vez por sesión, no bloquea la aplicación.
 */
const StaffTodaySummary = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const shown = useRef(false);
  const isStaff = userRole === "admin" || userRole === "technician";

  const { data } = useQuery({
    queryKey: ["repair-priorities-summary", user?.id],
    enabled: !!user && isStaff,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_today_priorities");
      if (error) throw error;
      const rows = (data || []) as any[];
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
      return {
        priority: rows.filter((r) => r.priority === "prioritaria").length,
        dueToday: rows.filter((r) => r.estimated_date && r.estimated_date <= today).length,
      };
    },
  });

  useEffect(() => {
    if (!data || shown.current || !isStaff || !user) return;
    if (!data.priority && !data.dueToday) return;
    const key = `tgz_today_summary_${user.id}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    shown.current = true;

    const parts: string[] = [];
    if (data.priority) parts.push(`${data.priority} ${data.priority === 1 ? "orden prioritaria" : "órdenes prioritarias"}`);
    if (data.dueToday) parts.push(`${data.dueToday} ${data.dueToday === 1 ? "entrega" : "entregas"} para hoy`);

    toast("Resumen de hoy", {
      description: `Hay ${parts.join(" y ")}.`,
      duration: 12000,
      action: {
        label: "Ver pendientes",
        onClick: () => navigate("/admin/repairs/prioridades"),
      },
      cancel: { label: "Ahora no", onClick: () => {} },
    });
  }, [data, isStaff, user, navigate]);

  return null;
};

export default StaffTodaySummary;
