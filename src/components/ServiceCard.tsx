import { useState } from "react";
import { ArrowRight } from "lucide-react";
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
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(1, "El teléfono es obligatorio").max(30),
  address: z.string().trim().max(300).optional().default(""),
  device_type: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().max(1000).optional().default(""),
});

type FormData = z.infer<typeof requestSchema>;

const openWhatsApp = (service: Service, data: FormData) => {
  const text = encodeURIComponent(
    `Hola, quiero solicitar un servicio.\n\nNombre: ${data.full_name}\nTeléfono: ${data.phone}\nCorreo: ${data.email}\nServicio solicitado: ${service.name}\nEquipo: ${data.device_type || "No especificado"}\nDescripción del problema: ${data.message || "No especificada"}`
  );
  window.open(`https://wa.me/573107476909?text=${text}`, "_blank");
};

const saveRequest = async (
  service: Service,
  data: FormData,
  userId?: string
) => {
  const { error } = await supabase.from("service_requests").insert({
    service_type: service.id,
    service_id: service.id,
    service_name: service.name,
    customer_id: userId || null,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    address: data.address || "",
    device_type: data.device_type || "",
    message: data.message || "",
    description: data.message || "",
  });
  return error;
};

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    device_type: "",
    message: "",
  });

  const handleClick = () => {
    if (user && profile) {
      setForm({
        full_name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: "",
        device_type: "",
        message: "",
      });
    } else {
      setForm({ full_name: "", email: "", phone: "", address: "", device_type: "", message: "" });
    }
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = requestSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const error = await saveRequest(service, result.data, user?.id);
    if (error) {
      console.error("Error saving service request:", error);
      toast({
        title: "Solicitud enviada por WhatsApp",
        description: "No se pudo guardar en el sistema, pero puedes continuar por WhatsApp.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Solicitud registrada",
        description: "Tu solicitud ha sido guardada exitosamente.",
      });
    }

    openWhatsApp(service, result.data);
    setLoading(false);
    setOpen(false);
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
          {loading ? "Enviando..." : "Solicitar servicio"}{" "}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Solicitar: {service.name}</DialogTitle>
            <DialogDescription>Completa tus datos para enviar la solicitud.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo <span className="text-destructive">*</span></Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} placeholder="Tu nombre completo" />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="correo@ejemplo.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono <span className="text-destructive">*</span></Label>
              <Input id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+57 300 1234567" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Tu dirección (opcional)" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="device_type">Tipo de equipo</Label>
              <Input id="device_type" value={form.device_type} onChange={(e) => updateField("device_type", e.target.value)} placeholder="Ej: Portátil HP, iPhone 14, PS5..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Descripción del problema</Label>
              <Textarea id="message" value={form.message} onChange={(e) => updateField("message", e.target.value)} placeholder="Describe tu problema o lo que necesitas (opcional)" rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar solicitud y abrir WhatsApp"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceCard;
