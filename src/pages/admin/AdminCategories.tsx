import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const db = supabase as any;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
}

const emptyCategory = { name: "", slug: "", description: "", active: true };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyCategory);
  const { toast } = useToast();

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [categories],
  );

  const loadCategories = async () => {
    const { data, error } = await db.from("categories").select("*").order("name");
    if (error) toast({ title: "Error al cargar categorías", description: error.message, variant: "destructive" });
    else setCategories((data as unknown as Category[]) || []);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyCategory);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setCreating(false);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      active: category.active,
    });
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    setForm(emptyCategory);
  };

  const handleNameChange = (name: string) => {
    setForm((current) => ({ ...current, name, slug: editing ? current.slug : slugify(name) }));
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const slug = slugify(form.slug || form.name);

    if (!name || !slug) {
      toast({ title: "Nombre y URL son obligatorios", variant: "destructive" });
      return;
    }

    const payload = { name, slug, description: form.description.trim(), active: form.active };
    const request = editing
      ? db.from("categories").update(payload).eq("id", editing.id)
      : db.from("categories").insert(payload);

    const { error } = await request;
    if (error) {
      toast({ title: editing ? "Error al actualizar" : "Error al crear", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: editing ? "Categoría actualizada" : "Categoría creada" });
    closeForm();
    loadCategories();
  };

  const handleDelete = async (category: Category) => {
    const { error } = await db.from("categories").delete().eq("id", category.id);
    if (error) toast({ title: "No se pudo eliminar", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Categoría eliminada" });
      loadCategories();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground uppercase tracking-wider">Categorías</h1>
          <p className="text-sm text-muted-foreground">Administra las categorías usadas por productos y filtros.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nueva categoría</Button>
      </div>

      {(creating || editing) && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground">{editing ? "Editar categoría" : "Nueva categoría"}</h2>
            <button onClick={closeForm} aria-label="Cerrar"><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label>URL *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} maxLength={140} />
            </div>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Categoría activa
            </label>
          </div>
          <div className="flex gap-2 mt-5">
            <Button onClick={handleSave}>{editing ? "Actualizar" : "Crear"}</Button>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left p-3 text-muted-foreground font-medium">URL</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((category) => (
                <tr key={category.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-foreground font-medium">{category.name}</td>
                  <td className="p-3 text-muted-foreground">{category.slug}</td>
                  <td className="p-3 text-muted-foreground">{category.active ? "Activa" : "Inactiva"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(category)} className="p-1 hover:text-primary" aria-label="Editar"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(category)} className="p-1 hover:text-destructive ml-2" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {sortedCategories.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No hay categorías creadas.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
