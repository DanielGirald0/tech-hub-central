## Optimización integral — TECNO GZ

Trabajo dividido en 3 frentes: **Rendimiento**, **Limpieza de código** y **UX/UI + Accesibilidad**. Todo el trabajo se hace sin cambiar la lógica de negocio ni el diseño visual.

---

### 1. Rendimiento (velocidad de carga)

- **Optimizar imágenes bundled**: Instalar `vite-imagetools` y convertir los assets pesados (logo, hero, imágenes de productos y servicios) a **WebP/AVIF** con variantes responsive. Reducción esperada: 60-80% del peso de imagen.
- **Preload del LCP**: Añadir `<link rel="preload" as="image">` para la imagen principal del home en `index.html` con `fetchpriority="high"`.
- **Lazy loading uniforme**: Auditar `<img>` fuera de la vista inicial y añadir `loading="lazy"` + `decoding="async"`. Marcar solo el hero como `eager`.
- **Code splitting adicional**: Verificar que `Index.tsx` (home) sea liviano; mover `GoogleReviews`, `LocalReviews` y otros bloques below-the-fold a lazy chunks con `Suspense`.
- **React Query**: Revisar `staleTime`/`gcTime` en queries del panel admin y del taller para evitar refetches innecesarios.
- **Fuente Iosevka**: Actualmente se carga desde Google Fonts vía `@import` en `index.css`. Migrar a `@fontsource/iosevka` (self-hosted, sin bloqueo de render, cache local).
- **Prefetch de rutas críticas**: Añadir `<link rel="prefetch">` a `/products` y `/services` desde el home.

### 2. Limpieza de código

- **Eliminar imports muertos** en `Navbar.tsx` (`useRef`, `useEffect` importados y sin usar).
- **Consolidar utilidades WhatsApp**: `normalizePhone`, `whatsappLink` viven en `src/lib/repairs.ts` pero se usan también en otras pantallas — mover a `src/lib/whatsapp.ts` y reexportar.
- **Eliminar código no referenciado**: Buscar componentes/funciones sin imports (ripgrep sweep) y quitarlos.
- **Deduplicar formatters** (`formatCOP`, `formatDate`) — asegurar un único origen en `src/lib/format.ts`.
- **Revisar dependencias sin uso** en `package.json` con `depcheck`.

### 3. UX/UI + Accesibilidad

- **Colores semánticos**: Auditar y reemplazar clases hardcoded (`text-white`, `bg-black`, `text-gray-*`) por tokens del design system (`text-foreground`, `bg-background`, `text-muted-foreground`). No cambia el aspecto visual, respeta el theming.
- **Botones icon-only sin label**: Añadir `aria-label` a los botones de icono en `Navbar` (carrito, usuario, logout, menú móvil) y a los botones de acción en las tablas del admin.
- **Landmarks**: Verificar que exista **exactamente un `<main>`** por ruta (actualmente vive en `Layout.tsx`, revisar que no haya duplicados en páginas).
- **Focus visible**: Confirmar que todos los interactivos custom tengan estado `focus-visible` (los primitivos shadcn ya lo traen; auditar los custom).
- **Tap targets móviles**: Los botones `size="icon"` del Navbar deben ser ≥ 44×44 px en móvil (`min-h-11 min-w-11`).
- **Alt en imágenes**: Auditar `<img>` sin alt o con alt genérico.
- **`h-screen` → `h-dvh`** en layouts full-height para evitar el problema del address bar en móviles iOS.
- **Skip link**: Añadir "Saltar al contenido" para lectores de pantalla.

---

### Detalles técnicos

- Instalaciones: `bun add vite-imagetools @fontsource/iosevka`, `bun add -D depcheck`.
- Migración de imágenes: script one-shot con `sharp` para pre-generar WebP en `src/assets/` y actualizar imports a `?format=webp&w=800`.
- Verificación: build de Vite para comprobar tamaño del bundle antes/después, y Playwright para screenshot comparativo del home antes/después (debe verse idéntico).
- **No se modifica**: rutas, esquema de base de datos, RLS, integraciones (Alegra, WhatsApp), lógica del PDF, o diseño visual.

### Entrega

Se ejecuta en 3 commits lógicos: (1) rendimiento e imágenes, (2) limpieza de código y deps, (3) accesibilidad y tokens semánticos. Al final, screenshot antes/después del home y un resumen del delta de tamaño del bundle.