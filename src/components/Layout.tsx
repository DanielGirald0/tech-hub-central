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
      {/* Premium ambient red glow — subtle, around the edges */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80vw] h-64 bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute top-1/3 -left-40 w-72 h-[60vh] bg-primary/[0.06] blur-3xl rounded-full" />
        <div className="absolute top-1/4 -right-40 w-72 h-[60vh] bg-primary/[0.06] blur-3xl rounded-full" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[80vw] h-64 bg-primary/[0.08] blur-3xl rounded-full" />
      </div>
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
