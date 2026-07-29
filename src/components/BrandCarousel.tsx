import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Brand {
  name: string;
  logo: string;
}

const brands: Brand[] = [
  { name: "JBL", logo: "/__l5e/assets-v1/b6a3d7fe-954c-435c-84c2-731618458559/jbl.png" },
  { name: "ADATA", logo: "/__l5e/assets-v1/2589c3af-ef6a-48df-911d-88f81de0c642/adata.png" },
  { name: "Kingston", logo: "/__l5e/assets-v1/3174c993-8904-4eb0-9881-5e27c3080e12/kingston.png" },
  { name: "TP-Link", logo: "/__l5e/assets-v1/71e11ea8-29b5-4091-b21d-fa8dfe2717f9/tp-link.png" },
  { name: "Crucial", logo: "/__l5e/assets-v1/79f1c18f-f80a-422d-ab93-3c45d753236a/crucial.png" },
  { name: "Samsung", logo: "/__l5e/assets-v1/151963d7-c93a-47ea-b538-4c7558ada4e8/samsung.png" },
  { name: "Apple", logo: "/__l5e/assets-v1/e948d13e-3413-4d74-bebb-8eb6c3dae14d/apple.png" },
  { name: "Lenovo", logo: "/__l5e/assets-v1/00ec4344-d341-4b4d-8af1-d73b21b1d07d/lenovo.png" },
  { name: "ASUS", logo: "/__l5e/assets-v1/3fc5cd50-ed56-4179-a8f5-fdef34303582/asus.png" },
  { name: "HP", logo: "/__l5e/assets-v1/ccdc6ee6-1dcf-457a-bf29-1afefe7ef13a/hp.png" },
  { name: "Dell", logo: "/__l5e/assets-v1/8ca40920-1378-449f-9aa5-2932bef0dbe5/dell.png" },
  { name: "Tenda", logo: "/__l5e/assets-v1/ccb97cce-07cf-4fda-b6cf-a305c705e5bc/tenda.png" },
  { name: "Hikvision", logo: "/__l5e/assets-v1/bcf0aeda-99aa-4974-a7b9-90b68ae8e12b/hikvision.png" },
  { name: "EZVIZ", logo: "/__l5e/assets-v1/f9dfb053-b7aa-468c-84a7-d8695085767a/ezviz.png" },
  { name: "IMOU", logo: "" },
  { name: "Western Digital", logo: "/__l5e/assets-v1/f9b6bb19-139a-41be-89f7-f1dccd411276/westerndigital.png" },
];

function BrandLogo({ brand }: { brand: Brand }) {
  const [error, setError] = useState(false);

  if (error || !brand.logo) {
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
