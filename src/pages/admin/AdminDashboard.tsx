import BackButton from "@/components/BackButton";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShoppingCart, BarChart3, Star, ClipboardList, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { useStoreSettings } from "@/contexts/StoreSettingsContext";
import logo from "@/assets/logo-tecnogz.webp";

const AdminDashboard = () => {
  const { settings } = useStoreSettings();
  const { data: stats = { orders: 0, users: 0, reviews: 0, repairs: 0 } } = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_admin_dashboard_stats");
      if (error || !data) return { orders: 0, users: 0, reviews: 0, repairs: 0 };
      return {
        orders: Number(data.orders) || 0,
        users: Number(data.users) || 0,
        reviews: Number(data.reviews) || 0,
        repairs: Number(data.repairs) || 0,
      };
    },
  });

  const cards = [
    { label: "Pedidos", count: stats.orders, icon: ShoppingCart, href: "/admin/orders", color: "text-green-400" },
    { label: "Usuarios", count: stats.users, icon: Users, href: "/admin/users", color: "text-purple-400" },
    { label: "Reseñas pendientes", count: stats.reviews, icon: Star, href: "/admin/reviews", color: "text-yellow-400" },
    { label: "Servicio técnico", count: stats.repairs, icon: ClipboardList, href: "/admin/repairs", color: "text-pink-400" },
    { label: settings.show_prices ? "Config: Precios visibles" : "Config: Precios ocultos", count: 0, icon: SettingsIcon, href: "/admin/settings", color: settings.show_prices ? "text-green-400" : "text-yellow-400" },
    { label: "Productos destacados", count: 0, icon: Sparkles, href: "/admin/featured", color: "text-blue-400" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton />
      <div className="flex items-center gap-3 mb-8">
        <img src={logo} alt="Tecno Gz" className="w-14 h-14 object-contain" />
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground uppercase tracking-wider">TECNO GZ</h1>
          <p className="text-muted-foreground">Panel de Administración</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((c) => (
          <Link key={c.label} to={c.href} className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <c.icon className={`w-8 h-8 ${c.color}`} />
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="font-display text-3xl font-bold text-foreground">{c.count}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((c) => (
          <Link key={c.label} to={c.href} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
            <c.icon className={`w-6 h-6 ${c.color}`} />
            <div>
              <p className="font-medium text-foreground">Gestionar {c.label.toLowerCase()}</p>
              <p className="text-xs text-muted-foreground">Ver, crear, editar y eliminar</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
