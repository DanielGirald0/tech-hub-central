import { useEffect, useRef, useState } from "react";
import BackButton from "@/components/BackButton";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2, Upload, MessageCircle, Loader2, Printer, Tag } from "lucide-react";
import { REPAIR_STATUSES, REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, formatCOP, formatDate, formatDateTime, RepairStatus, whatsappLink, buildStatusMessage } from "@/lib/repairs";
import { useAuth } from "@/contexts/AuthContext";

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

  // Genera el HTML con el diseño oficial de la orden (mismo que se imprime).
  const buildOrderHTML = (): string => {
    const c = order.repair_customers;
    const d = order.repair_devices;
    const termsHtml = TERMS.map((t) => `<li>${t}</li>`).join("");
    const esc = (s: any) => String(s ?? "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]!));
    const val = (s: any) => (s && String(s).trim() !== "" ? esc(s) : "—");
    return `<!doctype html><html><head><meta charset="utf-8"><title>Orden ${order.order_number}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        * { box-sizing: border-box; }
        html, body { margin:0; padding:0; background:#fff; }
        body { font-family: Arial, Helvetica, sans-serif; color:#111; font-size:10.5px; line-height:1.35; }
        .header { display:flex; justify-content:space-between; align-items:flex-start;
                  border-bottom:3px solid #D90429; padding-bottom:6px; margin-bottom:8px; }
        .brand h1 { margin:0; font-size:22px; font-weight:900; letter-spacing:2px; }
        .brand .sub { font-size:9.5px; color:#555; text-transform:uppercase; letter-spacing:1px; margin-top:2px; }
        .brand .biz { font-size:9px; color:#666; margin-top:3px; }
        .meta { text-align:right; }
        .meta .num { display:inline-block; border:2px solid #000; padding:4px 10px;
                     font-size:15px; font-weight:900; letter-spacing:2px; }
        .meta .date { font-size:9px; color:#555; margin-top:4px; }
        .meta .status { display:inline-block; margin-top:4px; padding:2px 8px; border:1px solid #000;
                        background:#111; color:#fff; font-size:9px; font-weight:bold;
                        text-transform:uppercase; letter-spacing:1px; border-radius:2px; }
        .section { margin-top:7px; break-inside:avoid; page-break-inside:avoid; }
        .section-title { font-size:9.5px; font-weight:bold; text-transform:uppercase; letter-spacing:1.5px;
                         background:#111; color:#fff; padding:3px 8px; }
        .section-body { border:1px solid #ddd; border-top:none; padding:6px 8px; }
        .kv { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:1px 14px; }
        .kv .item { display:flex; align-items:baseline; padding:2px 0; min-width:0; }
        .kv .item.full { grid-column:1 / -1; }
        .kv .k { font-size:8px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;
                 color:#666; width:82px; flex:0 0 82px; margin-right:8px; }
        .kv .v { color:#111; flex:1 1 auto; min-width:0; word-break:break-word; }
        .kv .v.strong { font-weight:bold; }
        .kv .v.money { font-weight:bold; color:#D90429; }
        .block { padding:3px 0; }
        .block .k { display:block; font-size:8px; font-weight:bold; text-transform:uppercase;
                    letter-spacing:0.5px; color:#666; margin-bottom:2px; }
        .block .v { display:block; white-space:pre-wrap; word-break:break-word; }
        .sign { margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:32px; }
        .sign > div { border-top:1px solid #000; padding-top:3px; text-align:center;
                      font-size:8.5px; text-transform:uppercase; letter-spacing:1px; color:#333; }
        .terms { margin-top:8px; font-size:7px; color:#333; line-height:1.3; }
        .terms-title { font-size:8px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px; }
        .terms ol { padding-left:14px; margin:2px 0; -webkit-column-count:2; column-count:2;
                    -webkit-column-gap:12px; column-gap:12px; }
        .terms li { margin-bottom:2px; break-inside:avoid; }
        .terms .accept { margin-top:5px; font-weight:bold; text-transform:uppercase;
                         font-size:7px; text-align:justify; }
      </style></head><body>
      <div class="header">
        <div class="brand">
          <h1>TECNO GZ</h1>
          <div class="sub">Orden de Servicio Técnico</div>
          <div class="biz">Servicio técnico especializado · Colombia</div>
        </div>
        <div class="meta">
          <div class="num">N° ${esc(order.order_number)}</div>
          <div class="date">Ingreso: ${esc(formatDateTime(order.received_at))}</div>
          <div class="status">${esc(REPAIR_STATUS_LABEL[order.status as RepairStatus])}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Cliente</div>
        <div class="section-body">
          <div class="kv">
            <div class="item"><span class="k">Nombre</span><span class="v strong">${val(c.name)}</span></div>
            <div class="item"><span class="k">Documento</span><span class="v">${val(c.document_number)}</span></div>
            <div class="item"><span class="k">Teléfono</span><span class="v">${val(c.phone)}</span></div>
            <div class="item"><span class="k">Email</span><span class="v">${val(c.email)}</span></div>
            <div class="item full"><span class="k">Dirección</span><span class="v">${val(c.address)}</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Equipo</div>
        <div class="section-body">
          <div class="kv">
            <div class="item"><span class="k">Tipo</span><span class="v">${val(d.device_type)}</span></div>
            <div class="item"><span class="k">Marca / Modelo</span><span class="v strong">${esc([d.brand, d.model].filter(Boolean).join(" ")) || "—"}</span></div>
            <div class="item"><span class="k">Serial / IMEI</span><span class="v">${val(d.serial_imei)}</span></div>
            <div class="item"><span class="k">Contraseña</span><span class="v">${val(d.device_password)}</span></div>
            <div class="item full"><span class="k">Accesorios</span><span class="v">${val(d.accessories)}</span></div>
            <div class="item full"><span class="k">Estado físico</span><span class="v">${val(d.physical_condition)}</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Servicio</div>
        <div class="section-body">
          <div class="block"><span class="k">Falla reportada</span><span class="v">${val(order.reported_issue)}</span></div>
          <div class="block"><span class="k">Diagnóstico</span><span class="v">${val(order.diagnosis)}</span></div>
          <div class="block"><span class="k">Solución</span><span class="v">${val(order.solution)}</span></div>
          <div class="kv" style="margin-top:2px">
            <div class="item"><span class="k">Técnico</span><span class="v">${val(order.assigned_technician)}</span></div>
            <div class="item"><span class="k">Garantía</span><span class="v">${order.warranty_days ? esc(order.warranty_days) + " días" : "—"}</span></div>
            <div class="item"><span class="k">Fecha estimada</span><span class="v">${esc(formatDate(order.estimated_date))}</span></div>
            <div class="item"><span class="k">Valor</span><span class="v money">${esc(formatCOP(Number(order.cost) || 0))}</span></div>
            ${order.delivered_at ? `<div class="item full"><span class="k">Entregado</span><span class="v">${esc(formatDateTime(order.delivered_at))}</span></div>` : ""}
          </div>
        </div>
      </div>

      ${order.internal_notes ? `<div class="section">
        <div class="section-title">Observaciones</div>
        <div class="section-body"><div class="block"><span class="v">${val(order.internal_notes)}</span></div></div>
      </div>` : ""}

      <div class="sign">
        <div>Firma cliente</div>
        <div>Firma técnico / recepción</div>
      </div>

      <div class="terms">
        <div class="terms-title">Garantía y condiciones del servicio</div>
        <ol>${termsHtml}</ol>
        <div class="accept">Al recibir esta orden queda constancia que las condiciones de garantía fueron leídas, comprendidas y aceptadas como firma electrónica del cliente.</div>
      </div>
      </body></html>`;
  };

  // Renderiza el MISMO HTML que se imprime dentro de un iframe oculto, lo captura con
  // html2canvas y lo pagina en A4 cortando solo en bordes de elementos (nunca a mitad de fila).
  const buildOrderPDFBlob = async (): Promise<{ blob: Blob; filename: string }> => {
    const html2canvas = (await import("html2canvas")).default;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "794px"; // ~A4 @ 96dpi
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    try {
      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(buildOrderHTML());
      doc.close();
      // Espera a que estilos y fuentes apliquen
      await new Promise((r) => setTimeout(r, 300));
      try { await (doc as any).fonts?.ready; } catch { /* ignore */ }
      const body = doc.body;
      body.style.margin = "0";
      iframe.style.height = `${body.scrollHeight + 40}px`;
      await new Promise((r) => setTimeout(r, 100));

      const scale = 2;
      const canvas = await html2canvas(body, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: 794,
      });

      const pageWmm = 210;
      const pageHmm = 297;
      const marginMm = 12; // igual que @page en impresión
      const contentWmm = pageWmm - marginMm * 2;
      const pxPerMm = canvas.width / contentWmm;
      const pageContentHpx = (pageHmm - marginMm * 2) * pxPerMm;

      // Posiciones (en px del canvas) donde es seguro cortar: el borde superior de cada elemento.
      const bodyTop = body.getBoundingClientRect().top;
      const breakpoints: number[] = [];
      body
        .querySelectorAll("h2, tr, li, .row, .head, .sign, .terms-title, .accept, table")
        .forEach((el) => {
          const top = (el as HTMLElement).getBoundingClientRect().top - bodyTop;
          if (top > 0) breakpoints.push(Math.floor(top * scale));
        });
      breakpoints.sort((a, b) => a - b);

      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "p" });
      let y = 0;
      let pageIndex = 0;
      while (y < canvas.height - 2) {
        let end = Math.min(y + pageContentHpx, canvas.height);
        if (end < canvas.height) {
          // Corta en el borde de elemento más cercano hacia arriba (evita partir filas).
          const safe = breakpoints.filter((b) => b > y + pageContentHpx * 0.4 && b < end - 4).pop();
          if (safe) end = safe;
        }
        const sliceH = Math.ceil(end - y);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(
          slice.toDataURL("image/jpeg", 0.92),
          "JPEG",
          marginMm,
          marginMm,
          contentWmm,
          sliceH / pxPerMm
        );
        y = end;
        pageIndex++;
      }
      return { blob: pdf.output("blob"), filename: `${order.order_number}.pdf` };
    } finally {
      document.body.removeChild(iframe);
    }
  };

  // Acortador de URL público con varios respaldos. Devuelve la original si todos fallan.
  const shortenUrl = async (url: string): Promise<string> => {
    const providers = [
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
    ];
    for (const p of providers) {
      try {
        const r = await fetch(p);
        if (!r.ok) continue;
        const t = (await r.text()).trim();
        if (t.startsWith("http") && t.length < url.length) return t;
      } catch { /* try next */ }
    }
    return url;
  };

  const notifyWhatsapp = async () => {
    toast({ title: "Generando PDF…" });
    let blob: Blob;
    try {
      const res = await buildOrderPDFBlob();
      blob = res.blob;
    } catch (e: any) {
      toast({ title: "No se pudo generar el PDF", description: e?.message || String(e), variant: "destructive" });
      return;
    }
    const baseMsg = buildStatusMessage(order.order_number, order.status, order.repair_customers.name);

    // Sube el PDF al storage privado y genera un link firmado de larga duración (1 año).
    const path = `${order.id}/${order.order_number}-${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("repair-order-pdfs")
      .upload(path, blob, { contentType: "application/pdf", upsert: true });
    if (upErr) {
      toast({ title: "No se pudo subir el PDF", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("repair-order-pdfs")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr || !signed?.signedUrl) {
      toast({ title: "No se pudo generar el link", description: signErr?.message || "", variant: "destructive" });
      return;
    }

    const shortUrl = await shortenUrl(signed.signedUrl);
    const msg = `${baseMsg}\n\nDescarga tu orden de servicio con las condiciones de garantía aquí:\n${shortUrl}`;
    const digits = (order.repair_customers.phone || "").replace(/\D/g, "").replace(/^57/, "");
    const phone = `57${digits}`;
    const encoded = encodeURIComponent(msg);
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
      return;
    }
    // Escritorio: abre la app de WhatsApp instalada (evita los dominios web bloqueados).
    window.location.href = `whatsapp://send?phone=${phone}&text=${encoded}`;
    // Si la app no se abre (la pestaña conserva el foco), respaldo con WhatsApp Web.
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`, "_blank");
      }
    }, 2500);
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

  // "Imprimir" abre el mismo diseño en una ventana nueva y dispara el diálogo nativo
  // de impresión (el usuario elige imprimir o guardar como PDF).
  // "WhatsApp" sube el PDF renderizado con EXACTAMENTE el mismo HTML.
  const printOrder = () => {
    const html = buildOrderHTML().replace(
      "</body>",
      `<script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print();},250);});<\/script></body>`
    );
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) {
      toast({ title: "Habilita las ventanas emergentes para imprimir", variant: "destructive" });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
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