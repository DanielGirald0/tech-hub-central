import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo-tecnogz.webp";

const navLinks = [
  { label: "Inicio", path: "/" },
  { label: "Servicios", path: "/services" },
  { label: "Nosotros", path: "/about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  const handleUserClick = () => navigate(user ? "/dashboard" : "/login");
  const handleLogout = async () => { await signOut(); navigate("/"); };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const LogoBlock = ({ compact = false }: { compact?: boolean }) => (
    <Link
      to="/"
      className={`flex items-center ${compact ? "justify-center" : "gap-2 sm:gap-3"} min-w-0`}
      aria-label="Tecno Gz — Inicio"
    >
      <img
        src={logo}
        alt="Logo Tecno Gz"
        width={56}
        height={56}
        fetchPriority="high"
        decoding="async"
        className={`object-contain shrink-0 ${compact ? "w-9 h-9" : "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"}`}
      />
      {!compact && (
        <span className="font-display font-bold tracking-wider text-white uppercase truncate hidden md:block text-base sm:text-lg lg:text-xl">
          TECNO GZ
        </span>
      )}
    </Link>
  );

  const UserButton = () => (
    <button
      onClick={handleUserClick}
      aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
      className="p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <User className="w-5 h-5" />
    </button>
  );

  const LogoutButton = ({ className = "" }: { className?: string }) => (
    <button
      onClick={handleLogout}
      aria-label="Cerrar sesión"
      className={`p-2 min-h-11 min-w-11 items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      title="Cerrar sesión"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );

  const MenuButton = ({ className = "" }: { className?: string }) => (
    <button
      onClick={() => setMobileOpen(!mobileOpen)}
      aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      aria-expanded={mobileOpen}
      aria-controls="mobile-nav"
      className={`p-2 min-h-11 min-w-11 inline-flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-4">
        {/* Mobile header: menu left, centered logo, user right */}
        <div className="lg:hidden grid grid-cols-[auto_1fr_auto] items-center gap-2 h-14">
          <MenuButton />
          <LogoBlock compact />
          <div className="flex items-center justify-end shrink-0">
            <UserButton />
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex items-center justify-between h-20">
          <LogoBlock />

          <nav className="flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(l.path) ? "text-primary bg-white/10" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              >
                {l.label}
              </Link>
            ))}
            {user && userRole === "admin" && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === "/admin" || (location.pathname.startsWith("/admin") && !location.pathname.startsWith("/admin/repairs")) ? "text-primary bg-white/10" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              >
                Admin
              </Link>
            )}
            {user && (userRole === "admin" || userRole === "technician") && (
              <Link
                to="/admin/repairs"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname.startsWith("/admin/repairs") ? "text-primary bg-white/10" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              >
                Taller
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <UserButton />
            {user && <LogoutButton className="hidden sm:inline-flex" />}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav id="mobile-nav" aria-label="Navegación móvil" className="lg:hidden pb-4 border-t border-white/10 mt-1 pt-3 flex flex-col gap-1 max-h-[70dvh] overflow-y-auto">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(l.path) ? "text-primary bg-white/10" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              >
                {l.label}
              </Link>
            ))}

            {user && userRole === "admin" && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/10">Admin</Link>
            )}
            {user && (userRole === "admin" || userRole === "technician") && (
              <Link to="/admin/repairs" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/10">Taller</Link>
            )}

            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/10">Mi cuenta</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="px-3 py-2 rounded-md text-sm font-medium text-left text-white/70 hover:text-white hover:bg-white/10">Cerrar sesión</button>
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
