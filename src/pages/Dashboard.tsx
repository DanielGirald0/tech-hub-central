import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, Wrench, User, LogOut } from "lucide-react";

const Dashboard = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [editName, setEditName] = useState(profile?.name || "");
  const [editPhone, setEditPhone] = useState(profile?.phone || "");
  const [tab, setTab] = useState<"orders" | "services" | "profile">("orders");

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
    supabase.from("service_requests").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setServiceRequests(data || []));
  }, [user]);

  useEffect(() => {
    setEditName(profile?.name || "");
    setEditPhone(profile?.phone || "");
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name: editName.trim(), phone: editPhone.trim() }).eq("user_id", user.id);
    if (error) toast({ title: "Error al actualizar", variant: "destructive" });
    else toast({ title: "Perfil actualizado" });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  const tabs = [
    { id: "orders" as const, label: "Mis Pedidos", icon: Package },
    { id: "services" as const, label: "Mis Servicios", icon: Wrench },
    { id: "profile" as const, label: "Mi Perfil", icon: User },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Mi Cuenta</h1>
          <p className="text-muted-foreground">Bienvenido, {profile?.name || user?.email}</p>
          {userRole === "admin" && (
            <Button variant="link" className="p-0 text-primary" onClick={() => navigate("/admin")}>
              Ir al panel de administración →
            </Button>
          )}
        </div>
        <Button variant="outline" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Cerrar sesión</Button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${tab === t.id ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No tienes pedidos aún.</p>
          ) : orders.map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{formatCOP(o.total_price)}</p>
                <p className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("es-CO")}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${o.status === "completado" ? "bg-green-500/10 text-green-500" : o.status === "cancelado" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                {o.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "services" && (
        <div className="space-y-4">
          {serviceRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No tienes solicitudes de servicio.</p>
          ) : serviceRequests.map((sr) => (
            <div key={sr.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">{sr.service_type}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${sr.status === "completado" ? "bg-green-500/10 text-green-500" : sr.status === "cancelado" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                  {sr.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{sr.device_type} — {sr.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(sr.created_at).toLocaleDateString("es-CO")}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "profile" && (
        <div className="max-w-md space-y-4">
          <div>
            <Label>Correo electrónico</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div>
            <Label>Nombre</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} maxLength={20} />
          </div>
          <Button onClick={handleUpdateProfile}>Guardar cambios</Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
