import { Link } from "react-router-dom";
import { ArrowRight, Shield, Wrench, Zap, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import ServiceCard from "@/components/ServiceCard";
import { products, categories, services } from "@/data/products";

const featuredProducts = products.filter((p) => p.featured);
const featuredServices = services.slice(0, 4);

const testimonials = [
  { name: "Carlos M.", text: "Excellent service! They installed my security camera system in one afternoon. Very professional.", rating: 5 },
  { name: "Maria L.", text: "Best tech store in town. Great prices and the staff really knows their stuff.", rating: 5 },
  { name: "David R.", text: "Got my laptop repaired same day. Fast and reliable service.", rating: 4 },
];

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your Complete <span className="text-gradient">Technology</span> Partner
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              From cutting-edge products to expert installation and repair services.
              We provide everything your home and business needs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-display">
                <Link to="/products">Shop Products <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
                <Link to="/services">Our Services</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "1000+", label: "Products" },
              { value: "10+", label: "Services" },
              { value: "5000+", label: "Happy Clients" },
              { value: "15+", label: "Years Experience" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 hover:shadow-glow transition-all duration-300 group"
              >
                <span className="text-2xl block mb-2">{cat.icon}</span>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{cat.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} items</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Featured Products
            </h2>
            <Link to="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">Security Solutions</span>
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Protect What Matters Most
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Complete security solutions including cameras, alarms, access control, and video intercom systems.
                  Professional installation and 24/7 monitoring available.
                </p>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/security">Explore Solutions <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 shrink-0">
                {[
                  { icon: "📷", label: "Cameras" },
                  { icon: "🚨", label: "Alarms" },
                  { icon: "🔐", label: "Access Control" },
                  { icon: "🔔", label: "Intercom" },
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
              Expert Technical Services
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Professional repair, installation, and consulting services by certified technicians.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="border-border text-foreground hover:bg-secondary">
              <Link to="/services">All Services <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10 text-center">
            Why Choose TechStore
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Fast Service", desc: "Same-day repairs and quick installations. We value your time." },
              { icon: Shield, title: "Guaranteed Quality", desc: "All products and services come with warranty and support." },
              { icon: Wrench, title: "Expert Team", desc: "Certified technicians with 15+ years of combined experience." },
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

      {/* Testimonials */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10 text-center">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                <p className="font-display font-semibold text-foreground text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-card rounded-2xl border border-border p-8 md:p-12 text-center max-w-2xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-foreground mb-3">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">Get the latest deals and tech news delivered to your inbox.</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
