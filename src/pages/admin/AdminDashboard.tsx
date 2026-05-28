import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Package, Users, ShoppingCart, Wrench, BarChart3, RefreshCw, Tags, Star, ClipboardList } from "lucide-react";
import logo from "@/assets/logo-tecnogz-official.png";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, services: 0, categories: 0, reviews: 0, repairs: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("service_requests").select("id", { count: "exact", head: true }),
      supabase.from("categories" as any).select("id", { count: "exact", head: true }),
      supabase.from("reviews" as any).select("id", { count: "exact", head: true }).eq("approved", false),
      supabase.from("repair_orders" as any).select("id", { count: "exact", head: true }).not("status", "in", "(entregado,cancelado)"),
    ]).then(([p, o, u, s, c, r, rp]) => {
      setStats({ products: p.count || 0, orders: o.count || 0, users: u.count || 0, services: s.count || 0, categories: c.count || 0, reviews: r.count || 0, repairs: rp.count || 0 });
    });
  }, []);

  const cards = [
    { label: "Productos", count: stats.products, icon: Package, href: "/admin/products", color: "text-blue-400" },
    { label: "Categorías", count: stats.categories, icon: Tags, href: "/admin/categories", color: "text-primary" },
    { label: "Pedidos", count: stats.orders, icon: ShoppingCart, href: "/admin/orders", color: "text-green-400" },
    { label: "Usuarios", count: stats.users, icon: Users, href: "/admin/users", color: "text-purple-400" },
    { label: "Servicios", count: stats.services, icon: Wrench, href: "/admin/services", color: "text-orange-400" },
    { label: "Reseñas pendientes", count: stats.reviews, icon: Star, href: "/admin/reviews", color: "text-yellow-400" },
    { label: "Servicio técnico", count: stats.repairs, icon: ClipboardList, href: "/admin/repairs", color: "text-pink-400" },
    { label: "Alegra Sync", count: 0, icon: RefreshCw, href: "/admin/alegra", color: "text-red-400" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
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
