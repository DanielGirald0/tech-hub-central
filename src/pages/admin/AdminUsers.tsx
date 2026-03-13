import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, User } from "lucide-react";

interface UserRow {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data, error } = await supabase.rpc("get_all_users");
    if (error) toast({ title: "Error al cargar usuarios", variant: "destructive" });
    else setUsers((data as UserRow[]) || []);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, currentRole: "customer" | "admin") => {
    const newRole = currentRole === "admin" ? "customer" : "admin";
    // Update existing role
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    if (error) toast({ title: "Error al cambiar rol", description: error.message, variant: "destructive" });
    else { toast({ title: `Rol cambiado a ${newRole}` }); load(); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Gestión de Usuarios</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium">Nombre</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Teléfono</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Rol</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Registrado</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Acciones</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-foreground">{u.name || "—"}</td>
                  <td className="p-3 text-foreground">{u.email}</td>
                  <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString("es-CO")}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => toggleRole(u.user_id, u.role)} className="text-xs text-primary hover:underline">
                      {u.role === "admin" ? "Hacer cliente" : "Hacer admin"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay usuarios.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
