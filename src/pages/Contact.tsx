import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Contacto</h1>
      <p className="text-muted-foreground mb-10">Nos encantaría saber de ti. Contáctanos en cualquier momento.</p>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Formulario */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">Envíanos un mensaje</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Tu nombre" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Correo electrónico</label>
                <input type="email" className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="tu@correo.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Teléfono</label>
              <input className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="+57 300 000 0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Asunto</label>
              <select className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Consulta general</option>
                <option>Pregunta sobre producto</option>
                <option>Solicitud de servicio</option>
                <option>Soporte técnico</option>
                <option>Consulta de seguridad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Mensaje</label>
              <textarea rows={4} className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="¿En qué podemos ayudarte?" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Enviar mensaje
            </Button>
          </form>
        </div>

        {/* Info */}
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
                  <p>310 7476909</p>
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

          {/* Mapa de Rionegro */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden h-64">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.1!2d-75.3743!3d6.1552!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4690e0fa0b4a1d%3A0x1234567890abcdef!2sCentro+Comercial+La+Convenci%C3%B3n!5e0!3m2!1ses!2sco!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Ubicación de Tecno Gz"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
