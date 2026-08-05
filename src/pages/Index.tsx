import { Link } from "react-router-dom";
import { ArrowRight, Shield, Wrench, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import ServiceCard from "@/components/ServiceCard";

import { services } from "@/data/products";
import { listFeatured } from "@/lib/alegra-catalog";
import GoogleReviews from "@/components/GoogleReviews";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import FloatingCartButton from "@/components/FloatingCartButton";
import tiendaAsset from "@/assets/tienda-tecnogz.jpg.asset.json";

const featuredServices = services.slice(0, 4);

const Index = () => {
  const { data: featuredProducts = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => listFeatured(8),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div>
      <FloatingCartButton />
      <SEO
        title="Tecno Gz | Tecnología y Servicio Técnico en Rionegro"
        description="Venta de tecnología, reparación de equipos e instalación de seguridad electrónica en Rionegro, Antioquia. Servicio técnico profesional."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Tecno Gz",
            description: "Venta de tecnología, servicio técnico y seguridad electrónica en Rionegro, Antioquia.",
            telephone: "+57 310 747 6909",
            priceRange: "$$",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Rionegro",
              addressRegion: "Antioquia",
              addressCountry: "CO",
            },
            areaServed: ["Rionegro", "Oriente Antioqueño", "Antioquia"],
            sameAs: ["https://wa.me/573107476909"],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Tecno Gz",
            inLanguage: "es-CO",
            potentialAction: {
              "@type": "SearchAction",
              target: "/products?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
      {/* Hero */}
      <section className="relative bg-gradient-hero overflow-hidden">
        {/* Foto de la tienda difuminada de fondo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center scale-105 blur-[1px]"
          style={{ backgroundImage: `url(${tiendaAsset.url})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-background/50"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--background) / 0.85), hsl(var(--background) / 0.45) 50%, hsl(var(--background)))",
          }}
        />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-16 sm:py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="font-display text-fluid-h1 font-bold text-foreground mb-2 uppercase tracking-wider break-words">
              TECNO GZ
            </h1>
            <p className="font-display text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 uppercase tracking-wider break-words">
              Venta de Tecnología y Servicio Técnico en Rionegro
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-primary mb-4 font-display font-medium">
              Pasión y servicio de confianza
            </p>
            <p className="text-fluid-lead text-muted-foreground mb-8 max-w-xl mx-auto px-2">
              Productos de vanguardia, instalación profesional y servicio técnico experto.
              Todo lo que tu hogar y negocio necesitan en Rionegro, Antioquia.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-display">
                <Link to="/products">Ver productos <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
                <Link to="/services">Nuestros servicios</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>




      {/* Featured Products */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Productos destacados
            </h2>
            <Link to="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loadingFeatured ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No hay productos destacados.</p>
            )}
          </div>
        </div>
      </section>

      {/* Security Solutions Banner */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-card rounded-2xl border border-border p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">Soluciones de seguridad</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Protege lo que más importa
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Soluciones completas de seguridad: cámaras, alarmas, control de acceso y videoporteros.
                  Instalación profesional disponible.
                </p>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/security">Explorar soluciones <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {[
                  { icon: "📷", label: "Cámaras" },
                  { icon: "🚨", label: "Alarmas" },
                  { icon: "🔐", label: "Control de acceso" },
                  { icon: "🔔", label: "Videoporteros" },
                ].map((item) => (
                  <div key={item.label} className="bg-secondary/50 rounded-xl p-4 text-center min-w-[100px]">
                    <span className="text-2xl block mb-1">{item.icon}</span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Servicios técnicos especializados
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Reparación profesional, instalación y asesoría por técnicos certificados.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="border-border text-foreground hover:bg-secondary">
              <Link to="/services">Todos los servicios <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10 text-center">
            ¿Por qué elegir Tecno Gz?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Servicio rápido", desc: "Reparaciones el mismo día e instalaciones ágiles. Valoramos tu tiempo." },
              { icon: Shield, title: "Calidad garantizada", desc: "Todos nuestros productos y servicios cuentan con garantía y soporte." },
              { icon: Wrench, title: "Equipo experto", desc: "Técnicos certificados con más de 5 años de experiencia combinada." },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "1000+", label: "Productos" },
              { value: "10+", label: "Servicios" },
              { value: "5000+", label: "Clientes felices" },
              { value: "5+", label: "Años de experiencia" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <GoogleReviews />

      {/* Newsletter */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-card rounded-2xl border border-border p-8 md:p-12 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Mantente informado</h2>
            <p className="text-muted-foreground mb-6">Recibe las mejores ofertas y novedades tech en tu correo.</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="tu@correo.com"
                className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Suscribirse</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
