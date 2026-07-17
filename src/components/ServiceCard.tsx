import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Service } from "@/data/products";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ServiceCardProps {
  service: Service;
}

const requestSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  email: z.string().trim().email("Email inválido").max(255).or(z.literal("")).optional(),
  phone: z.string().trim().min(1, "El teléfono es obligatorio").max(30),
  document: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
  device_type: z.string().trim().max(200).optional().default(""),
  brand: z.string().trim().max(100).optional().default(""),
  model: z.string().trim().max(100).optional().default(""),
  serial: z.string().trim().max(100).optional().default(""),
  accessories: z.string().trim().max(300).optional().default(""),
  message: z.string().trim().max(1000).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
});

type FormData = z.infer<typeof requestSchema>;

const openWhatsApp = (service: Service, data: FormData, orderNumber: string) => {
  const text = encodeURIComponent(
    `Hola, acabo de registrar una orden de servicio técnico.\n\nOrden N°: ${orderNumber}\nNombre: ${data.full_name}\nTeléfono: ${data.phone}\nCorreo: ${data.email || "—"}\nServicio: ${service.name}\nEquipo: ${[data.device_type, data.brand, data.model].filter(Boolean).join(" ") || "No especificado"}\nFalla: ${data.message || "No especificada"}`
  );
  window.open(`https://wa.me/573107476909?text=${text}`, "_blank");
};

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isRepair = service.category === "reparacion" || service.category === "mantenimiento";
  const [form, setForm] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    document: "",
    address: "",
    device_type: "",
    brand: "",
    model: "",
    serial: "",
    accessories: "",
    message: "",
    notes: "",
  });

  const handleClick = () => {
    if (!isRepair) {
      const text = encodeURIComponent(
        `Hola, estoy interesado en el siguiente servicio:\n\nServicio: ${service.name}\n\nMe gustaría recibir más información y una cotización.\n\nGracias.`
      );
      window.open(`https://wa.me/573107476909?text=${text}`, "_blank", "noopener,noreferrer");
      return;
    }
    setCreatedOrder(null);
    if (user && profile) {
      setForm({
        full_name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        document: (profile as any).document_number || "",
        address: "",
        device_type: "",
        brand: "", model: "", serial: "", accessories: "",
        message: "",
        notes: "",
      });
    } else {
      setForm({ full_name: "", email: "", phone: "", document: "", address: "", device_type: "", brand: "", model: "", serial: "", accessories: "", message: "", notes: "" });
    }
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = requestSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const d = result.data;
    const { data, error } = await (supabase.rpc as any)("create_customer_repair_order", {
      p_name: d.full_name,
      p_phone: d.phone,
      p_email: d.email || "",
      p_document: d.document || "",
      p_address: d.address || "",
      p_device_type: d.device_type || "",
      p_brand: d.brand || "",
      p_model: d.model || "",
      p_serial: d.serial || "",
      p_accessories: d.accessories || "",
      p_category: service.name,
      p_reported_issue: d.message || "",
      p_notes: d.notes || "",
    });

    setLoading(false);
    if (error) {
      console.error("Error creating repair order:", error);
      toast({ title: "No se pudo registrar la orden", description: error.message, variant: "destructive" });
      return;
    }
    const orderNumber = data?.[0]?.order_number || "";
    setCreatedOrder(orderNumber);
    toast({ title: "Orden de servicio creada", description: `N° ${orderNumber}` });
    openWhatsApp(service, d, orderNumber);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <>
      <div className="group bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300">
        <div className="text-3xl mb-4">{service.icon}</div>
        <h3 className="font-display font-semibold text-foreground mb-2">{service.name}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
        {service.price && (
          <p className="text-sm font-semibold text-primary mb-4">{service.price}</p>
        )}
        <button
          onClick={handleClick}
          disabled={loading}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline group-hover:gap-2 transition-all disabled:opacity-50"
        >
          {loading ? "Enviando..." : isRepair ? "Crear orden de servicio" : "Obtener información"}{" "}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Servicio Técnico: {service.name}</DialogTitle>
            <DialogDescription>
              Se generará una Orden de Servicio Técnico con la información del cliente, el equipo y la falla.
            </DialogDescription>
          </DialogHeader>
          {createdOrder ? (
            <div className="space-y-4 text-sm">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <p className="text-foreground font-medium">Orden creada exitosamente</p>
                <p className="text-muted-foreground mt-1">Número de orden: <span className="font-bold text-foreground">{createdOrder}</span></p>
              </div>
              <p className="text-muted-foreground">Puedes seguir el estado de tu reparación con tu número de orden y teléfono.</p>
              <div className="flex gap-2">
                <Link to="/seguimiento" className="flex-1">
                  <Button variant="outline" className="w-full">Ir a seguimiento</Button>
                </Link>
                <Button onClick={() => setOpen(false)} className="flex-1">Cerrar</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Datos del cliente</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name">Nombre completo *</Label>
                    <Input id="full_name" value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
                    {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="document">Documento</Label>
                    <Input id="document" value={form.document} onChange={(e) => updateField("document", e.target.value)} inputMode="numeric" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+57 300 1234567" />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Correo</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Datos del equipo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="device_type">Tipo de equipo</Label>
                    <Input id="device_type" value={form.device_type} onChange={(e) => updateField("device_type", e.target.value)} placeholder="Portátil, celular, impresora..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="brand">Marca</Label>
                    <Input id="brand" value={form.brand} onChange={(e) => updateField("brand", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="model">Modelo</Label>
                    <Input id="model" value={form.model} onChange={(e) => updateField("model", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="serial">Serial o IMEI</Label>
                    <Input id="serial" value={form.serial} onChange={(e) => updateField("serial", e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="accessories">Accesorios entregados</Label>
                    <Input id="accessories" value={form.accessories} onChange={(e) => updateField("accessories", e.target.value)} placeholder="Cargador, funda, cable..." />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Datos del servicio</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Descripción de la falla</Label>
                    <Textarea id="message" value={form.message} onChange={(e) => updateField("message", e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Observaciones adicionales</Label>
                    <Textarea id="notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={2} />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando orden..." : "Crear orden y enviar a WhatsApp"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceCard;
