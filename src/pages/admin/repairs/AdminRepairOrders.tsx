import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Filter } from "lucide-react";
import { REPAIR_STATUSES, REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, formatCOP, formatDate, RepairStatus } from "@/lib/repairs";

const PAGE_SIZE = 20;

const AdminRepairOrders = () => {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q: any = (supabase.from as any)("repair_orders")
        .select("id, order_number, status, received_at, cost, repair_customers(name, phone), repair_devices(device_type, brand, model, serial_imei)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (status) q = q.eq("status", status);
      const { data, count } = await q;
      setRows(data || []);
      setTotal(count || 0);
      setLoading(false);
    };
    load();
  }, [status, page]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const blob = [
        r.order_number,
        r.repair_customers?.name,
        r.repair_customers?.phone,
        r.repair_devices?.serial_imei,
        r.repair_devices?.model,
        r.repair_devices?.brand,
      ].join(" ").toLowerCase();
      return blob.includes(s);
    });
  }, [rows, search]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider">Órdenes de servicio</h1>
          <p className="text-muted-foreground text-sm">{total} órdenes</p>
        </div>
        <Link to="/admin/repairs/orders/new" className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90 flex items-center gap-2 uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Nueva
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, cliente, teléfono, IMEI..."
            className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={status}
            onChange={(e) => { setPage(0); setParams(e.target.value ? { status: e.target.value } : {}); }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {REPAIR_STATUSES.map((s) => (
              <option key={s} value={s}>{REPAIR_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
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
              {loading && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
              )}
              {!loading && filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3">
                    <Link to={`/admin/repairs/orders/${r.id}`} className="text-primary font-medium hover:underline">{r.order_number}</Link>
                  </td>
                  <td className="p-3">
                    <div className="text-foreground">{r.repair_customers?.name}</div>
                    <div className="text-xs text-muted-foreground">{r.repair_customers?.phone}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {[r.repair_devices?.device_type, r.repair_devices?.brand, r.repair_devices?.model].filter(Boolean).join(" ")}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] border ${REPAIR_STATUS_COLOR[r.status as RepairStatus]}`}>
                      {REPAIR_STATUS_LABEL[r.status as RepairStatus]}
                    </span>
                  </td>
                  <td className="p-3 text-foreground">{formatCOP(Number(r.cost))}</td>
                  <td className="p-3 text-muted-foreground text-xs">{formatDate(r.received_at)}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between p-4 border-t border-border text-sm">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md bg-secondary text-foreground disabled:opacity-50"
            >Anterior</button>
            <span className="text-muted-foreground">Página {page + 1} de {Math.ceil(total / PAGE_SIZE)}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
              className="px-3 py-1.5 rounded-md bg-secondary text-foreground disabled:opacity-50"
            >Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRepairOrders;