import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const TrackOrderCTA = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/seguimiento?q=${encodeURIComponent(q)}` : "/seguimiento");
  };

  return (
    <section className="relative -mt-6 sm:-mt-8 md:-mt-12 z-10">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-card border border-border/80 rounded-2xl p-4 sm:p-5 md:p-7 shadow-elevated overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex items-start md:items-center gap-3 md:flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-sm sm:text-base md:text-lg font-semibold text-foreground uppercase tracking-wider leading-tight">
                  Consultar Orden de Servicio
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 break-words">
                  Revisa el estado de tu reparación en tiempo real.
                </p>
              </div>
            </div>
            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 md:flex-[1.2] w-full">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Nº de orden o documento"
                className="flex-1 min-w-0 bg-secondary/60 border border-border rounded-lg px-4 h-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all"
              />
              <Button type="submit" className="h-11 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase tracking-wider">
                Consultar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackOrderCTA;