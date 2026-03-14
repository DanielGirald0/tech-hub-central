import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import logo from "@/assets/logo-tecnogz-official.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Tecno Gz" className="w-9 h-9 rounded-full object-cover" />
              <span className="font-display font-bold text-lg text-foreground">Tecno Gz</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Expertos en servicio técnico y venta de tecnología. Pasión y servicio de confianza.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Enlaces rápidos</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "Productos", path: "/products" },
                { label: "Servicios", path: "/services" },
                { label: "Seguridad", path: "/security" },
                { label: "Nosotros", path: "/about" },
                { label: "Contacto", path: "/contact" },
              ].map((link) => (
                <Link key={link.path} to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Servicios</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>Servicio técnico de computadores</span>
              <span>Servicio técnico de celulares</span>
              <span>Instalación de cámaras</span>
              <span>Sistemas de alarma</span>
              <span>Asesoría en sistemas</span>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Contacto</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <span>Centro Comercial La Convención, Cl 49 #48-63 Local 226, Rionegro, Antioquia 054040</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>+57 (604) 000-0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@tecnogz.com</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-primary" />
                <span>Lun-Sáb: 9AM - 7PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Tecno Gz. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
