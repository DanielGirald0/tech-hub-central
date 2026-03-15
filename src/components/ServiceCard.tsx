import { ArrowRight } from "lucide-react";
import { Service } from "@/data/products";
import { Link } from "react-router-dom";

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  return (
    <div className="group bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300">
      <div className="text-3xl mb-4">{service.icon}</div>
      <h3 className="font-display font-semibold text-foreground mb-2">{service.name}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
      {service.price && (
        <p className="text-sm font-semibold text-primary mb-4">{service.price}</p>
      )}
      <Link
        to={`/contact?subject=Solicitud+de+servicio`}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline group-hover:gap-2 transition-all"
      >
        Solicitar servicio <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default ServiceCard;
