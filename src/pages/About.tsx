import { Shield, Wrench, Users, Award } from "lucide-react";

const About = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-foreground mb-2">Sobre Tecno Gz</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Tu aliado tecnológico de confianza con más de 15 años de experiencia sirviendo a nuestra comunidad.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Nuestra historia</h2>
          <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
            <p>
              Tecno Gz nació con una misión sencilla: llevar los mejores productos y servicios de tecnología
              a nuestra comunidad a precios justos con soporte experto.
            </p>
            <p>
              Lo que comenzó como un pequeño taller de reparación de computadores se ha convertido en un centro
              tecnológico integral que ofrece más de 1.000 productos en múltiples categorías, junto con servicios
              profesionales de instalación y reparación.
            </p>
            <p>
              Hoy estamos orgullosos de servir a miles de clientes residenciales y comerciales en Rionegro y
              todo el oriente antioqueño, ofreciendo desde los últimos gadgets hasta instalaciones completas
              de sistemas de seguridad.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Shield, title: "Confianza", desc: "Distribuidor autorizado de las mejores marcas" },
            { icon: Wrench, title: "Expertos", desc: "Técnicos certificados en nuestro equipo" },
            { icon: Users, title: "5000+", desc: "Clientes satisfechos" },
            { icon: Award, title: "15 años", desc: "En la industria" },
          ].map((item) => (
            <div key={item.title} className="bg-card border border-border rounded-xl p-5 text-center">
              <item.icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-display font-bold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 text-center mb-12">
        <h2 className="font-display text-xl font-semibold text-foreground mb-3">Nuestra misión</h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Empoderar a nuestra comunidad con soluciones tecnológicas confiables, servicio excepcional
          y asesoría honesta — haciendo la tecnología accesible y sin complicaciones para todos.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">📍 Ubicación</h2>
          <div className="space-y-2 text-muted-foreground text-sm leading-relaxed">
            <p>Estamos ubicados en <strong className="text-foreground">Rionegro, Antioquia</strong>, en el corazón del oriente antioqueño.</p>
            <p>Nuestra tienda es de fácil acceso y contamos con un equipo listo para atenderte de manera presencial o remota.</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">📞 Contacto</h2>
          <div className="space-y-2 text-muted-foreground text-sm leading-relaxed">
            <p><strong className="text-foreground">Teléfono / WhatsApp:</strong> +57 310 7476909</p>
            <p><strong className="text-foreground">Ubicación:</strong> Rionegro, Antioquia, Colombia</p>
            <p>Escríbenos por WhatsApp o visítanos en nuestra tienda para asesoría personalizada.</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8">
        <h2 className="font-display text-xl font-semibold text-foreground mb-3">Nuestros valores</h2>
        <div className="grid sm:grid-cols-3 gap-6 mt-4">
          <div className="text-center">
            <p className="font-display font-bold text-foreground mb-1">Honestidad</p>
            <p className="text-xs text-muted-foreground">Asesoría transparente y precios justos siempre.</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-foreground mb-1">Calidad</p>
            <p className="text-xs text-muted-foreground">Productos originales y servicios profesionales garantizados.</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-foreground mb-1">Compromiso</p>
            <p className="text-xs text-muted-foreground">Nos dedicamos a resolver tus necesidades tecnológicas.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
