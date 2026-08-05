import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative min-h-dvh flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      {/* Ambient edge-only red glow — premium, subtle, non-interactive */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            "linear-gradient(to bottom, hsl(var(--primary) / 0.04), transparent 12%)",
            "linear-gradient(to top, hsl(var(--primary) / 0.04), transparent 12%)",
            "linear-gradient(to right, hsl(var(--primary) / 0.03), transparent 8%)",
            "linear-gradient(to left, hsl(var(--primary) / 0.03), transparent 8%)",
          ].join(", "),
        }}
      />
      <div className="relative z-10 flex flex-col min-h-dvh">
        <Navbar />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </div>
    </div>
  );
};

export default Layout;
