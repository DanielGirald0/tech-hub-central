import { useEffect, useRef, useState } from "react";
import BackButton from "@/components/BackButton";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Upload, MessageCircle, FileText, Loader2 } from "lucide-react";
import { REPAIR_STATUSES, REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, formatCOP, formatDate, formatDateTime, RepairStatus, whatsappLink, buildStatusMessage } from "@/lib/repairs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdminRepairOrderDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileBefore = useRef<HTMLInputElement>(null);
  const fileAfter = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    const { data } = await (supabase.from as any)("repair_orders")
      .select("*, repair_customers(*), repair_devices(*)")
      .eq("id", id).maybeSingle();
    setOrder(data);
    const { data: h } = await (supabase.from as any)("repair_order_history").select("*").eq("order_id", id).order("created_at", { ascending: false });
    setHistory(h || []);
    const { data: p } = await (supabase.from as any)("repair_order_photos").select("*").eq("order_id", id).order("created_at");
    setPhotos(p || []);
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase.from as any)("repair_orders").update({
      status: order.status,
      diagnosis: order.diagnosis,
      solution: order.solution,
      assigned_technician: order.assigned_technician,
      cost: Number(order.cost) || 0,
      estimated_date: order.estimated_date || null,
      warranty_days: Number(order.warranty_days) || 0,
      delivered_at: order.status === "entregado" && !order.delivered_at ? new Date().toISOString() : order.delivered_at,
      internal_notes: order.internal_notes,
    }).eq("id", id);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Cambios guardados" }); load(); }
  };

  const uploadPhoto = async (file: File, label: string) => {
    setUploading(true);
    const path = `${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("repair-photos").upload(path, file, { upsert: false });
    if (error) { toast({ title: "Error al subir", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("repair-photos").getPublicUrl(path);
    await (supabase.from as any)("repair_order_photos").insert({ order_id: id, url: pub.publicUrl, label });
    setUploading(false);
    load();
  };

  const deletePhoto = async (photoId: string, url: string) => {
    const path = url.split("/repair-photos/")[1];
    if (path) await supabase.storage.from("repair-photos").remove([path]);
    await (supabase.from as any)("repair_order_photos").delete().eq("id", photoId);
    load();
  };

  const notifyWhatsapp = () => {
    const msg = buildStatusMessage(order.order_number, order.status, order.repair_customers.name);
    window.open(whatsappLink(order.repair_customers.phone, msg), "_blank");
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("TECNO GZ — Orden de Servicio", 14, 18);
    doc.setFontSize(11);
    doc.text(`Orden: ${order.order_number}`, 14, 28);
    doc.text(`Fecha: ${formatDate(order.received_at)}`, 14, 34);
    doc.text(`Estado: ${REPAIR_STATUS_LABEL[order.status as RepairStatus]}`, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [["Cliente", ""]],
      body: [
        ["Nombre", order.repair_customers.name],
        ["Teléfono", order.repair_customers.phone],
        ["Email", order.repair_customers.email || "—"],
        ["Dirección", order.repair_customers.address || "—"],
      ],
    });
    autoTable(doc, {
      head: [["Equipo", ""]],
      body: [
        ["Tipo", order.repair_devices.device_type],
        ["Marca / Modelo", `${order.repair_devices.brand} ${order.repair_devices.model}`],
        ["Serial / IMEI", order.repair_devices.serial_imei || "—"],
        ["Accesorios", order.repair_devices.accessories || "—"],
        ["Estado físico", order.repair_devices.physical_condition || "—"],
      ],
    });
    autoTable(doc, {
      head: [["Servicio", ""]],
      body: [
        ["Falla reportada", order.reported_issue || "—"],
        ["Diagnóstico", order.diagnosis || "—"],
        ["Solución", order.solution || "—"],
        ["Técnico", order.assigned_technician || "—"],
        ["Costo", formatCOP(Number(order.cost))],
        ["Garantía", order.warranty_days ? `${order.warranty_days} días` : "—"],
        ["Fecha estimada", formatDate(order.estimated_date)],
      ],
    });
    doc.save(`${order.order_number}.pdf`);
  };

  const remove = async () => {
    if (!confirm("¿Eliminar esta orden? Esta acción no se puede deshacer.")) return;
    await (supabase.from as any)("repair_orders").delete().eq("id", id);
    window.location.href = "/admin/repairs/orders";
  };

  if (!order) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <BackButton />
      <Link to="/admin/repairs/orders" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{order.order_number}</h1>
          <p className="text-muted-foreground text-sm">Ingreso: {formatDateTime(order.received_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={notifyWhatsapp} className="bg-[#25D366] text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:opacity-90"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
          <button onClick={generatePDF} className="bg-secondary text-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-secondary/80"><FileText className="w-4 h-4" /> PDF</button>
          <button onClick={remove} className="bg-destructive/20 text-red-300 border border-red-500/30 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card title="Cliente y equipo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Info label="Cliente" value={order.repair_customers.name} />
              <Info label="Teléfono" value={order.repair_customers.phone} />
              <Info label="Email" value={order.repair_customers.email} />
              <Info label="Dirección" value={order.repair_customers.address} />
              <Info label="Equipo" value={`${order.repair_devices.device_type} ${order.repair_devices.brand} ${order.repair_devices.model}`} />
              <Info label="Serial/IMEI" value={order.repair_devices.serial_imei} />
              <Info label="Contraseña" value={order.repair_devices.device_password} />
              <Info label="Accesorios" value={order.repair_devices.accessories} />
              <Info label="Observaciones físicas" value={order.repair_devices.physical_condition} className="md:col-span-2" />
            </div>
          </Card>

          <Card title="Diagnóstico y reparación">
            <Info label="Falla reportada" value={order.reported_issue} className="mb-3" />
            <TextArea label="Diagnóstico" value={order.diagnosis} onChange={(v) => setOrder({ ...order, diagnosis: v })} />
            <TextArea label="Solución realizada" value={order.solution} onChange={(v) => setOrder({ ...order, solution: v })} />
            <TextArea label="Notas internas" value={order.internal_notes} onChange={(v) => setOrder({ ...order, internal_notes: v })} />
          </Card>

          <Card title="Fotos del equipo">
            <div className="flex flex-wrap gap-3 mb-4">
              <button type="button" onClick={() => fileBefore.current?.click()} disabled={uploading} className="bg-secondary text-foreground px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-secondary/80">
                <Upload className="w-4 h-4" /> Subir foto ANTES
              </button>
              <input ref={fileBefore} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "antes")} />
              <button type="button" onClick={() => fileAfter.current?.click()} disabled={uploading} className="bg-secondary text-foreground px-3 py-2 rounded-md text-sm flex items-center gap-2 hover:bg-secondary/80">
                <Upload className="w-4 h-4" /> Subir foto DESPUÉS
              </button>
              <input ref={fileAfter} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], "despues")} />
              {uploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="relative group">
                  <img src={p.url} alt={p.label} className="w-full h-32 object-cover rounded-md border border-border" />
                  <span className="absolute top-1 left-1 bg-background/80 text-foreground text-[10px] px-2 py-0.5 rounded uppercase">{p.label}</span>
                  <button onClick={() => deletePhoto(p.id, p.url)} className="absolute top-1 right-1 bg-destructive/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Sin fotos cargadas.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Estado y costos">
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Estado</label>
            <select value={order.status} onChange={(e) => setOrder({ ...order, status: e.target.value })} className={`w-full rounded-md px-3 py-2 text-sm font-semibold border mb-3 ${REPAIR_STATUS_COLOR[order.status as RepairStatus]}`} style={{ colorScheme: "dark" }}>
              {REPAIR_STATUSES.map((s) => <option key={s} value={s} className="bg-card text-foreground">{REPAIR_STATUS_LABEL[s]}</option>)}
            </select>
            <Editable label="Técnico asignado" value={order.assigned_technician} onChange={(v) => setOrder({ ...order, assigned_technician: v })} />
            <Editable label="Costo (COP)" type="number" value={order.cost} onChange={(v) => setOrder({ ...order, cost: v })} />
            <Editable label="Garantía (días)" type="number" value={order.warranty_days} onChange={(v) => setOrder({ ...order, warranty_days: v })} />
            <Editable label="Fecha estimada" type="date" value={order.estimated_date?.slice(0, 10) || ""} onChange={(v) => setOrder({ ...order, estimated_date: v })} />
            {order.delivered_at && <Info label="Entregado" value={formatDateTime(order.delivered_at)} className="mt-2" />}
            <button onClick={save} disabled={saving} className="mt-4 w-full bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:bg-primary/90 uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
            </button>
          </Card>

          <Card title="Historial">
            <ol className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${REPAIR_STATUS_COLOR[h.to_status as RepairStatus]}`}>
                      {REPAIR_STATUS_LABEL[h.to_status as RepairStatus]}
                    </span>
                    <div className="text-muted-foreground mt-0.5">{formatDateTime(h.created_at)}</div>
                  </div>
                </li>
              ))}
              {history.length === 0 && <p className="text-xs text-muted-foreground">Sin movimientos.</p>}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, children }: any) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <h2 className="font-display text-base font-semibold text-foreground mb-3 uppercase tracking-wider">{title}</h2>
    {children}
  </div>
);
const Info = ({ label, value, className = "" }: any) => (
  <div className={className}>
    <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-foreground text-sm">{value || "—"}</div>
  </div>
);
const Editable = ({ label, value, onChange, type = "text" }: any) => (
  <div className="mb-3">
    <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
    <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
  </div>
);
const TextArea = ({ label, value, onChange }: any) => (
  <div className="mb-3">
    <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
    <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
  </div>
);

export default AdminRepairOrderDetail;