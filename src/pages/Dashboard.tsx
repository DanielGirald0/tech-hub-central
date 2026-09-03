import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, ShieldCheck, Calendar, ExternalLink } from "lucide-react";
import BackButton from "@/components/BackButton";
import { REPAIR_STATUS_LABEL, REPAIR_STATUS_COLOR, RepairStatus, formatDate, formatCOP as formatCOPLib } from "@/lib/repairs";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const Dashboard = () => {
  const { user, profile, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState(profile?.name || "");
  const [editPhone, setEditPhone] = useState(profile?.phone || "");
  const [editDoc, setEditDoc] = useState<string>(profile?.document_number || "");
  const [tab, setTab] = useState<"repairs" | "profile">("repairs");

  const { data: repairOrders = [] } = useQuery({
    queryKey: ["my-repair-orders", user?.id, profile?.document_number],
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await (supabase.rpc as any)("get_my_repair_orders");
      return data || [];
    },
  });

  useEffect(() => {
    setEditName(profile?.name || "");
    setEditPhone(profile?.phone || "");
    setEditDoc(profile?.document_number || "");
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    const docDigits = (editDoc || "").replace(/\D/g, "");
    const { error } = await (supabase.from("profiles") as any)
      .update({ name: editName.trim(), phone: editPhone.trim(), document_number: docDigits || null })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil actualizado", description: docDigits ? "Sincronizando tu historial técnico..." : undefined });
      queryClient.invalidateQueries({ queryKey: ["my-repair-orders"] });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const tabs = [
    { id: "repairs" as const, label: "Servicio Técnico", icon: ShieldCheck },
    { id: "profile" as const, label: "Mi Perfil", icon: User },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="Mi cuenta | Tecno Gz" description="Panel personal de Tecno Gz: perfil, órdenes y reparaciones." path="/dashboard" noindex />
      <BackButton />
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

      {tab === "repairs" && (
        <div className="space-y-4">
          {!profile?.document_number && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-sm">
              <p className="text-foreground font-medium mb-1">Agrega tu número de documento</p>
              <p className="text-muted-foreground mb-2">
                Para ver todas tus órdenes de servicio técnico anteriores, agrega tu cédula en la pestaña <strong>Mi Perfil</strong>.
              </p>
              <button onClick={() => setTab("profile")} className="text-primary text-sm font-medium hover:underline">
                Ir a Mi Perfil →
              </button>
            </div>
          )}
          {repairOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No tienes órdenes de servicio técnico.</p>
          ) : (
            repairOrders.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-display text-foreground font-bold">{r.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {[r.device_type, r.brand, r.model].filter(Boolean).join(" ")}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${REPAIR_STATUS_COLOR[r.status as RepairStatus]}`}>
                    {REPAIR_STATUS_LABEL[r.status as RepairStatus]}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                  <div><Calendar className="w-3 h-3 inline mr-1" />Ingreso: <span className="text-foreground">{formatDate(r.received_at)}</span></div>
                  <div>Estimada: <span className="text-foreground">{formatDate(r.estimated_date)}</span></div>
                  <div>Costo: <span className="text-foreground">{formatCOPLib(Number(r.cost))}</span></div>
                  <div>Garantía: <span className="text-foreground">{r.warranty_days ? `${r.warranty_days} días` : "—"}</span></div>
                </div>
                {r.reported_issue && (
                  <p className="text-xs text-muted-foreground mt-2"><strong className="text-foreground">Falla:</strong> {r.reported_issue}</p>
                )}
                <Link to={`/seguimiento`} className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                  Ver seguimiento <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))
          )}
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
          <div>
            <Label>Número de documento (cédula)</Label>
            <Input
              value={editDoc}
              onChange={(e) => setEditDoc(e.target.value)}
              maxLength={20}
              inputMode="numeric"
              placeholder="Tu cédula"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Vincula automáticamente tus órdenes de servicio técnico.
            </p>
          </div>
          <Button onClick={handleUpdateProfile}>Guardar cambios</Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
