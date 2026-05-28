import ServiceCard from "@/components/ServiceCard";
import { services } from "@/data/products";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const serviceCategories = [
  { id: "reparacion", label: "Servicios de reparación", icon: "🔧" },
  { id: "instalacion", label: "Servicios de instalación", icon: "📦" },
  { id: "asesoria", label: "Asesoría", icon: "💡" },
  { id: "mantenimiento", label: "Mantenimiento", icon: "⚙️" },
];

const Services = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Nuestros Servicios</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Servicios técnicos profesionales para todas tus necesidades tecnológicas. Desde reparaciones hasta instalaciones completas.
      </p>

      <Link
        to="/seguimiento"
        className="mb-10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-card to-card border border-primary/30 rounded-xl p-5 hover:border-primary/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground uppercase tracking-wider">¿Tienes un equipo en reparación?</h3>
            <p className="text-sm text-muted-foreground">Consulta el estado de tu orden en tiempo real con tu número de orden.</p>
          </div>
        </div>
        <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold uppercase tracking-wider">Consultar →</span>
      </Link>

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
