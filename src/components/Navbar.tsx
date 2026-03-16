import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo-tecnogz-official.png";
import { categories } from "@/data/products";

const productSubLinks = [
  { label: "Todas las categorías", path: "/products" },
  { label: "Computadores", path: "/products?category=computadores" },
  { label: "Accesorios", path: "/products?category=accesorios-pc" },
  { label: "Celulares", path: "/products?category=celulares" },
  { label: "Videojuegos", path: "/products?category=consolas" },
  { label: "Seguridad electrónica", path: "/products?category=camaras-seguridad" },
];

const serviceSubLinks = [
  { label: "── Servicio Técnico ──", path: "", header: true },
  { label: "Reparación de computadores", path: "/services#reparacion" },
  { label: "Reparación de celulares", path: "/services#reparacion" },
  { label: "Reparación de consolas", path: "/services#reparacion" },
  { label: "Mantenimiento de computadores", path: "/services#mantenimiento" },
  { label: "Mantenimiento de celulares", path: "/services#mantenimiento" },
  { label: "── Seguridad Electrónica ──", path: "", header: true },
  { label: "Instalación de cámaras", path: "/services#instalacion" },
  { label: "Instalación de alarmas", path: "/services#instalacion" },
  { label: "Instalación de videoporteros", path: "/services#instalacion" },
  { label: "Control de acceso", path: "/services#instalacion" },
  { label: "Asesoría en seguridad", path: "/services#asesoria" },
];

const Dropdown = ({ label, links, active }: { label: string; links: { label: string; path: string }[]; active: boolean }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
      >
        {label} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { totalItems } = useCart();

  const handleUserClick = () => navigate(user ? "/dashboard" : "/login");
  const handleLogout = async () => { await signOut(); navigate("/"); };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Tecno Gz" className="w-14 h-14 object-contain" />
            <span className="font-display font-bold text-xl tracking-wider text-foreground hidden sm:block uppercase">
              TECNO GZ
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === "/" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              Inicio
            </Link>
            <Dropdown label="Productos" links={productSubLinks} active={location.pathname === "/products"} />
            <Dropdown label="Servicios" links={serviceSubLinks} active={location.pathname === "/services"} />
            {user && userRole === "admin" && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith("/admin") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right icons — always visible */}
          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={handleUserClick}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <User className="w-5 h-5" />
            </button>

            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden sm:flex"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground lg:hidden"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="lg:hidden pb-4 border-t border-border mt-1 pt-3 flex flex-col gap-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">Inicio</Link>

            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Productos</p>
            {productSubLinks.map((l) => (
              <Link key={l.label} to={l.path} onClick={() => setMobileOpen(false)} className="px-6 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md">{l.label}</Link>
            ))}

            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Servicios</p>
            {serviceSubLinks.map((l) => (
              <Link key={l.label} to={l.path} onClick={() => setMobileOpen(false)} className="px-6 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md">{l.label}</Link>
            ))}

            {user && userRole === "admin" && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">Admin</Link>
            )}

            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">Mi cuenta</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="px-3 py-2 rounded-md text-sm font-medium text-left text-muted-foreground hover:text-foreground hover:bg-secondary">Cerrar sesión</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-primary">Iniciar sesión</Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
