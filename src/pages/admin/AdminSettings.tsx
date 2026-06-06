import BackButton from "@/components/BackButton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import { Eye, EyeOff, Loader2, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AdminSettings = () => {
  const { settings, loading, updateSettings } = useStoreSettings();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    const { error } = await updateSettings({ show_prices: value });
    setSaving(false);
    if (error) {
      toast.error("No se pudo actualizar: " + error);
    } else {
      toast.success(value ? "Precios visibles al público" : "Precios ocultos al público");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <BackButton />
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-wider">Configuración de Tienda</h1>
          <p className="text-muted-foreground text-sm">Ajustes globales que afectan a toda la tienda</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="font-display font-semibold text-foreground uppercase tracking-wider mb-4">Visualización de precios</h2>

          <div className={`flex items-center gap-3 mb-5 px-4 py-3 rounded-lg border ${settings.show_prices ? "border-green-500/40 bg-green-500/5" : "border-yellow-500/40 bg-yellow-500/5"}`}>
            {settings.show_prices ? (
              <>
                <Eye className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-foreground">Estado actual: Precios visibles</p>
                  <p className="text-xs text-muted-foreground">Los clientes pueden ver los precios y comprar normalmente.</p>
                </div>
              </>
            ) : (
              <>
                <EyeOff className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-foreground">Estado actual: Precios ocultos</p>
                  <p className="text-xs text-muted-foreground">Los clientes verán "Consultar precio" por WhatsApp. Carrito y checkout desactivados.</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between bg-secondary rounded-lg px-4 py-3">
            <div>
              <Label htmlFor="show-prices" className="text-foreground cursor-pointer">Mostrar precios al público</Label>
              <p className="text-xs text-muted-foreground mt-1">Aplica a catálogo, búsqueda, detalle y productos relacionados.</p>
            </div>
            <div className="flex items-center gap-2">
              {(saving || loading) && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Switch id="show-prices" checked={settings.show_prices} disabled={saving || loading} onCheckedChange={handleToggle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;