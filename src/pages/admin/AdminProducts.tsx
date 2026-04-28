import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";

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
  reference?: string | null;
  sku?: string | null;
  base_price?: number | null;
  final_price?: number | null;
  tax_percentage?: number | null;
  stock: number;
  image_url: string | null;
  rating: number | null;
  featured: boolean | null;
  product_type?: string;
  product_categories?: { category_id: string }[];
}

interface SpecItem {
  label: string;
  value: string;
}

interface Category {
  id: string;
  name: string;
}

const emptyProduct = {
  name: "", description: "", full_description: "", price: 0, original_price: null as number | null,
  category: "", subcategory: "", brand: "", stock: 0, image_url: "", featured: false,
  product_type: "product", specifications: [] as SpecItem[],
};

const AdminProducts = () => {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<DBProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const { toast } = useToast();

  const load = () => supabase.from("products").select("*, product_categories(category_id)").order("created_at", { ascending: false }).then(({ data }) => setProducts((data as any) || []));
  const loadCategories = () => supabase.from("categories" as any).select("id,name").eq("active", true).order("name").then(({ data }) => setCategories((data as any) || []));
  useEffect(() => { load(); loadCategories(); }, []);

  const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" });
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
      else {
        await supabase.from("product_categories" as any).delete().eq("product_id", editing.id);
        if (selectedCategoryIds.length > 0) await supabase.from("product_categories" as any).insert(selectedCategoryIds.map((category_id) => ({ product_id: editing.id, category_id })));
        toast({ title: "Producto actualizado" }); setEditing(null); load();
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload as any).select("id").single();
      if (error) toast({ title: "Error al crear", description: error.message, variant: "destructive" });
      else {
        if (selectedCategoryIds.length > 0) await supabase.from("product_categories" as any).insert(selectedCategoryIds.map((category_id) => ({ product_id: (data as any).id, category_id })));
        toast({ title: "Producto creado" }); setCreating(false); setForm(emptyProduct); setSelectedCategoryIds([]); load();
      }
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
      image_url: p.image_url || "", featured: p.featured || false, product_type: p.product_type || "product", specifications: specs,
    });
    setSelectedCategoryIds((p.product_categories || []).map((link) => link.category_id));
  };

  const closeForm = () => { setEditing(null); setCreating(false); setForm(emptyProduct); setSelectedCategoryIds([]); };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((current) => current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]);
  };

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
        <Button onClick={() => { setCreating(true); setEditing(null); setForm(emptyProduct); setSelectedCategoryIds([]); }}><Plus className="w-4 h-4 mr-2" />Nuevo producto</Button>
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
            <div><Label>Categoría principal</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="">Seleccionar</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div><Label>Tipo *</Label>
              <select value={form.product_type} onChange={(e) => setForm({ ...form, product_type: e.target.value })} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="product">Producto</option>
                <option value="service">Servicio</option>
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


          <div className="mt-6">
            <Label className="text-base">Categorías del producto</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
                  <input type="checkbox" checked={selectedCategoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                  {category.name}
                </label>
              ))}
            </div>
            {categories.length === 0 && <p className="text-xs text-muted-foreground mt-2">Crea categorías en el panel de categorías para asignarlas.</p>}
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
                <th className="text-left p-3 text-muted-foreground font-medium">Referencia</th>
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
                  <td className="p-3 text-muted-foreground">{p.reference || p.sku || "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3 text-right text-foreground">
                    <div>{formatCOP(p.final_price ?? p.price)}</div>
                    <div className="text-xs text-muted-foreground">IVA incluido</div>
                  </td>
                  <td className="p-3 text-right">
                    {p.stock > 0 ? (
                      <span className="text-foreground">{p.stock}</span>
                    ) : (
                      <Badge variant="destructive">Agotado</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(p)} className="p-1 hover:text-primary"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 hover:text-destructive ml-2"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay productos en la base de datos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
