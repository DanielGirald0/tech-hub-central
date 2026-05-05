import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, Wrench, User, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const cancelOrder = async (id: string) => {
    const { error } = await supabase.from("orders").update({ status: "cancelado" }).eq("id", id);
    if (error) {
      toast({ title: "Error al cancelar", description: error.message, variant: "destructive" });
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelado" } : o)));
    toast({ title: "Pedido cancelado" });
  };

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
          ) : orders.map((o) => {
            const isPendingPayment = o.status === "pendiente de pago";
            const showPay = isPendingPayment && o.payment_status !== "pagado";
            const showCancel = isPendingPayment;
            return (
              <div key={o.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{formatCOP(o.total_price)}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.delivery_type === "domicilio" ? `Domicilio (${formatCOP(o.delivery_cost || 0)})` : "Recoger en tienda"}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("es-CO")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${o.status === "completado" ? "bg-green-500/10 text-green-500" : o.status === "cancelado" ? "bg-red-500/10 text-red-500" : o.status === "recibido" ? "bg-purple-500/10 text-purple-400" : o.status === "en proceso" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
                    {o.status}
                  </span>
                  {showPay && (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        toast({ title: "Pago pendiente", description: `Total a pagar: ${formatCOP(o.total_price)}. Próximamente integraremos pagos en línea.` });
                      }}
                    >
                      Pagar pedido
                    </Button>
                  )}
                  {showCancel && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          Cancelar compra
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Volver</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => cancelOrder(o.id)}
                          >
                            Sí, cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })}
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
