import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* Ambient edge-only red glow — premium, subtle, non-interactive */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            "linear-gradient(to bottom, hsl(var(--primary) / 0.07), transparent 12%)",
            "linear-gradient(to top, hsl(var(--primary) / 0.07), transparent 12%)",
            "linear-gradient(to right, hsl(var(--primary) / 0.05), transparent 8%)",
            "linear-gradient(to left, hsl(var(--primary) / 0.05), transparent 8%)",
          ].join(", "),
        }}
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </div>
    </div>
  );
};

export default Layout;
