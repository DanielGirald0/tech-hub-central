import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center font-display font-bold text-primary-foreground text-sm">
                TS
              </div>
              <span className="font-display font-bold text-lg text-foreground">TechStore</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your trusted technology partner. Sales, installation, and repair of technology products and security systems.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: "Products", path: "/products" },
                { label: "Services", path: "/services" },
                { label: "Security Solutions", path: "/security" },
                { label: "About Us", path: "/about" },
                { label: "Contact", path: "/contact" },
              ].map((link) => (
                <Link key={link.path} to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Services</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>Computer Repair</span>
              <span>Phone Repair</span>
              <span>Camera Installation</span>
              <span>Alarm Systems</span>
              <span>IT Consulting</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Contact</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <span>123 Tech Avenue, Downtown</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@techstore.com</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-primary" />
                <span>Mon-Sat: 9AM - 7PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TechStore. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
