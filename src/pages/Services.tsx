import ServiceCard from "@/components/ServiceCard";
import { services } from "@/data/products";

const serviceCategories = [
  { id: "repair", label: "Repair Services", icon: "🔧" },
  { id: "installation", label: "Installation Services", icon: "📦" },
  { id: "consulting", label: "Consulting", icon: "💡" },
  { id: "maintenance", label: "Maintenance", icon: "⚙️" },
];

const Services = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Our Services</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Professional technical services for all your technology needs. From repairs to full system installations.
      </p>

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
