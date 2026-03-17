import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "Consulta general", serviceType: "", deviceType: "", message: "" });

  const isServiceRequest = form.subject === "Solicitud de servicio";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let text: string;
    if (isServiceRequest) {
      text = `Hola, quiero solicitar un servicio.\n\nNombre: ${form.name}\nTeléfono: ${form.phone}\nServicio: ${form.serviceType || "No especificado"}\nEquipo: ${form.deviceType || "No especificado"}\nDescripción del problema: ${form.message}`;
    } else {
      text = `Hola, quiero contactarlos.\n\nNombre: ${form.name}\nTeléfono: ${form.phone}\nAsunto: ${form.subject}\nMensaje: ${form.message}`;
    }
    window.open(`https://wa.me/573107476909?text=${encodeURIComponent(text)}`, "_blank");
  };

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const inputCls = "w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Contacto</h1>
      <p className="text-muted-foreground mb-10">Nos encantaría saber de ti. Contáctanos en cualquier momento.</p>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">Envíanos un mensaje</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input className={inputCls} placeholder="Tu nombre" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Correo electrónico</label>
                <input type="email" className={inputCls} placeholder="tu@correo.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
              <input className={inputCls} placeholder="+57 300 000 0000" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Asunto</label>
              <select className={inputCls} value={form.subject} onChange={(e) => update("subject", e.target.value)}>
                <option>Consulta general</option>
                <option>Pregunta sobre producto</option>
                <option>Solicitud de servicio</option>
                <option>Soporte técnico</option>
                <option>Consulta de seguridad</option>
              </select>
            </div>

            {isServiceRequest && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo de servicio</label>
                  <select className={inputCls} value={form.serviceType} onChange={(e) => update("serviceType", e.target.value)}>
                    <option value="">Seleccionar...</option>
                    <option>Servicio técnico de computadores</option>
                    <option>Servicio técnico de celulares</option>
                    <option>Servicio técnico de consolas</option>
                    <option>Instalación de cámaras</option>
                    <option>Instalación de alarmas</option>
                    <option>Instalación de control de acceso</option>
                    <option>Instalación de videoporteros</option>
                    <option>Asesoría tecnológica</option>
                    <option>Mantenimiento preventivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo de equipo</label>
                  <input className={inputCls} placeholder="Ej: Portátil HP, iPhone 15, PS5..." value={form.deviceType} onChange={(e) => update("deviceType", e.target.value)} />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{isServiceRequest ? "Descripción del problema" : "Mensaje"}</label>
              <textarea rows={4} className={`${inputCls} resize-none`} placeholder={isServiceRequest ? "Describe el problema o servicio que necesitas..." : "¿En qué podemos ayudarte?"} value={form.message} onChange={(e) => update("message", e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Enviar mensaje por WhatsApp
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">Visítanos</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Dirección</p>
                  <p>Centro Comercial La Convención</p>
                  <p>Cl 49 #48-63 Local 226</p>
                  <p>Rionegro, Antioquia 054040</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Teléfono / WhatsApp</p>
                  <p>+57 310 7476909</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Correo</p>
                  <p>tecnogz.rionegro@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Horario</p>
                  <p>Lunes a Viernes: 9:30 AM – 7:00 PM</p>
                  <p>Sábado: 9:30 AM – 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden h-64">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d-75.37649satisfechos!3d6.155200000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4690e0fa0b4a1d%3A0x9b7efaboratorio!2sCentro%20Comercial%20La%20Convenci%C3%B3n!5e0!3m2!1ses!2sco!4v1710000000000"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación de Tecno Gz"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
