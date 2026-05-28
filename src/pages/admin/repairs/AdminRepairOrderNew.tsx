import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, CheckCircle2, Search } from "lucide-react";
import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";

const AdminRepairOrderNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const [customerMode, setCustomerMode] = useState<"new" | "existing">("new");
  const [customerId, setCustomerId] = useState("");
  const [customer, setCustomer] = useState({ document_number: "", name: "", phone: "", email: "", address: "", notes: "" });
  const [docLookup, setDocLookup] = useState<{ loading: boolean; matched: any | null; checked: boolean }>({ loading: false, matched: null, checked: false });
  const [device, setDevice] = useState({ device_type: "", brand: "", model: "", serial_imei: "", device_password: "", accessories: "", physical_condition: "" });
  const [order, setOrder] = useState({ reported_issue: "", assigned_technician: "", estimated_date: "", warranty_days: 30, cost: 0 });

  useEffect(() => {
    (supabase.from as any)("repair_customers").select("id, name, phone, document_number").order("name").then(({ data }: any) => setCustomers(data || []));
  }, []);

  const lookupDocument = async (doc: string) => {
    const digits = doc.replace(/\D/g, "");
    if (digits.length < 5) {
      setDocLookup({ loading: false, matched: null, checked: false });
      return;
    }
    setDocLookup({ loading: true, matched: null, checked: false });
    const { data, error } = await (supabase.rpc as any)("find_repair_customer_by_document", { _doc: digits });
    if (error) {
      setDocLookup({ loading: false, matched: null, checked: true });
      return;
    }
    const match = Array.isArray(data) && data.length > 0 ? data[0] : null;
    setDocLookup({ loading: false, matched: match, checked: true });
    if (match) {
      setCustomer((c) => ({
        document_number: digits,
        name: match.name || match.registered_name || c.name,
        phone: match.phone || match.registered_phone || c.phone,
        email: match.email || match.registered_email || c.email,
        address: match.address || c.address,
        notes: match.notes || c.notes,
      }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let cid = customerId;
      if (customerMode === "new") {
        const docDigits = customer.document_number.replace(/\D/g, "");
        if (!docDigits) throw new Error("El número de documento es obligatorio");
        if (!customer.name.trim() || !customer.phone.trim()) throw new Error("Nombre y teléfono del cliente son obligatorios");
        if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new Error("Email inválido");

        // Upsert by document to prevent duplicates
        if (docLookup.matched && docLookup.matched.id) {
          const { error } = await (supabase.from as any)("repair_customers")
            .update({
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              notes: customer.notes,
              document_number: docDigits,
            })
            .eq("id", docLookup.matched.id);
          if (error) throw error;
          cid = docLookup.matched.id;
        } else {
          const payload: any = { ...customer, document_number: docDigits };
          if (docLookup.matched?.user_id) payload.user_id = docLookup.matched.user_id;
          const { data, error } = await (supabase.from as any)("repair_customers").insert(payload).select("id").single();
          if (error) throw error;
          cid = data.id;
        }
      }
      if (!cid) throw new Error("Selecciona un cliente");
      if (!device.device_type.trim()) throw new Error("El tipo de equipo es obligatorio");

      const { data: dev, error: devErr } = await (supabase.from as any)("repair_devices").insert({ ...device, customer_id: cid }).select("id").single();
      if (devErr) throw devErr;

      const { data: ord, error: ordErr } = await (supabase.from as any)("repair_orders").insert({
        customer_id: cid,
        device_id: dev.id,
        reported_issue: order.reported_issue,
        assigned_technician: order.assigned_technician,
        estimated_date: order.estimated_date || null,
        warranty_days: Number(order.warranty_days) || 0,
        cost: Number(order.cost) || 0,
      }).select("id, order_number").single();
      if (ordErr) throw ordErr;

      toast({ title: "Orden creada", description: ord.order_number });
      navigate(`/admin/repairs/orders/${ord.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton to="/admin/repairs/orders" />
      <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider mb-6">Nueva Orden de Servicio</h1>

      <form onSubmit={submit} className="space-y-6">
        <Section title="Cliente">
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setCustomerMode("new")} className={`px-3 py-1.5 text-sm rounded-md ${customerMode === "new" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>Nuevo cliente</button>
            <button type="button" onClick={() => setCustomerMode("existing")} className={`px-3 py-1.5 text-sm rounded-md ${customerMode === "existing" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>Cliente existente</button>
          </div>
          {customerMode === "new" ? (
            <>
              <div className="mb-4">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">
                  Cédula / Documento *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customer.document_number}
                    onChange={(e) => setCustomer({ ...customer, document_number: e.target.value })}
                    onBlur={(e) => lookupDocument(e.target.value)}
                    required
                    placeholder="Número de documento"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 pr-10 text-foreground focus:border-primary focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {docLookup.loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Search className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                {docLookup.checked && docLookup.matched && (
                  <div className="mt-2 flex items-start gap-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md p-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Cliente existente.</strong> Se actualizarán sus datos.
                      {docLookup.matched.user_id && <span className="block text-emerald-400/80">Vinculado a una cuenta registrada.</span>}
                      {docLookup.matched.id && (
                        <Link to={`/admin/repairs/customers`} className="block underline mt-0.5">Ver historial completo</Link>
                      )}
                    </div>
                  </div>
                )}
                {docLookup.checked && !docLookup.matched && (
                  <p className="text-xs text-muted-foreground mt-1">Nuevo cliente — completa los datos.</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Nombre *" value={customer.name} onChange={(v) => setCustomer({ ...customer, name: v })} required />
                <Field label="Teléfono *" value={customer.phone} onChange={(v) => setCustomer({ ...customer, phone: v })} required />
                <Field label="Email *" type="email" value={customer.email} onChange={(v) => setCustomer({ ...customer, email: v })} required />
                <Field label="Dirección" value={customer.address} onChange={(v) => setCustomer({ ...customer, address: v })} />
                <Field label="Notas" value={customer.notes} onChange={(v) => setCustomer({ ...customer, notes: v })} className="md:col-span-2" />
              </div>
            </>
          ) : (
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground">
              <option value="">Selecciona un cliente</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}{c.document_number ? ` — CC ${c.document_number}` : ""}</option>)}
            </select>
          )}
        </Section>

        <Section title="Equipo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Tipo de equipo *" value={device.device_type} onChange={(v) => setDevice({ ...device, device_type: v })} placeholder="Laptop, Celular, etc." required />
            <Field label="Marca" value={device.brand} onChange={(v) => setDevice({ ...device, brand: v })} />
            <Field label="Modelo" value={device.model} onChange={(v) => setDevice({ ...device, model: v })} />
            <Field label="Serial / IMEI" value={device.serial_imei} onChange={(v) => setDevice({ ...device, serial_imei: v })} />
            <Field label="Contraseña" value={device.device_password} onChange={(v) => setDevice({ ...device, device_password: v })} />
            <Field label="Accesorios entregados" value={device.accessories} onChange={(v) => setDevice({ ...device, accessories: v })} placeholder="Cargador, funda..." />
            <Field label="Observaciones físicas" value={device.physical_condition} onChange={(v) => setDevice({ ...device, physical_condition: v })} className="md:col-span-2" />
          </div>
        </Section>

        <Section title="Orden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Falla reportada" value={order.reported_issue} onChange={(v) => setOrder({ ...order, reported_issue: v })} className="md:col-span-2" />
            <Field label="Técnico asignado" value={order.assigned_technician} onChange={(v) => setOrder({ ...order, assigned_technician: v })} />
            <Field label="Fecha estimada" type="date" value={order.estimated_date} onChange={(v) => setOrder({ ...order, estimated_date: v })} />
            <Field label="Garantía (días)" type="number" value={String(order.warranty_days)} onChange={(v) => setOrder({ ...order, warranty_days: Number(v) })} />
            <Field label="Costo (COP)" type="number" value={String(order.cost)} onChange={(v) => setOrder({ ...order, cost: Number(v) })} />
          </div>
        </Section>

        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-md hover:bg-primary/90 uppercase tracking-wider flex items-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Crear orden
        </button>
      </form>
    </div>
  );
};

const Section = ({ title, children }: any) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <h2 className="font-display text-lg font-semibold text-foreground mb-4 uppercase tracking-wider">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = "text", required = false, placeholder = "", className = "" }: any) => (
  <div className={className}>
    <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:border-primary focus:outline-none"
    />
  </div>
);

export default AdminRepairOrderNew;