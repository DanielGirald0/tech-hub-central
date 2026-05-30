export const REPAIR_STATUSES = [
  "recibido",
  "en_diagnostico",
  "pendiente_aprobacion",
  "aprobado",
  "esperando_repuesto",
  "en_reparacion",
  "reparado",
  "listo_entrega",
  "entregado",
  "garantia",
  "cancelado",
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export const REPAIR_STATUS_LABEL: Record<RepairStatus, string> = {
  recibido: "Recibido",
  en_diagnostico: "En diagnóstico",
  pendiente_aprobacion: "Pendiente de aprobación",
  aprobado: "Aprobado",
  esperando_repuesto: "Esperando repuesto",
  en_reparacion: "En reparación",
  reparado: "Reparado",
  listo_entrega: "Listo para entregar",
  entregado: "Entregado",
  garantia: "Garantía",
  cancelado: "Cancelado",
};

export const REPAIR_STATUS_COLOR: Record<RepairStatus, string> = {
  recibido: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  en_diagnostico: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  pendiente_aprobacion: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  aprobado: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  esperando_repuesto: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  en_reparacion: "bg-blue-700/30 text-blue-200 border-blue-700/40",
  reparado: "bg-green-400/20 text-green-200 border-green-400/30",
  listo_entrega: "bg-green-500/30 text-green-200 border-green-500/40",
  entregado: "bg-green-800/40 text-green-100 border-green-800/50",
  garantia: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  cancelado: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

export const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const formatDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—";

export const normalizePhone = (p: string) => (p || "").replace(/\D/g, "");

export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/57${normalizePhone(phone).replace(/^57/, "")}?text=${encodeURIComponent(text)}`;

export const buildStatusMessage = (orderNumber: string, status: RepairStatus, customerName: string) =>
  `Hola ${customerName}, tu orden de servicio *${orderNumber}* en TECNO GZ ha cambiado de estado a: *${REPAIR_STATUS_LABEL[status]}*. Puedes consultar el detalle en https://tecnogz.com/seguimiento`;