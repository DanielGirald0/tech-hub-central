import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-tecnogz-official.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }
    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contraseña actualizada correctamente" });
      navigate("/dashboard");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
          <img src={logo} alt="Tecno Gz" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Enlace inválido</h1>
          <p className="text-muted-foreground text-sm">Este enlace de recuperación no es válido o ya expiró. Solicita uno nuevo.</p>
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
