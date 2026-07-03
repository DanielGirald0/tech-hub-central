import { useEffect, useRef, useState } from "react";
import BackButton from "@/components/BackButton";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Upload, MessageCircle, Loader2, Printer, Tag } from "lucide-react";
import { REPAIR_STATUSES, REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, formatCOP, formatDate, formatDateTime, RepairStatus, whatsappLink, buildStatusMessage } from "@/lib/repairs";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdminRepairOrderDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const [order, setOrder] = useState<any>(null);
  const [originalStatus, setOriginalStatus] = useState<RepairStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [technicians, setTechnicians] = useState<{ user_id: string; name: string }[]>([]);
  const fileBefore = useRef<HTMLInputElement>(null);
  const fileAfter = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    const { data } = await (supabase.from as any)("repair_orders")
      .select("*, repair_customers(*), repair_devices(*)")
      .eq("id", id).maybeSingle();
    setOrder(data);
    setOriginalStatus(data?.status ?? null);
    setStatusNote("");
    const { data: h } = await (supabase.from as any)("repair_order_history").select("*").eq("order_id", id).order("created_at", { ascending: false });
    setHistory(h || []);
    const { data: p } = await (supabase.from as any)("repair_order_photos").select("*").eq("order_id", id).order("created_at");
    const list = p || [];
    // Generate signed URLs (bucket is private)
    const signed = await Promise.all(list.map(async (ph: any) => {
      const path = ph.url?.split("/repair-photos/")[1] || ph.url;
      const { data: s } = await supabase.storage.from("repair-photos").createSignedUrl(path, 3600);
      return { ...ph, displayUrl: s?.signedUrl || ph.url };
    }));
    setPhotos(signed);
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    (supabase.rpc as any)("get_all_users").then(({ data }: any) => {
      const staff = (data || []).filter((u: any) => u.role === "technician" || u.role === "admin");
      setTechnicians(staff.map((u: any) => ({ user_id: u.user_id, name: u.name || u.email })));
    });
  }, []);

  const save = async () => {
    if (!order?.cost && order.status === "entregado") {
      if (!confirm("La orden no tiene costo registrado. ¿Marcar como entregada de todos modos?")) return;
    }
    const statusChanged = originalStatus && order.status !== originalStatus;
    setSaving(true);
    const { error } = await (supabase.from as any)("repair_orders").update({
      status: order.status,
      diagnosis: order.diagnosis,
      solution: order.solution,
      assigned_technician: order.assigned_technician,
      assigned_technician_id: order.assigned_technician_id || null,
      cost: Number(order.cost) || 0,
      estimated_date: order.estimated_date || null,
      warranty_days: Number(order.warranty_days) || 0,
      delivered_at: order.status === "entregado" && !order.delivered_at ? new Date().toISOString() : order.delivered_at,
      internal_notes: order.internal_notes,
    }).eq("id", id);
    if (error) {
      setSaving(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // Persist note on the status-change history row created by the trigger
    if (statusChanged && statusNote.trim()) {
      const { data: lastHist } = await (supabase.from as any)("repair_order_history")
        .select("id")
        .eq("order_id", id)
        .eq("to_status", order.status)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastHist?.id) {
        await (supabase.from as any)("repair_order_history").update({ note: statusNote.trim() }).eq("id", lastHist.id);
      }
    }
    setSaving(false);
    toast({ title: "Cambios guardados" });
    load();
  };

  const uploadPhoto = async (file: File, label: string) => {
    setUploading(true);
    const path = `${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("repair-photos").upload(path, file, { upsert: false });
    if (error) { toast({ title: "Error al subir", description: error.message, variant: "destructive" }); setUploading(false); return; }
    // Store the storage path; signed URLs are generated on read
    await (supabase.from as any)("repair_order_photos").insert({ order_id: id, url: path, label });
    setUploading(false);
    load();
  };

  const deletePhoto = async (photoId: string, url: string) => {
    const path = url.includes("/repair-photos/") ? url.split("/repair-photos/")[1] : url;
    if (path) await supabase.storage.from("repair-photos").remove([path]);
    await (supabase.from as any)("repair_order_photos").delete().eq("id", photoId);
    load();
  };

  const TERMS: string[] = [
    "La garantía por cambio de display, táctil, carcasas, reparaciones en software y apertura de bandas es contra entrega.",
    "De ninguna manera se responde por equipos que hayan sido reportados como perdidos o robados, se presume que todo equipo es de buena procedencia, si este equipo es requerido por la autoridad se entregará y no se responderá por su valor.",
    "Si el equipo está mojado, desarmado o golpeado, entra al taller con riesgo de que se apague o empeore en el procedimiento de revisión o reparación.",
    "La garantía por reparación no es aplicable si el equipo entra por un daño diferente al reportado en el momento de su ingreso, si el daño reportado no lo presenta en el momento en que el cliente recibe y cancela la orden de trabajo. Si el equipo muestra señales de contaminación por líquidos o sólidos antes y después de la reparación, si el equipo es abierto después de reparado. Sí pasa el tiempo de garantía estipulado en la orden de servicio. Si el equipo después de 15 días sin reclamar con su debida factura en el almacén, deberá cancelar por bodegaje $3.000 semanales y se declarará en abandono según lo estipulado en el art. 18 de la ley 1480 de Colombia.",
    "El diagnóstico del equipo ingresado se dará en los próximos 3 días hábiles.",
    "Bajo ninguna circunstancia se responderá por accesorios extraíbles del celular como: pilas, carcasas, memorias, cargadores, Sim Card, y su información, etc.",
    "Los equipos que se destapan por la pantalla se corre el riesgo de que se reviente el Display o pantalla, lo cual si ocurre en el proceso de reparación no nos hacemos responsables.",
    "Todo equipo que requiera de una actualización de software corre el riesgo de quedarse apagado lo cual no nos hacemos responsables.",
    "Los iPhone de serie 11 en adelante se corre un riesgo más alto de que dañe la pantalla en el proceso de desarme.",
    "Los procesos de reparación de Board tienen riesgo de que el equipo se pueda quedar apagado.",
    "La garantía es de 1 mes solo en el trabajo que se le hace al equipo.",
    "Las pantallas Genéricas de iPhone 11 en adelante no tienen garantía si se actualizan a iOs 18 o posterior.",
    "TODO DIAGNÓSTICO TIENE UN VALOR DE $30.000 (CELULARES) $40.000 PORTÁTILES Y TORRES Y TODO EN UNO.",
  ];

  const buildOrderPDF = (): { doc: jsPDF; filename: string } => {
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
    autoTable(doc, {
      head: [["Garantía y condiciones sobre orden de servicio en hardware y software de dispositivos móviles y portátiles"]],
      body: TERMS.map((t, i) => [`${i + 1}. ${t}`]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fontSize: 8, fillColor: [217, 4, 41] },
    });
    autoTable(doc, {
      body: [[
        "AL RECIBIR ESTE MENSAJE QUEDA CONSTANCIA QUE LO PLASMADO EN LA GARANTÍA Y ORDEN DE SERVICIO FUE LEÍDO, COMPRENDIDO Y ACEPTADO COMO SU FIRMA ELECTRÓNICA. CONSERVAR LA FACTURA PARA RECLAMAR EL DISPOSITIVO MÓVIL, EN CASO DE PÉRDIDA REPORTARLA LO ANTES POSIBLE, YA QUE EL DISPOSITIVO MÓVIL PODRÍA SER ENTREGADO AL PORTADOR DE ESTA.",
      ]],
      styles: { fontSize: 8, cellPadding: 3, fontStyle: "bold" },
    });
    return { doc, filename: `${order.order_number}.pdf` };
  };

  const notifyWhatsapp = async () => {
    const { doc, filename } = buildOrderPDF();
    const blob = doc.output("blob");
    const file = new File([blob], filename, { type: "application/pdf" });
    const msg = buildStatusMessage(order.order_number, order.status, order.repair_customers.name);

    // Try native share (works on móvil con WhatsApp instalado)
    const nav: any = navigator;
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], text: msg, title: `Orden ${order.order_number}` });
        return;
      } catch {
        /* usuario canceló o falló, hacemos fallback */
      }
    }

    // Fallback: descargar el PDF y abrir WhatsApp con el mensaje para adjuntarlo manualmente
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast({
      title: "PDF descargado",
      description: "Adjunta el archivo en la ventana de WhatsApp que se abrirá.",
    });
    window.open(whatsappLink(order.repair_customers.phone, msg), "_blank");
  };

  const printHTML = (html: string) => {
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) { toast({ title: "Habilita las ventanas emergentes para imprimir", variant: "destructive" }); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  const printTicket = () => {
    const c = order.repair_customers;
    const d = order.repair_devices;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${order.order_number}</title>
      <style>
        @page { size: 80mm auto; margin: 3mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; width: 74mm; margin: 0; padding: 2mm; color: #000; font-size: 11px; line-height: 1.35; }
        .center { text-align: center; }
        h1 { font-size: 14px; margin: 0 0 2px; letter-spacing: 1px; }
        h2 { font-size: 22px; margin: 4px 0; letter-spacing: 2px; border: 2px solid #000; padding: 4px 0; }
        .row { display: flex; justify-content: space-between; gap: 4px; margin: 1px 0; }
        .label { font-weight: bold; text-transform: uppercase; font-size: 9px; }
        hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
        .small { font-size: 9px; }
        .box { border: 1px solid #000; padding: 3px; margin-top: 3px; }
      </style></head><body>
      <div class="center"><h1>TECNO GZ</h1><div class="small">Servicio Técnico</div></div>
      <h2 class="center">${order.order_number}</h2>
      <div class="center small">${formatDateTime(order.received_at)}</div>
      <hr/>
      <div class="row"><span class="label">Cliente</span></div>
      <div>${c.name || "—"}</div>
      <div class="small">Tel: ${c.phone || "—"}</div>
      <hr/>
      <div class="row"><span class="label">Equipo</span></div>
      <div>${(d.device_type || "") } ${(d.brand || "")} ${(d.model || "")}</div>
      ${d.serial_imei ? `<div class="small">S/N: ${d.serial_imei}</div>` : ""}
      ${d.device_password ? `<div class="small">Clave: ${d.device_password}</div>` : ""}
      ${d.accessories ? `<div class="small">Accesorios: ${d.accessories}</div>` : ""}
      <hr/>
      <div class="label">Falla reportada</div>
      <div class="small">${(order.reported_issue || "—").replace(/</g,"&lt;")}</div>
      ${order.estimated_date ? `<div class="box small"><b>Entrega estimada:</b> ${formatDate(order.estimated_date)}</div>` : ""}
      <hr/>
      <div class="center small">Consulta el estado en<br/>tecnogz.com/rastrear-reparacion</div>
      </body></html>`;
    printHTML(html);
  };

  const printOrder = () => {
    const c = order.repair_customers;
    const d = order.repair_devices;
    const photosHtml = photos.map((p) => `<div style="display:inline-block;margin:4px;text-align:center"><img src="${p.displayUrl}" style="width:220px;height:160px;object-fit:cover;border:1px solid #333"/><div style="font-size:10px;text-transform:uppercase">${p.label}</div></div>`).join("");
    const historyHtml = history.map((h) => `<tr><td>${formatDateTime(h.created_at)}</td><td>${REPAIR_STATUS_LABEL[h.to_status as RepairStatus]}</td><td>${h.note || ""}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Orden ${order.order_number}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: Arial, sans-serif; color: #000; font-size: 12px; margin: 0; }
        h1 { margin: 0; font-size: 22px; letter-spacing: 2px; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #000; padding-bottom: 2px; margin: 14px 0 6px; }
        .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #D90429; padding-bottom: 8px; }
        .badge { border: 2px solid #000; padding: 6px 12px; font-size: 20px; font-weight: bold; letter-spacing: 2px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
        .row { display: flex; gap: 6px; padding: 2px 0; border-bottom: 1px dotted #999; }
        .label { font-weight: bold; text-transform: uppercase; font-size: 10px; min-width: 110px; color:#555; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
        th { background: #f0f0f0; text-transform: uppercase; font-size: 10px; }
        .sign { margin-top: 36px; display: flex; justify-content: space-between; gap: 24px; }
        .sign > div { flex: 1; border-top: 1px solid #000; padding-top: 4px; text-align: center; font-size: 10px; text-transform: uppercase; }
        .terms { font-size: 9px; color:#333; margin-top: 12px; line-height: 1.4; }
        .terms-title { font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
        .terms ol { padding-left: 16px; margin: 4px 0; }
        .terms li { margin-bottom: 3px; }
        .terms .accept { margin-top: 8px; font-weight: bold; text-transform: uppercase; font-size: 9px; }
      </style></head><body>
      <div class="head">
        <div>
          <h1>TECNO GZ</h1>
          <div style="font-size:11px">Orden de Servicio Técnico</div>
          <div style="font-size:10px;color:#555">Ingreso: ${formatDateTime(order.received_at)}</div>
        </div>
        <div class="badge">${order.order_number}</div>
      </div>

      <h2>Cliente</h2>
      <div class="grid">
        <div class="row"><span class="label">Nombre</span><span>${c.name || "—"}</span></div>
        <div class="row"><span class="label">Documento</span><span>${c.document_number || "—"}</span></div>
        <div class="row"><span class="label">Teléfono</span><span>${c.phone || "—"}</span></div>
        <div class="row"><span class="label">Email</span><span>${c.email || "—"}</span></div>
        <div class="row" style="grid-column:1/-1"><span class="label">Dirección</span><span>${c.address || "—"}</span></div>
      </div>

      <h2>Equipo recibido</h2>
      <div class="grid">
        <div class="row"><span class="label">Tipo</span><span>${d.device_type || "—"}</span></div>
        <div class="row"><span class="label">Marca / Modelo</span><span>${(d.brand || "")} ${(d.model || "")}</span></div>
        <div class="row"><span class="label">Serial / IMEI</span><span>${d.serial_imei || "—"}</span></div>
        <div class="row"><span class="label">Contraseña</span><span>${d.device_password || "—"}</span></div>
        <div class="row" style="grid-column:1/-1"><span class="label">Accesorios</span><span>${d.accessories || "—"}</span></div>
        <div class="row" style="grid-column:1/-1"><span class="label">Estado físico</span><span>${d.physical_condition || "—"}</span></div>
      </div>

      <h2>Servicio</h2>
      <div class="grid">
        <div class="row" style="grid-column:1/-1"><span class="label">Falla reportada</span><span>${(order.reported_issue || "—").replace(/</g,"&lt;")}</span></div>
        <div class="row" style="grid-column:1/-1"><span class="label">Diagnóstico</span><span>${(order.diagnosis || "—").replace(/</g,"&lt;")}</span></div>
        <div class="row" style="grid-column:1/-1"><span class="label">Solución</span><span>${(order.solution || "—").replace(/</g,"&lt;")}</span></div>
        <div class="row"><span class="label">Técnico</span><span>${order.assigned_technician || "—"}</span></div>
        <div class="row"><span class="label">Estado</span><span>${REPAIR_STATUS_LABEL[order.status as RepairStatus]}</span></div>
        <div class="row"><span class="label">Costo</span><span>${formatCOP(Number(order.cost) || 0)}</span></div>
        <div class="row"><span class="label">Garantía</span><span>${order.warranty_days ? order.warranty_days + " días" : "—"}</span></div>
        <div class="row"><span class="label">Fecha estimada</span><span>${formatDate(order.estimated_date)}</span></div>
        ${order.delivered_at ? `<div class="row"><span class="label">Entregado</span><span>${formatDateTime(order.delivered_at)}</span></div>` : ""}
      </div>

      ${history.length ? `<h2>Historial</h2>
      <table><thead><tr><th>Fecha</th><th>Estado</th><th>Nota</th></tr></thead><tbody>${historyHtml}</tbody></table>` : ""}

      ${photos.length ? `<h2>Fotos</h2><div>${photosHtml}</div>` : ""}

      <div class="terms">
        <div class="terms-title">Garantía y condiciones sobre orden de servicio en hardware y software de dispositivos móviles y portátiles.</div>
        <ol>
          <li>La garantía por cambio de display, táctil, carcasas, reparaciones en software y apertura de bandas es contra entrega.</li>
          <li>De ninguna manera se responde por equipos que hayan sido reportados como perdidos o robados, se presume que todo equipo es de buena procedencia, si este equipo es requerido por la autoridad se entregará y no se responderá por su valor.</li>
          <li>Si el equipo está mojado, desarmado o golpeado, entra al taller con riesgo de que se apague o empeore en el procedimiento de revisión o reparación.</li>
          <li>La garantía por reparación no es aplicable si el equipo entra por un daño diferente al reportado en el momento de su ingreso, si el daño reportado no lo presenta en el momento en que el cliente recibe y cancela la orden de trabajo. Si el equipo muestra señales de contaminación por líquidos o sólidos antes y después de la reparación, si el equipo es abierto después de reparado. Sí pasa el tiempo de garantía estipulado en la orden de servicio. <b>Si el equipo después de 15 días sin reclamar con su debida factura en el almacén, deberá cancelar por bodegaje $ 3.000 semanales y se declarará en abandono según lo estipulado en el art. 18 de la ley 1480 de Colombia.</b></li>
          <li>El diagnóstico del equipo ingresado se dará en los próximos 3 días hábiles.</li>
          <li>Bajo ninguna circunstancia se responderá por accesorios extraíbles del celular como: pilas, carcasas, memorias, cargadores, Sim Card, y su información, etc.</li>
          <li>Los equipos que se destapan por la pantalla se corre el riesgo de que se reviente el Display o pantalla, lo cual si ocurre en el proceso de reparación no nos hacemos responsables.</li>
          <li>Todo equipo que requiera de una actualización de software corre el riesgo de quedarse apagado lo cual no nos hacemos responsables.</li>
          <li>Los iPhone de serie 11 en adelante se corre un riesgo más alto de que dañe la pantalla en el proceso de desarme.</li>
          <li>Los procesos de reparación de Board tienen riesgo de que el equipo se pueda quedar apagado.</li>
          <li>La garantía es de 1 mes solo en el trabajo que se le hace al equipo.</li>
          <li>Las pantallas Genéricas de iPhone 11 en adelante no tienen garantía si se actualizan a iOs 18 o posterior.</li>
          <li><b>Todo diagnóstico tiene un valor de $30.000 (celulares) $40.000 portátiles y torres y todo en uno.</b></li>
        </ol>
        <div class="accept">Al recibir este mensaje queda constancia que lo plasmado en la garantía y orden de servicio fue leído, comprendido y aceptado como su firma electrónica. Conservar la factura para reclamar el dispositivo móvil, en caso de pérdida reportarla lo antes posible, ya que el dispositivo móvil podría ser entregado al portador de esta.</div>
      </div>

      <div class="sign">
        <div>Firma cliente</div>
        <div>Firma técnico / recepción</div>
      </div>
      </body></html>`;
    printHTML(html);
  };

  const remove = async () => {
    if (!isAdmin) return;
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
          <button onClick={printTicket} className="bg-secondary text-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-secondary/80" title="Ticket adhesivo para el equipo"><Tag className="w-4 h-4" /> Ticket</button>
          <button onClick={printOrder} className="bg-secondary text-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-secondary/80" title="Imprimir orden completa"><Printer className="w-4 h-4" /> Imprimir</button>
          {isAdmin && (
            <button onClick={remove} className="bg-destructive/20 text-red-300 border border-red-500/30 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2" title="Eliminar orden"><Trash2 className="w-4 h-4" /></button>
          )}
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
                  <img src={p.displayUrl || p.url} alt={p.label} className="w-full h-32 object-cover rounded-md border border-border" />
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
            {originalStatus && order.status !== originalStatus && (
              <div className="mb-3">
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Nota del cambio (opcional)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                  placeholder="Ej: Equipo aprobado por cliente vía WhatsApp"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            )}
            <div className="mb-3">
              <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Técnico asignado</label>
              <select
                value={order.assigned_technician_id || ""}
                onChange={(e) => {
                  const id = e.target.value;
                  const t = technicians.find((x) => x.user_id === id);
                  setOrder({ ...order, assigned_technician_id: id || null, assigned_technician: t?.name || order.assigned_technician });
                }}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">{order.assigned_technician || "— Sin asignar —"}</option>
                {technicians.map((t) => <option key={t.user_id} value={t.user_id}>{t.name}</option>)}
              </select>
            </div>
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
                    {h.note && <div className="text-foreground mt-1 text-[11px] italic">{h.note}</div>}
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