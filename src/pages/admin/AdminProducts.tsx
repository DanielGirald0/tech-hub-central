import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { categories } from "@/data/products";

interface DBProduct {
  id: string;
  name: string;
  description: string | null;
  full_description: string | null;
  specifications: any[] | null;
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

interface SpecItem {
  label: string;
  value: string;
}

const emptyProduct = {
  name: "", description: "", full_description: "", price: 0, original_price: null as number | null,
  category: "", subcategory: "", brand: "", stock: 0, image_url: "", featured: false,
  specifications: [] as SpecItem[],
};

const AdminProducts = () => {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [editing, setEditing] = useState<DBProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const { toast } = useToast();

  const load = () => supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data }) => setProducts((data as any) || []));
  useEffect(() => { load(); }, []);

  const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) {
      toast({ title: "Nombre y categoría son obligatorios", variant: "destructive" });
      return;
    }
    const payload = {
      name: form.name, description: form.description, full_description: form.full_description,
      specifications: form.specifications, price: form.price, original_price: form.original_price,
      category: form.category, subcategory: form.subcategory, brand: form.brand,
      stock: form.stock, image_url: form.image_url, featured: form.featured,
    };
    if (editing) {
      const { error } = await supabase.from("products").update(payload as any).eq("id", editing.id);
      if (error) toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      else { toast({ title: "Producto actualizado" }); setEditing(null); load(); }
    } else {
      const { error } = await supabase.from("products").insert(payload as any);
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
    const specs = Array.isArray(p.specifications) ? p.specifications as SpecItem[] : [];
    setForm({
      name: p.name, description: p.description || "", full_description: p.full_description || "",
      price: p.price, original_price: p.original_price, category: p.category,
      subcategory: p.subcategory || "", brand: p.brand || "", stock: p.stock,
      image_url: p.image_url || "", featured: p.featured || false, specifications: specs,
    });
  };

  const closeForm = () => { setEditing(null); setCreating(false); setForm(emptyProduct); };

  const addSpec = () => setForm({ ...form, specifications: [...form.specifications, { label: "", value: "" }] });
  const updateSpec = (i: number, field: "label" | "value", val: string) => {
    const specs = [...form.specifications];
    specs[i] = { ...specs[i], [field]: val };
    setForm({ ...form, specifications: specs });
  };
  const removeSpec = (i: number) => {
    const specs = form.specifications.filter((_, idx) => idx !== i);
    setForm({ ...form, specifications: specs });
  };

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
            <div className="md:col-span-2"><Label>Descripción corta</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} /></div>
            <div className="md:col-span-2">
              <Label>Descripción completa</Label>
              <Textarea value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })} maxLength={5000} rows={4} placeholder="Descripción detallada del producto..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} id="featured" />
              <Label htmlFor="featured">Producto destacado</Label>
            </div>
          </div>

          {/* Specifications */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Características técnicas</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSpec}><Plus className="w-3 h-3 mr-1" />Agregar</Button>
            </div>
            {form.specifications.map((spec, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input placeholder="Ej: Procesador" value={spec.label} onChange={(e) => updateSpec(i, "label", e.target.value)} className="flex-1" />
                <Input placeholder="Ej: Intel Core i7" value={spec.value} onChange={(e) => updateSpec(i, "value", e.target.value)} className="flex-1" />
                <button onClick={() => removeSpec(i)} className="p-2 hover:text-destructive"><X className="w-4 h-4" /></button>
              </div>
            ))}
            {form.specifications.length === 0 && (
              <p className="text-xs text-muted-foreground">No hay características. Haz clic en "Agregar" para añadir.</p>
            )}
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
