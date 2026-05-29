import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, User, Trash2, Pencil, Search, History, Wrench, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserRow {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  document_number: string | null;
  address: string | null;
  notes: string | null;
  account_status: string;
  role: "customer" | "admin";
  created_at: string;
}

type RoleFilter = "all" | "admin" | "customer";
type StatusFilter = "all" | "active" | "suspended" | "inactive";

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  inactive: "Inactivo",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  suspended: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  inactive: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [historyUser, setHistoryUser] = useState<UserRow | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_all_users" as any);
    if (error) toast({ title: "Error al cargar usuarios", variant: "destructive" });
    else setUsers((data as UserRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast({ title: "No puedes eliminarte a ti mismo", variant: "destructive" });
      return;
    }
    const { error } = await supabase.rpc("delete_user_by_admin", { _user_id: userId });
    if (error) toast({ title: "Error al eliminar usuario", description: error.message, variant: "destructive" });
    else { toast({ title: "Usuario eliminado" }); load(); }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && (u.account_status || "active") !== statusFilter) return false;
      if (!s) return true;
      return (
        (u.name || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s) ||
        (u.phone || "").toLowerCase().includes(s) ||
        (u.document_number || "").toLowerCase().includes(s)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton />
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email, teléfono o documento..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-3">
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Rol" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="customer">Cliente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((u) => (
              <div key={u.user_id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{u.name || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary text-muted-foreground border-border"}`}>
                    {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}{u.role}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full border ${STATUS_COLOR[u.account_status || "active"]}`}>{STATUS_LABEL[u.account_status || "active"]}</span>
                  {u.document_number && <span>Doc: {u.document_number}</span>}
                  {u.phone && <span>Tel: {u.phone}</span>}
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(u)}>
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setHistoryUser(u)} title="Historial">
                    <History className="w-3.5 h-3.5" />
                  </Button>
                  {u.user_id !== currentUser?.id && (
                    <DeleteButton onConfirm={() => deleteUser(u.user_id)} label={u.name || u.email} />
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">No hay usuarios.</div>}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-muted-foreground font-medium">Nombre</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Documento</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Teléfono</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Rol</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Acciones</th>
                </tr></thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.user_id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-3 text-foreground">{u.name || "—"}</td>
                      <td className="p-3 text-foreground">{u.email}</td>
                      <td className="p-3 text-muted-foreground">{u.document_number || "—"}</td>
                      <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                          {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}{u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_COLOR[u.account_status || "active"]}`}>
                          {STATUS_LABEL[u.account_status || "active"]}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditing(u)} className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setHistoryUser(u)} className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary transition-colors" title="Historial">
                            <History className="w-4 h-4" />
                          </button>
                          {u.user_id !== currentUser?.id && (
                            <DeleteButton onConfirm={() => deleteUser(u.user_id)} label={u.name || u.email} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay usuarios.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {editing && (
        <EditUserDialog user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
      {historyUser && (
        <UserHistoryDialog user={historyUser} onClose={() => setHistoryUser(null)} />
      )}
    </div>
  );
};

const DeleteButton = ({ onConfirm, label }: { onConfirm: () => void; label: string }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button className="p-1.5 rounded-md text-red-400 hover:bg-red-500/20 transition-colors" title="Eliminar">
        <Trash2 className="w-4 h-4" />
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar este usuario?</AlertDialogTitle>
        <AlertDialogDescription>
          Se eliminará permanentemente a <strong>{label}</strong> y sus datos asociados. Esta acción no se puede deshacer.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          Eliminar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const EditUserDialog = ({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    document_number: user.document_number || "",
    address: user.address || "",
    notes: user.notes || "",
    account_status: user.account_status || "active",
    role: user.role as "admin" | "customer",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es requerido";
    if (!form.email.trim()) e.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido";
    if (form.document_number && form.document_number.replace(/\D/g, "").length < 5) e.document_number = "Documento inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_update_user" as any, {
      _user_id: user.user_id,
      _name: form.name.trim(),
      _email: form.email.trim(),
      _phone: form.phone.trim(),
      _document_number: form.document_number.trim(),
      _address: form.address.trim(),
      _notes: form.notes.trim(),
      _account_status: form.account_status,
      _role: form.role,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Usuario actualizado" });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>Actualiza la información. Los cambios se sincronizan con órdenes técnicas.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="document_number">Documento / Cédula</Label>
              <Input id="document_number" value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value.replace(/\D/g, "") })} />
              {errors.document_number && <p className="text-xs text-destructive mt-1">{errors.document_number}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "customer" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado de cuenta</Label>
              <Select value={form.account_status} onValueChange={(v) => setForm({ ...form, account_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Observaciones / Notas</Label>
              <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UserHistoryDialog = ({ user, onClose }: { user: UserRow; onClose: () => void }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: o }, { data: rc }] = await Promise.all([
        (supabase.from as any)("orders").select("id, created_at, total_price, status").eq("customer_id", user.user_id).order("created_at", { ascending: false }),
        (supabase.from as any)("repair_customers").select("id").eq("user_id", user.user_id),
      ]);
      const customerIds = (rc || []).map((c: any) => c.id);
      let r: any[] = [];
      if (customerIds.length) {
        const { data } = await (supabase.from as any)("repair_orders")
          .select("id, order_number, status, received_at, cost")
          .in("customer_id", customerIds)
          .order("received_at", { ascending: false });
        r = data || [];
      }
      setOrders(o || []);
      setRepairs(r);
      setLoading(false);
    })();
  }, [user.user_id]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de {user.name || user.email}</DialogTitle>
          <DialogDescription>Órdenes de compra y órdenes técnicas asociadas.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" /> Órdenes técnicas ({repairs.length})
              </h3>
              {repairs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin órdenes técnicas.</p>
              ) : (
                <div className="space-y-2">
                  {repairs.map((r) => (
                    <Link key={r.id} to={`/admin/repairs/orders/${r.id}`} onClick={onClose} className="block bg-secondary/40 hover:bg-secondary/70 rounded-lg p-3 text-sm transition-colors">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-foreground">{r.order_number}</span>
                        <span className="text-xs text-muted-foreground">{new Date(r.received_at).toLocaleDateString("es-CO")}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{r.status}</span>
                        <span>${Number(r.cost || 0).toLocaleString("es-CO")}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">Órdenes de compra ({orders.length})</h3>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin órdenes de compra.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-secondary/40 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground">{o.status}</span>
                        <span className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString("es-CO")}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">${Number(o.total_price || 0).toLocaleString("es-CO")}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminUsers;
