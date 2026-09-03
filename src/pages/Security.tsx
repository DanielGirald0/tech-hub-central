import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Shield, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const solutions = [
  {
    title: "Cámaras de seguridad y CCTV",
    icon: "📷",
    description: "Sistemas de vigilancia profesional para hogares y negocios. Opciones HD y 4K con visualización remota.",
    features: ["Cámaras interiores y exteriores", "Visión nocturna", "App de visualización remota", "Detección de movimiento", "Almacenamiento en la nube"],
  },
  {
    title: "Sistemas de alarma",
    icon: "🚨",
    description: "Protege tu propiedad con sistemas de alarma modernos. Opciones cableadas, inalámbricas e híbridas.",
    features: ["Detección de intrusos", "Alertas de humo y fuego", "Monitoreo 24/7", "Notificaciones móviles", "Batería de respaldo"],
  },
  {
    title: "Control de acceso",
    icon: "🔐",
    description: "Controla quién entra a tus instalaciones con sistemas biométricos, lectores de tarjeta y teclados.",
    features: ["Lectores biométricos", "Sistemas RFID", "Teclados PIN", "Control de asistencia", "Control multi-puerta"],
  },
  {
    title: "Videoporteros",
    icon: "🔔",
    description: "Ve y habla con los visitantes antes de abrir la puerta. Modelos cableados e inalámbricos.",
    features: ["Video HD", "Audio bidireccional", "Integración con smartphone", "Múltiples estaciones", "Visión nocturna"],
  },
];

const Security = () => {
  return (
    <div>
      <SEO
        title="Seguridad Electrónica | Tecno Gz"
        description="Instalación de cámaras CCTV, sistemas de alarma, videoporteros y control de acceso para hogares y negocios en Antioquia."
        path="/security"
      />
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Soluciones de seguridad</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Seguridad completa para tu propiedad
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Soluciones de seguridad profesionales con instalación experta y soporte continuo.
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/contact">Consulta gratuita <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 space-y-12">
          {solutions.map((sol) => (
            <div key={sol.title} className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <span className="text-3xl">{sol.icon}</span>
                  <h2 className="font-display text-xl font-bold text-foreground mt-3 mb-2">{sol.title}</h2>
                  <p className="text-muted-foreground mb-4">{sol.description}</p>
                  <Button asChild variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
                    <Link to="/contact">
                      Solicitar cotización <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
                <div className="md:w-64 shrink-0">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Características clave</h4>
                  <ul className="space-y-2">
                    {sol.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Security;
