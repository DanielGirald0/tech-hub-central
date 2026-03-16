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
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Tecno Gz" className="w-12 h-12 object-contain" />
              <span className="font-display font-bold text-lg text-foreground uppercase">TECNO GZ</span>
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
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <a 
                  href="https://maps.google.com/maps?q=Centro+Comercial+La+Convenci%C3%B3n,+Cl+49+%2348-63+Local+226,+Rionegro,+Antioquia+054040"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-red-500 transition-colors"
                >
                  Centro Comercial La Convención, Cl 49 #48-63 Local 226, Rionegro, Antioquia 054040
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span>+57 310 7476909</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span>tecnogz.rionegro@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <p>Lunes a Viernes: 9:30 AM – 7:00 PM</p>
                  <p>Sábado: 9:30 AM – 5:00 PM</p>
                </div>
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
