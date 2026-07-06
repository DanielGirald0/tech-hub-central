import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-tecnogz.webp";
import SEO from "@/components/SEO";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    console.log("[reset-password] init", { href: window.location.href });

    const finalize = (ok: boolean, msg?: string) => {
      if (cancelled) return;
      console.log("[reset-password] finalize", { ok, msg });
      setReady(ok);
      if (!ok && msg) setErrorMsg(msg);
      setChecking(false);
    };

    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

        // Surface provider error first
        const errDesc = url.searchParams.get("error_description") || hash.get("error_description");
        if (errDesc) return finalize(false, decodeURIComponent(errDesc));

        // 1) PKCE flow: ?code=...
        const code = url.searchParams.get("code");
        if (code) {
          console.log("[reset-password] exchanging code for session");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) return finalize(false, error.message);
          window.history.replaceState({}, "", "/reset-password");
          return finalize(true);
        }

        // 2) OTP token flow: ?token_hash=...&type=recovery
        const tokenHash = url.searchParams.get("token_hash") || hash.get("token_hash");
        const type = url.searchParams.get("type") || hash.get("type");
        if (tokenHash && type === "recovery") {
          console.log("[reset-password] verifying otp token_hash");
          const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
          if (error) return finalize(false, error.message);
          window.history.replaceState({}, "", "/reset-password");
          return finalize(true);
        }

        // 3) Legacy implicit hash flow: #access_token=...&type=recovery
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (accessToken && refreshToken && hash.get("type") === "recovery") {
          console.log("[reset-password] setting session from hash tokens");
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) return finalize(false, error.message);
          window.history.replaceState({}, "", "/reset-password");
          return finalize(true);
        }

        // 4) Already in a recovery session?
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log("[reset-password] existing session found");
          return finalize(true);
        }

        finalize(false, "No se encontró un token de recuperación válido en el enlace.");
      } catch (e: any) {
        console.error("[reset-password] unexpected error", e);
        finalize(false, e?.message || "Error inesperado");
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("[reset-password] auth event", event);
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setLoading(true);
    console.log("[reset-password] updating password");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      console.error("[reset-password] update error", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contraseña actualizada correctamente" });
      await supabase.auth.signOut();
      navigate("/login");
    }
  };

  if (checking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
          <img src={logo} alt="Tecno Gz" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Enlace inválido</h1>
          <p className="text-muted-foreground text-sm mb-4">
            {errorMsg || "Este enlace de recuperación no es válido o ya expiró. Solicita uno nuevo."}
          </p>
          <Button onClick={() => navigate("/forgot-password")} className="w-full">
            Solicitar nuevo enlace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Tecno Gz" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresa tu nueva contraseña</p>
        </div>
      <SEO title="Nueva contraseña | Tecno Gz" description="Establece una nueva contraseña para tu cuenta de Tecno Gz." path="/reset-password" noindex />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} maxLength={128} />
          </div>
          <div>
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={6} maxLength={128} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
