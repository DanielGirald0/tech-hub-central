import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Download, FileText, Search, Loader2, TrendingUp, Wrench, CheckCircle2, Clock, XCircle, DollarSign, Award } from "lucide-react";
import { REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, formatCOP, formatDate, RepairStatus } from "@/lib/repairs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import PriorityBadge from "@/components/PriorityBadge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Preset = "today" | "yesterday" | "week" | "month" | "last30" | "custom";

interface ReportRow {
  id: string;
  order_number: string;
  received_at: string;
  delivered_at: string | null;
  estimated_date: string | null;
  status: RepairStatus;
  cost: number;
  customer_name: string;
  customer_document: string | null;
  customer_phone: string;
  technician_name: string;
  technician_id: string | null;
  device_type: string;
  brand: string | null;
  model: string | null;
  priority: string;
}

interface Totals { total_orders: number; delivered: number; pending: number; cancelled: number; revenue: number; avg_ticket: number; avg_repair_days: number }
interface Summary {
  totals: Totals;
  by_day: { day: string; orders: number; revenue: number; avg_days: number }[];
  by_status: { status: string; count: number }[];
  by_technician: { technician: string; orders: number; revenue: number }[];
  top_by_orders: { technician: string; orders: number; revenue: number } | null;
  top_by_revenue: { technician: string; orders: number; revenue: number } | null;
}

const computeSummary = (rows: ReportRow[]): Summary => {
  const delivered = rows.filter((r) => r.status === "entregado");
  const revenue = delivered.reduce((s, r) => s + Number(r.cost || 0), 0);
  const ticketsWithCost = delivered.filter((r) => Number(r.cost) > 0);
  const avg_ticket = ticketsWithCost.length ? revenue / ticketsWithCost.length : 0;
  const daysList = delivered
    .filter((r) => r.delivered_at)
    .map((r) => (new Date(r.delivered_at!).getTime() - new Date(r.received_at).getTime()) / 86400000);
  const avg_repair_days = daysList.length ? daysList.reduce((a, b) => a + b, 0) / daysList.length : 0;

  const byDayMap = new Map<string, { orders: number; revenue: number; daysSum: number; daysN: number }>();
  for (const r of rows) {
    const day = r.received_at.slice(0, 10);
    const e = byDayMap.get(day) || { orders: 0, revenue: 0, daysSum: 0, daysN: 0 };
    e.orders += 1;
    if (r.status === "entregado") {
      e.revenue += Number(r.cost || 0);
      if (r.delivered_at) {
        e.daysSum += (new Date(r.delivered_at).getTime() - new Date(r.received_at).getTime()) / 86400000;
        e.daysN += 1;
      }
    }
    byDayMap.set(day, e);
  }
  const by_day = [...byDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, orders: v.orders, revenue: v.revenue, avg_days: v.daysN ? +(v.daysSum / v.daysN).toFixed(1) : 0 }));

  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) || 0) + 1);
  const by_status = [...byStatus.entries()].map(([status, count]) => ({ status, count }));

  const byTech = new Map<string, { orders: number; revenue: number }>();
  for (const r of rows) {
    const k = r.technician_name || "—";
    const e = byTech.get(k) || { orders: 0, revenue: 0 };
    e.orders += 1;
    if (r.status === "entregado") e.revenue += Number(r.cost || 0);
    byTech.set(k, e);
  }
  const by_technician = [...byTech.entries()]
    .map(([technician, v]) => ({ technician, ...v }))
    .sort((a, b) => b.orders - a.orders);

  return {
    totals: {
      total_orders: rows.length,
      delivered: delivered.length,
      pending: rows.filter((r) => r.status !== "entregado" && r.status !== "cancelado").length,
      cancelled: rows.filter((r) => r.status === "cancelado").length,
      revenue,
      avg_ticket,
      avg_repair_days: +avg_repair_days.toFixed(1),
    },
    by_day,
    by_status,
    by_technician,
    top_by_orders: by_technician[0] || null,
    top_by_revenue: [...by_technician].sort((a, b) => b.revenue - a.revenue)[0] || null,
  };
};

const presetRange = (p: Preset): { from: Date; to: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);
  switch (p) {
    case "today": return { from: start, to: end };
    case "yesterday": {
      const f = new Date(start); f.setDate(f.getDate() - 1);
      return { from: f, to: start };
    }
    case "week": {
      const f = new Date(start);
      const day = (f.getDay() + 6) % 7; // Monday = 0
      f.setDate(f.getDate() - day);
      return { from: f, to: end };
    }
    case "month": {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: f, to: end };
    }
    case "last30": {
      const f = new Date(start); f.setDate(f.getDate() - 30);
      return { from: f, to: end };
    }
    default: return { from: start, to: end };
  }
};

const toInput = (d: Date) => d.toISOString().slice(0, 10);

const COLORS = ["#D90429", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const AdminRepairReports = () => {
  const { toast } = useToast();
  const [preset, setPreset] = useState<Preset>("month");
  const init = presetRange("month");
  const [from, setFrom] = useState(toInput(init.from));
  const [to, setTo] = useState(toInput(init.to));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [prevRows, setPrevRows] = useState<ReportRow[]>([]);
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof ReportRow>("received_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") {
      const r = presetRange(p);
      setFrom(toInput(r.from));
      setTo(toInput(r.to));
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const fromIso = new Date(from + "T00:00:00").toISOString();
      const toDate = new Date(to + "T00:00:00"); toDate.setDate(toDate.getDate() + 1);
      const toIso = toDate.toISOString();
      // previous period of same length
      const spanMs = new Date(toIso).getTime() - new Date(fromIso).getTime();
      const prevTo = fromIso;
      const prevFrom = new Date(new Date(fromIso).getTime() - spanMs).toISOString();
      const [{ data: r, error: e1 }, { data: pr, error: e2 }] = await Promise.all([
        (supabase.rpc as any)("get_repair_report", { _from: fromIso, _to: toIso }),
        (supabase.rpc as any)("get_repair_report", { _from: prevFrom, _to: prevTo }),
      ]);
      if (e1 || e2) throw e1 || e2;
      setRows((r as ReportRow[]) || []);
      setPrevRows((pr as ReportRow[]) || []);
      setPage(1);
    } catch (err: any) {
      toast({ title: "Error al cargar reporte", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  const technicians = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.technician_name && set.add(r.technician_name));
    return [...set].sort();
  }, [rows]);

  const scope = (list: ReportRow[]) =>
    list.filter(
      (r) =>
        (technicianFilter === "all" || r.technician_name === technicianFilter) &&
        (priorityFilter === "all" || (r.priority || "normal") === priorityFilter)
    );
  const scopedRows = useMemo(() => scope(rows), [rows, technicianFilter, priorityFilter]);
  const scopedPrevRows = useMemo(() => scope(prevRows), [prevRows, technicianFilter, priorityFilter]);
  const summary = useMemo(() => computeSummary(scopedRows), [scopedRows]);
  const prevSummary = useMemo(() => computeSummary(scopedPrevRows), [scopedPrevRows]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let r = scopedRows;
    if (s) {
      r = scopedRows.filter((x) =>
        x.order_number.toLowerCase().includes(s) ||
        (x.customer_name || "").toLowerCase().includes(s) ||
        (x.customer_document || "").toLowerCase().includes(s) ||
        (x.technician_name || "").toLowerCase().includes(s)
      );
    }
    const sorted = [...r].sort((a, b) => {
      const av = (a[sortKey] as any) ?? "";
      const bv = (b[sortKey] as any) ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [scopedRows, search, sortKey, sortDir]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggleSort = (k: keyof ReportRow) => {
    if (sortKey === k) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const exportExcel = () => {
    const headers = ["Orden","Ingreso","Entrega","Cliente","Documento","Técnico","Equipo","Marca","Modelo","Prioridad","Estado","Costo"];
    const lines = filtered.map((r) => [
      r.order_number, formatDate(r.received_at), formatDate(r.delivered_at),
      r.customer_name, r.customer_document || "", r.technician_name,
      r.device_type, r.brand || "", r.model || "",
      r.priority === "prioritaria" ? "Prioritaria" : "Normal",
      REPAIR_STATUS_LABEL[r.status], Number(r.cost || 0).toString(),
    ]);
    const csv = [headers, ...lines].map((row) => row.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `reporte-taller-${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("TECNO GZ — Reporte de Taller", 14, 16);
    doc.setFontSize(10);
    doc.text(`Rango: ${formatDate(from)} a ${formatDate(to)}`, 14, 23);
    doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 14, 28);
    if (summary) {
      autoTable(doc, {
        startY: 34,
        head: [["Resumen", ""]],
        body: [
          ["Total órdenes", summary.totals.total_orders],
          ["Entregadas", summary.totals.delivered],
          ["Pendientes", summary.totals.pending],
          ["Canceladas", summary.totals.cancelled],
          ["Ingresos", formatCOP(Number(summary.totals.revenue))],
          ["Ticket promedio", formatCOP(Number(summary.totals.avg_ticket))],
          ["Top técnico (órdenes)", summary.top_by_orders ? `${summary.top_by_orders.technician} (${summary.top_by_orders.orders})` : "—"],
          ["Top técnico (facturación)", summary.top_by_revenue ? `${summary.top_by_revenue.technician} — ${formatCOP(Number(summary.top_by_revenue.revenue))}` : "—"],
        ],
      });
    }
    autoTable(doc, {
      head: [["Orden","Ingreso","Entrega","Cliente","Documento","Técnico","Equipo","Prioridad","Estado","Costo"]],
      body: filtered.map((r) => [
        r.order_number, formatDate(r.received_at), formatDate(r.delivered_at),
        r.customer_name, r.customer_document || "—", r.technician_name,
        [r.device_type, r.brand, r.model].filter(Boolean).join(" "),
        r.priority === "prioritaria" ? "Prioritaria" : "Normal",
        REPAIR_STATUS_LABEL[r.status], formatCOP(Number(r.cost || 0)),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [217, 4, 41] },
    });
    doc.save(`reporte-taller-${from}_${to}.pdf`);
  };

  const t = summary.totals;
  const pt = prevSummary.totals;
  const delta = (cur: number, prev: number) => {
    if (!prev) return cur ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton to="/admin/repairs" />
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-wider flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-primary" /> Reportes del taller
          </h1>
          <p className="text-muted-foreground text-sm">Productividad y facturación del servicio técnico.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportExcel} className="bg-secondary text-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-secondary/80"><Download className="w-4 h-4" /> Excel</button>
          <button onClick={exportPDF} className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 uppercase tracking-wider"><FileText className="w-4 h-4" /> PDF</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {([
            ["today","Hoy"],["yesterday","Ayer"],["week","Esta semana"],
            ["month","Este mes"],["last30","Últimos 30 días"],["custom","Personalizado"],
          ] as [Preset, string][]).map(([k, lbl]) => (
            <button key={k} onClick={() => applyPreset(k)} className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider ${preset === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Desde</label>
            <input type="date" value={from} onChange={(e) => { setPreset("custom"); setFrom(e.target.value); }} className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
            <input type="date" value={to} onChange={(e) => { setPreset("custom"); setTo(e.target.value); }} className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Prioridad</label>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground">
              <option value="all">Todas</option>
              <option value="normal">Normal</option>
              <option value="prioritaria">Prioritaria</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Técnico</label>
            <select value={technicianFilter} onChange={(e) => setTechnicianFilter(e.target.value)} className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground">
              <option value="all">Todos</option>
              {technicians.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-primary mb-3" />}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        <Kpi icon={Wrench} label="Total órdenes" value={t.total_orders} color="text-blue-400" deltaPct={delta(t.total_orders, pt.total_orders)} />
        <Kpi icon={CheckCircle2} label="Entregadas" value={t.delivered} color="text-emerald-400" deltaPct={delta(t.delivered, pt.delivered)} />
        <Kpi icon={Clock} label="Pendientes" value={t.pending} color="text-yellow-400" deltaPct={delta(t.pending, pt.pending)} />
        <Kpi icon={XCircle} label="Canceladas" value={t.cancelled} color="text-red-400" deltaPct={delta(t.cancelled, pt.cancelled)} />
        <Kpi icon={DollarSign} label="Ingresos" value={formatCOP(t.revenue)} color="text-green-400" deltaPct={delta(t.revenue, pt.revenue)} />
        <Kpi icon={TrendingUp} label="Ticket promedio" value={formatCOP(t.avg_ticket)} color="text-purple-400" deltaPct={delta(t.avg_ticket, pt.avg_ticket)} />
        <Kpi icon={Clock} label="Días promedio" value={t.avg_repair_days ? `${t.avg_repair_days}d` : "—"} color="text-cyan-400" deltaPct={delta(t.avg_repair_days, pt.avg_repair_days)} invertDelta />
      </div>

      {(summary.top_by_orders || summary.top_by_revenue) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {summary.top_by_orders && (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Top técnico — Órdenes</div>
                <div className="font-display font-semibold text-foreground">{summary.top_by_orders.technician} <span className="text-muted-foreground text-sm">· {summary.top_by_orders.orders} órdenes</span></div>
              </div>
            </div>
          )}
          {summary.top_by_revenue && (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <Award className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Top técnico — Facturación</div>
                <div className="font-display font-semibold text-foreground">{summary.top_by_revenue.technician} <span className="text-muted-foreground text-sm">· {formatCOP(Number(summary.top_by_revenue.revenue))}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      {(
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCard title="Órdenes por día">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="orders" fill="#D90429" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Ingresos por día">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={summary.by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: any) => formatCOP(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Órdenes por técnico">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.by_technician} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="technician" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Estados de órdenes">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={summary.by_status} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {summary.by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v: any) => REPAIR_STATUS_LABEL[v as RepairStatus] || v} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: any, n: any) => [v, REPAIR_STATUS_LABEL[n as RepairStatus] || n]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Tiempo promedio de reparación (días)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={summary.by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v}d`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: any) => [`${v} días`, "Promedio"]} />
                <Line type="monotone" dataKey="avg_days" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Detalle ({filtered.length})</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar cliente, orden o técnico..."
              className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <Th label="Orden" k="order_number" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Ingreso" k="received_at" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Entrega" k="delivered_at" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Cliente" k="customer_name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Doc" k="customer_document" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Técnico" k="technician_name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <th className="p-3 font-medium">Equipo</th>
                <th className="p-3 font-medium">Prioridad</th>
                <Th label="Estado" k="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <Th label="Costo" k="cost" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3"><Link to={`/admin/repairs/orders/${r.id}`} className="text-primary font-medium hover:underline">{r.order_number}</Link></td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDate(r.received_at)}</td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDate(r.delivered_at)}</td>
                  <td className="p-3 text-foreground">{r.customer_name}</td>
                  <td className="p-3 text-muted-foreground text-xs">{r.customer_document || "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.technician_name}</td>
                  <td className="p-3 text-muted-foreground text-xs">{[r.device_type, r.brand, r.model].filter(Boolean).join(" ")}</td>
                  <td className="p-3"><PriorityBadge priority={r.priority} /></td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[11px] border ${REPAIR_STATUS_COLOR[r.status]}`}>{REPAIR_STATUS_LABEL[r.status]}</span></td>
                  <td className="p-3 text-right text-foreground">{formatCOP(Number(r.cost || 0))}</td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Sin órdenes en el rango seleccionado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-md bg-secondary disabled:opacity-50">Anterior</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-md bg-secondary disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Kpi = ({ icon: Icon, label, value, color, deltaPct, invertDelta }: any) => {
  const hasDelta = typeof deltaPct === "number" && isFinite(deltaPct);
  const positive = invertDelta ? deltaPct < 0 : deltaPct > 0;
  const neutral = !hasDelta || Math.abs(deltaPct) < 0.5;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <div className="font-display text-xl font-bold text-foreground truncate">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
      {hasDelta && (
        <div className={`text-[10px] mt-1 font-medium ${neutral ? "text-muted-foreground" : positive ? "text-emerald-400" : "text-red-400"}`}>
          {neutral ? "= 0%" : `${deltaPct > 0 ? "▲" : "▼"} ${Math.abs(deltaPct).toFixed(0)}% vs período anterior`}
        </div>
      )}
    </div>
  );
};

const ChartCard = ({ title, children }: any) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const Th = ({ label, k, sortKey, sortDir, onClick, className = "" }: any) => (
  <th className={`p-3 font-medium ${className}`}>
    <button onClick={() => onClick(k)} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}
      {sortKey === k && <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
    </button>
  </th>
);

export default AdminRepairReports;