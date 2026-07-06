import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo-tecnogz.webp";

const navLinks = [
  { label: "Inicio", path: "/" },
  { label: "Productos", path: "/products" },
  { label: "Servicios", path: "/services" },
  { label: "Nosotros", path: "/about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { totalItems } = useCart();

  const handleUserClick = () => navigate(user ? "/dashboard" : "/login");
  const handleLogout = async () => { await signOut(); navigate("/"); };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0" aria-label="Tecno Gz — Inicio">
            <img
              src={logo}
              alt="Logo Tecno Gz"
              width={56}
              height={56}
              fetchPriority="high"
              decoding="async"
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 object-contain shrink-0"
            />
            <span className="font-display font-bold text-base sm:text-lg lg:text-xl tracking-wider text-foreground hidden md:block uppercase truncate">
              TECNO GZ
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(l.path) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                {l.label}
              </Link>
            ))}
            {user && userRole === "admin" && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === "/admin" || (location.pathname.startsWith("/admin") && !location.pathname.startsWith("/admin/repairs")) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                Admin
              </Link>
            )}
            {user && (userRole === "admin" || userRole === "technician") && (
              <Link
                to="/admin/repairs"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith("/admin/repairs") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                Taller
              </Link>
            )}
          </nav>

          {/* Right icons — always visible */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/cart"
              aria-label={`Carrito de compras${totalItems > 0 ? ` (${totalItems} artículos)` : ""}`}
              className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span aria-hidden="true" className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={handleUserClick}
              aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
              className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <User className="w-5 h-5" />
            </button>

            {user && (
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="p-2 min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav id="mobile-nav" aria-label="Navegación móvil" className="lg:hidden pb-4 border-t border-border mt-1 pt-3 flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(l.path) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                {l.label}
              </Link>
            ))}

            {user && userRole === "admin" && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">Admin</Link>
            )}
            {user && (userRole === "admin" || userRole === "technician") && (
              <Link to="/admin/repairs" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">Taller</Link>
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
