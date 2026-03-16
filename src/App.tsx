import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Services from "./pages/Services";
import Security from "./pages/Security";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminServices from "./pages/admin/AdminServices";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/services" element={<Services />} />
                <Route path="/security" element={<Security />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/account" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute requiredRole="admin"><AdminProducts /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/services" element={<ProtectedRoute requiredRole="admin"><AdminServices /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
