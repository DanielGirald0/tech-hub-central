import { Link } from "react-router-dom";
import { UserPlus, LogIn, X, Sparkles } from "lucide-react";

interface RegisterCTAModalProps {
  open: boolean;
  onClose: () => void;
}

const RegisterCTAModal = ({ open, onClose }: RegisterCTAModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground uppercase tracking-wider mb-2">
          Mejora tu experiencia
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Regístrate para acceder al historial completo de tus servicios técnicos, garantías y seguimiento en tiempo real.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to="/register"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:bg-primary/90 uppercase tracking-wider text-sm"
          >
            <UserPlus className="w-4 h-4" /> Crear cuenta
          </Link>
          <Link
            to="/login"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-secondary text-foreground font-semibold px-4 py-2.5 rounded-md hover:bg-secondary/80 uppercase tracking-wider text-sm border border-border"
          >
            <LogIn className="w-4 h-4" /> Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterCTAModal;