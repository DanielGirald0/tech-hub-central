import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-tecnogz-official.png";
import SEO from "@/components/SEO";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const docDigits = documentNumber.replace(/\D/g, "");
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), phone: phone.trim(), document_number: docDigits || null },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "¡Cuenta creada!",
        description: docDigits
          ? "Revisa tu correo. Vincularemos automáticamente tus órdenes de servicio anteriores."
          : "Revisa tu correo para confirmar tu cuenta.",
      });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Tecno Gz" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider">TECNO GZ</h1>
          <p className="text-sm text-muted-foreground mt-1">Crea tu cuenta</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required maxLength={100} />
          </div>
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" required maxLength={255} />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 000 0000" maxLength={20} />
          </div>
          <div>
            <Label htmlFor="document_number">Número de documento (opcional)</Label>
            <Input
              id="document_number"
              inputMode="numeric"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="Cédula o documento"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Si ya has dejado equipos en reparación, vincularemos tu historial automáticamente.
            </p>
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required maxLength={128} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
