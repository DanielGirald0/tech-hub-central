import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative min-h-dvh flex flex-col bg-background overflow-x-hidden">
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
      {/* Corner diamond motif — inspired by brand business card */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Top-right cluster */}
        <div className="absolute -top-10 -right-10 w-[420px] h-[420px] opacity-50">
          <div className="absolute top-8 right-8 w-44 h-44 rotate-45 border-2 border-primary/60" />
          <div className="absolute top-28 right-28 w-32 h-32 rotate-45 border-2 border-primary/50 bg-primary/12" />
          <div className="absolute top-48 right-4 w-24 h-24 rotate-45 border-2 border-primary/40" />
          <div className="absolute top-2 right-48 w-20 h-20 rotate-45 border-2 border-primary/30" />
        </div>
        {/* Bottom-left cluster */}
        <div className="absolute -bottom-10 -left-10 w-[420px] h-[420px] opacity-50">
          <div className="absolute bottom-8 left-8 w-44 h-44 rotate-45 border-2 border-primary/60" />
          <div className="absolute bottom-28 left-28 w-32 h-32 rotate-45 border-2 border-primary/50 bg-primary/12" />
          <div className="absolute bottom-48 left-4 w-24 h-24 rotate-45 border-2 border-primary/40" />
          <div className="absolute bottom-2 left-48 w-20 h-20 rotate-45 border-2 border-primary/30" />
        </div>
      </div>
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
