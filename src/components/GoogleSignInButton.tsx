import { useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const NEXT_KEY = "tecnogz:auth_next";

export const readStoredNext = (): string | null => {
  try {
    const raw = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
    return raw;
  } catch {
    return null;
  }
};

interface Props {
  next?: string | null;
  label?: string;
}

const GoogleSignInButton = ({ next, label = "Continuar con Google" }: Props) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      sessionStorage.setItem(NEXT_KEY, next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch {
      /* sessionStorage no disponible */
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });

    if (result.error) {
      setLoading(false);
      toast({ title: "No se pudo iniciar sesión con Google", description: result.error.message, variant: "destructive" });
      return;
    }
    if (result.redirected) return;

    window.location.href = "/auth/callback";
  };

  return (
    <Button type="button" variant="outline" className="w-full gap-2" onClick={handleClick} disabled={loading}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.17 3.58-8.86z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.29a7.21 7.21 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
      </svg>
      {loading ? "Conectando..." : label}
    </Button>
  );
};

export default GoogleSignInButton;
