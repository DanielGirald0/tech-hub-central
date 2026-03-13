import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { categories } from "@/data/products";

interface DBProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  subcategory: string | null;
  brand: string | null;
  stock: number;
  image_url: string | null;
  rating: number | null;
  featured: boolean | null;
}

const emptyProduct = { name: "", description: "", price: 0, original_price: null as number | null, category: "", subcategory: "", brand: "", stock: 0, image_url: "", featured: false };

const AdminProducts = () => {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [editing, setEditing] = useState<DBProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const { toast } = useToast();

  const load = () => supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data }) => setProducts(data || []));
  useEffect(() => { load(); }, []);

  const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) {
      toast({ title: "Nombre y categoría son obligatorios", variant: "destructive" });
      return;
    }
    if (editing) {
      const { error } = await supabase.from("products").update(form).eq("id", editing.id);
      if (error) toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      else { toast({ title: "Producto actualizado" }); setEditing(null); load(); }
    } else {
      const { error } = await supabase.from("products").insert(form);
      if (error) toast({ title: "Error al crear", description: error.message, variant: "destructive" });
      else { toast({ title: "Producto creado" }); setCreating(false); setForm(emptyProduct); load(); }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast({ title: "Error al eliminar", variant: "destructive" });
    else { toast({ title: "Producto eliminado" }); load(); }
  };

  const openEdit = (p: DBProduct) => {
    setEditing(p);
    setCreating(false);
    setForm({ name: p.name, description: p.description || "", price: p.price, original_price: p.original_price, category: p.category, subcategory: p.subcategory || "", brand: p.brand || "", stock: p.stock, image_url: p.image_url || "", featured: p.featured || false });
  };

  const closeForm = () => { setEditing(null); setCreating(false); setForm(emptyProduct); };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Gestión de Productos</h1>
        <Button onClick={() => { setCreating(true); setEditing(null); setForm(emptyProduct); }}><Plus className="w-4 h-4 mr-2" />Nuevo producto</Button>
      </div>

      {(creating || editing) && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground">{editing ? "Editar producto" : "Nuevo producto"}</h2>
            <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={200} /></div>
            <div><Label>Marca</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} maxLength={100} /></div>
            <div><Label>Categoría *</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="">Seleccionar</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><Label>Subcategoría</Label><Input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} maxLength={100} /></div>
            <div><Label>Precio (COP) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={0} /></div>
            <div><Label>Precio original</Label><Input type="number" value={form.original_price ?? ""} onChange={(e) => setForm({ ...form, original_price: e.target.value ? Number(e.target.value) : null })} min={0} /></div>
            <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} min={0} /></div>
            <div><Label>URL de imagen</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} maxLength={500} /></div>
            <div className="md:col-span-2"><Label>Descripción</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} id="featured" />
              <Label htmlFor="featured">Producto destacado</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
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
                <th className="text-left p-3 text-muted-foreground font-medium">Producto</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Categoría</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Precio</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Stock</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 text-foreground">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3 text-right text-foreground">{formatCOP(p.price)}</td>
                  <td className="p-3 text-right">{p.stock > 0 ? <span className="text-green-400">{p.stock}</span> : <span className="text-red-400">0</span>}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(p)} className="p-1 hover:text-primary"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 hover:text-destructive ml-2"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay productos en la base de datos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
