import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Edit, X, Phone, Mail, ChevronDown, ChevronUp, IdCard, UserCheck } from "lucide-react";
import { REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, RepairStatus, formatDate, formatCOP } from "@/lib/repairs";
import BackButton from "@/components/BackButton";

const empty = { document_number: "", name: "", phone: "", email: "", address: "", notes: "" };

const AdminRepairCustomers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, any[]>>({});

  const load = async () => {
    const { data } = await (supabase.from as any)("repair_customers").select("*").order("created_at", { ascending: false });
    setCustomers(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim() || !(form.document_number || "").trim()) {
      toast({ title: "Documento, nombre y teléfono son requeridos", variant: "destructive" });
      return;
    }
    const { id, ...rest } = form;
    const payload = { ...rest, document_number: (rest.document_number || "").replace(/\D/g, "") };
    const { error } = id
      ? await (supabase.from as any)("repair_customers").update(payload).eq("id", id)
      : await (supabase.from as any)("repair_customers").insert(payload);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setForm(null);
    toast({ title: "Cliente guardado" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar cliente? Se eliminarán también sus equipos y órdenes.")) return;
    const { error } = await (supabase.from as any)("repair_customers").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  const toggleHistory = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!history[id]) {
      const { data } = await (supabase.from as any)("repair_orders")
        .select("id, order_number, status, received_at, cost, repair_devices(device_type, brand, model)")
        .eq("customer_id", id).order("created_at", { ascending: false });
      setHistory((h) => ({ ...h, [id]: data || [] }));
    }
  };

  const filtered = customers.filter((c) => {
    const s = search.toLowerCase();
    return !s || c.name?.toLowerCase().includes(s) || c.phone?.includes(s) || c.email?.toLowerCase().includes(s) || c.document_number?.includes(s);
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider">Clientes de Taller</h1>
        <button onClick={() => setForm(empty)} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 uppercase tracking-wider">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por documento, nombre, teléfono, email..." className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </div>
      </div>

      {form && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-semibold text-foreground">{form.id ? "Editar" : "Nuevo"} cliente</h3>
            <button onClick={() => setForm(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(["document_number", "name", "phone", "email", "address", "notes"] as const).map((k) => (
              <input key={k} placeholder={k} value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            ))}
          </div>
          <button onClick={save} className="mt-3 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90">Guardar</button>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">Documento</th>
              <th className="p-3 font-medium">Contacto</th>
              <th className="p-3 font-medium">Dirección</th>
              <th className="p-3 font-medium w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <>
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-foreground font-medium">
                    <div>{c.name}</div>
                    {c.user_id && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        <UserCheck className="w-3 h-3" /> Cuenta vinculada
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    {c.document_number ? (
                      <span className="inline-flex items-center gap-1 text-foreground"><IdCard className="w-3 h-3" /> {c.document_number}</span>
                    ) : (
                      <span className="text-amber-400">Falta documento</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-foreground text-xs"><Phone className="w-3 h-3" /> {c.phone}</div>
                    {c.email && <div className="flex items-center gap-1 text-muted-foreground text-xs"><Mail className="w-3 h-3" /> {c.email}</div>}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{c.address || "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => toggleHistory(c.id)} className="p-1.5 rounded-md hover:bg-secondary" title="Historial">
                        {expanded === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setForm(c)} className="p-1.5 rounded-md hover:bg-secondary text-blue-400"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => remove(c.id)} className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr key={`${c.id}-hist`} className="bg-secondary/20 border-b border-border/50">
                    <td colSpan={5} className="p-4">
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Historial de órdenes</h4>
                      {(history[c.id] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sin órdenes.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {history[c.id].map((o: any) => (
                            <Link key={o.id} to={`/admin/repairs/orders/${o.id}`} className="flex items-center justify-between gap-3 text-xs bg-background/50 px-3 py-2 rounded-md hover:border hover:border-primary/30 border border-transparent">
                              <span className="text-primary font-medium">{o.order_number}</span>
                              <span className="text-muted-foreground">{[o.repair_devices?.device_type, o.repair_devices?.brand].filter(Boolean).join(" ")}</span>
                              <span className={`px-2 py-0.5 rounded-full border ${REPAIR_STATUS_COLOR[o.status as RepairStatus]}`}>{REPAIR_STATUS_LABEL[o.status as RepairStatus]}</span>
                              <span className="text-foreground">{formatCOP(Number(o.cost))}</span>
                              <span className="text-muted-foreground">{formatDate(o.received_at)}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay clientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRepairCustomers;