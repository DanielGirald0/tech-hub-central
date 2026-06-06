import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoreSettings {
  show_prices: boolean;
}

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (patch: Partial<StoreSettings>) => Promise<{ error: string | null }>;
}

const DEFAULTS: StoreSettings = { show_prices: true };

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  settings: DEFAULTS,
  loading: true,
  refresh: async () => {},
  updateSettings: async () => ({ error: null }),
});

export const useStoreSettings = () => useContext(StoreSettingsContext);

export const StoreSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await (supabase.from("store_settings") as any)
      .select("show_prices")
      .eq("id", true)
      .maybeSingle();
    if (data) setSettings({ show_prices: !!data.show_prices });
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("store_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row && typeof row.show_prices === "boolean") {
            setSettings({ show_prices: row.show_prices });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const updateSettings = async (patch: Partial<StoreSettings>) => {
    const { error } = await (supabase.from("store_settings") as any)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) return { error: error.message };
    setSettings((s) => ({ ...s, ...patch }));
    return { error: null };
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, refresh, updateSettings }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};