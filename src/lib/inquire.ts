const WHATSAPP_PHONE = "573107476909";

export const buildInquireUrl = (product: { name: string; reference?: string | null; sku?: string | null; id?: string }) => {
  const ref = product.reference || product.sku || product.id || "—";
  const message =
    `Hola, deseo consultar el precio del siguiente producto:\n\n` +
    `Producto: ${product.name}\n` +
    `Referencia: ${ref}\n\n` +
    `¿Podrían indicarme el valor actual?`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
};

export const openInquireWhatsApp = (product: { name: string; reference?: string | null; sku?: string | null; id?: string }) => {
  window.open(buildInquireUrl(product), "_blank", "noopener,noreferrer");
};