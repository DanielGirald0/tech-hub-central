import ServiceCard from "@/components/ServiceCard";
import BackButton from "@/components/BackButton";
import TrackOrderCTA from "@/components/TrackOrderCTA";
import { services } from "@/data/products";
import SEO from "@/components/SEO";

const serviceCategories = [
  { id: "reparacion", label: "Servicios de reparación", icon: "🔧" },
  { id: "instalacion", label: "Servicios de instalación", icon: "📦" },
  { id: "asesoria", label: "Asesoría", icon: "💡" },
  { id: "mantenimiento", label: "Mantenimiento", icon: "⚙️" },
];

const Services = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="Servicios Técnicos | Tecno Gz Rionegro"
        description="Reparación de computadores, celulares, instalación de cámaras, alarmas y mantenimiento profesional. Diagnóstico y cotización rápida."
        path="/services"
      />
      <BackButton />
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Nuestros Servicios</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Servicios técnicos profesionales para todas tus necesidades tecnológicas. Desde reparaciones hasta instalaciones completas.
      </p>

      <div className="mb-8 md:mb-10 [&>section]:mt-0">
        <TrackOrderCTA />
      </div>

      {serviceCategories.map((cat) => {
        const catServices = services.filter((s) => s.category === cat.id);
        if (catServices.length === 0) return null;
        return (
          <section key={cat.id} className="mb-12">
            <h2 className="font-display text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
              <span>{cat.icon}</span> {cat.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {catServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default Services;
