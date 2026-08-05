import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { readStoredNext } from "@/components/GoogleSignInButton";
import SEO from "@/components/SEO";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const go = (path: string) => {
      if (done) return;
      done = true;
      navigate(path, { replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go(readStoredNext() ?? "/dashboard");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go(readStoredNext() ?? "/dashboard");
    });

    const timeout = setTimeout(() => go("/login"), 8000);

    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <SEO title="Iniciando sesión | Tecno Gz" description="Procesando inicio de sesión." path="/auth/callback" noindex />
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <p className="text-sm text-muted-foreground">Completando inicio de sesión...</p>
    </div>
  );
};

export default AuthCallback;
