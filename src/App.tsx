import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { StoreSettingsProvider } from "@/contexts/StoreSettingsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
const Products = lazy(() => import("./pages/Products"));
const Services = lazy(() => import("./pages/Services"));
const Security = lazy(() => import("./pages/Security"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminRepairsDashboard = lazy(() => import("./pages/admin/repairs/AdminRepairsDashboard"));
const AdminRepairOrders = lazy(() => import("./pages/admin/repairs/AdminRepairOrders"));
const AdminRepairOrderNew = lazy(() => import("./pages/admin/repairs/AdminRepairOrderNew"));
const AdminRepairOrderDetail = lazy(() => import("./pages/admin/repairs/AdminRepairOrderDetail"));
const AdminRepairCustomers = lazy(() => import("./pages/admin/repairs/AdminRepairCustomers"));
const AdminRepairReports = lazy(() => import("./pages/admin/repairs/AdminRepairReports"));
const TrackRepair = lazy(() => import("./pages/TrackRepair"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <StoreSettingsProvider>
            <CartProvider>
              <Layout>
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/services" element={<Services />} />
                <Route path="/security" element={<Security />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/seguimiento" element={<TrackRepair />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/account" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute requiredRole="admin"><AdminOrders /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/reviews" element={<ProtectedRoute requiredRole="admin"><AdminReviews /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AdminSettings /></ProtectedRoute>} />
                <Route path="/admin/repairs" element={<ProtectedRoute requiredRole={["admin","technician"]}><AdminRepairsDashboard /></ProtectedRoute>} />
                <Route path="/admin/repairs/orders" element={<ProtectedRoute requiredRole={["admin","technician"]}><AdminRepairOrders /></ProtectedRoute>} />
                <Route path="/admin/repairs/orders/new" element={<ProtectedRoute requiredRole={["admin","technician"]}><AdminRepairOrderNew /></ProtectedRoute>} />
                <Route path="/admin/repairs/orders/:id" element={<ProtectedRoute requiredRole={["admin","technician"]}><AdminRepairOrderDetail /></ProtectedRoute>} />
                <Route path="/admin/repairs/customers" element={<ProtectedRoute requiredRole={["admin","technician"]}><AdminRepairCustomers /></ProtectedRoute>} />
                <Route path="/admin/repairs/reports" element={<ProtectedRoute requiredRole={["admin","technician"]}><AdminRepairReports /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </Layout>
            </CartProvider>
          </StoreSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
