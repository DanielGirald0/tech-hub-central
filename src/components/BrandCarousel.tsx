import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import jblLogo from "@/assets/brands/jbl.png";
import adataLogo from "@/assets/brands/adata.png";
import kingstonLogo from "@/assets/brands/kingston.png";
import tplinkLogo from "@/assets/brands/tp-link.png";
import crucialLogo from "@/assets/brands/crucial.png";
import samsungLogo from "@/assets/brands/samsung.png";
import appleLogo from "@/assets/brands/apple.png";
import lenovoLogo from "@/assets/brands/lenovo.png";
import asusLogo from "@/assets/brands/asus.png";
import hpLogo from "@/assets/brands/hp.png";
import dellLogo from "@/assets/brands/dell.png";
import tendaLogo from "@/assets/brands/tenda.png";
import hikvisionLogo from "@/assets/brands/hikvision.png";
import ezvizLogo from "@/assets/brands/ezviz.png";
import imouLogo from "@/assets/brands/imou.png";
import wdLogo from "@/assets/brands/westerndigital.png";

interface Brand {
  name: string;
  logo: string;
}

const brands: Brand[] = [
  { name: "JBL", logo: jblLogo },
  { name: "ADATA", logo: adataLogo },
  { name: "Kingston", logo: kingstonLogo },
  { name: "TP-Link", logo: tplinkLogo },
  { name: "Crucial", logo: crucialLogo },
  { name: "Samsung", logo: samsungLogo },
  { name: "Apple", logo: appleLogo },
  { name: "Lenovo", logo: lenovoLogo },
  { name: "ASUS", logo: asusLogo },
  { name: "HP", logo: hpLogo },
  { name: "Dell", logo: dellLogo },
  { name: "Tenda", logo: tendaLogo },
  { name: "Hikvision", logo: hikvisionLogo },
  { name: "EZVIZ", logo: ezvizLogo },
  { name: "IMOU", logo: imouLogo },
  { name: "Western Digital", logo: wdLogo },
];

function BrandLogo({ brand }: { brand: Brand }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full px-2">
        <span className="font-display font-semibold text-sm sm:text-base text-foreground uppercase tracking-wider text-center">
          {brand.name}
        </span>
      </div>
    );
  }

  return (
      <img
        src={brand.logo}
        alt={`Logo de ${brand.name}`}
        loading="lazy"
        decoding="async"
        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        onError={() => setError(true)}
      />
  );
}

export function BrandCarousel() {
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(brands.length / itemsPerPage));
  const maxIndex = totalPages - 1;

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1280) setItemsPerPage(6);
      else if (width >= 1024) setItemsPerPage(5);
      else if (width >= 640) setItemsPerPage(4);
      else setItemsPerPage(2);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [itemsPerPage, maxIndex]);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <section className="py-10 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground uppercase tracking-wider">
            Marcas que manejamos
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Marcas anteriores"
              className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary hover:border-primary/50 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={next}
              aria-label="Marcas siguientes"
              className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary hover:border-primary/50 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        <div
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={trackRef}
            className="flex transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <div
                key={pageIndex}
                className="grid shrink-0 w-full"
                style={{ gridTemplateColumns: `repeat(${itemsPerPage}, minmax(0, 1fr))` }}
              >
                {brands
                  .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
                  .map((brand) => (
                    <div
                      key={brand.name}
                      className="group flex items-center justify-center h-20 sm:h-24 px-3 sm:px-4 border-r border-border last:border-r-0 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="h-10 sm:h-12 w-full flex items-center justify-center">
                        <BrandLogo brand={brand} />
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Ir a página de marcas ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default BrandCarousel;
