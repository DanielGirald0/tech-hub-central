import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-tecnogz.webp";
import SEO from "@/components/SEO";

const safeNext = (raw: string | null): string | null => {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast({ title: "Error al iniciar sesión", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Bienvenido!" });
      navigate(next ?? "/dashboard");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <SEO title="Iniciar sesión | Tecno Gz" description="Accede a tu cuenta de Tecno Gz para ver tus órdenes, reparaciones y perfil." path="/login" noindex />
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Tecno Gz" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider">TECNO GZ</h1>
          <p className="text-sm text-muted-foreground mt-1">Inicia sesión para continuar</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required maxLength={255} />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required maxLength={128} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
          <Link to="/forgot-password" className="text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿No tienes cuenta?{" "}
          <Link to={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="text-primary hover:underline">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
