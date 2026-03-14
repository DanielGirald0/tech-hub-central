import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo-tecnogz-official.png";

const navLinks = [
  { label: "Inicio", path: "/" },
  { label: "Productos", path: "/products" },
  { label: "Servicios", path: "/services" },
  { label: "Seguridad", path: "/security" },
  { label: "Nosotros", path: "/about" },
  { label: "Contacto", path: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  const handleUserClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

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

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && userRole === "admin" && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="absolute left-0 right-0 top-0 h-16 glass flex items-center px-4 gap-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar productos..."
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            <Link
              to="/cart"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>

            <button
              onClick={handleUserClick}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden sm:flex"
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

        {mobileOpen && (
          <nav className="lg:hidden pb-4 border-t border-border mt-1 pt-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && userRole === "admin" && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                Admin
              </Link>
            )}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary">
                  Mi cuenta
                </Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="px-3 py-2 rounded-md text-sm font-medium text-left text-muted-foreground hover:text-foreground hover:bg-secondary">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-primary">
                Iniciar sesión
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
