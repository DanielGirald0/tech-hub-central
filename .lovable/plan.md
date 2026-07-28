# Migración del catálogo a Alegra (fuente única)

Cambio de arquitectura: la app deja de sincronizar productos a la BD y consulta Alegra en tiempo real vía una edge function proxy con caché.

## 1. Nueva edge function `alegra-catalog` (proxy con caché)

Nuevo archivo `supabase/functions/alegra-catalog/index.ts`. Es pública (no requiere JWT) y expone estas acciones vía query param `?action=`:

- `list` — parámetros: `page`, `pageSize` (máx 30), `category`, `type`, `search`, `minPrice`, `maxPrice`, `inStockOnly` (default `true`), `featuredOnly`, `ids` (CSV). Recorre paginación de Alegra (30/req) sólo hasta cubrir la página pedida. Devuelve `{ items, total, page, pageSize }`.
- `get` — `id`: devuelve un producto por id de Alegra.
- `categories` — lista categorías desde `/item-categories` de Alegra.
- `featured` — atajo para destacados (usa metadata custom si existe; si no, primeros N con stock).

Detalles:
- Autenticación a Alegra con `ALEGRA_EMAIL` / `ALEGRA_API_TOKEN` (ya existen).
- Búsqueda usa `query` de Alegra (matches por nombre y referencia).
- Filtro `inStockOnly` aplicado del lado servidor; en modo búsqueda explícita, se omite y se marca `outOfStock: true`.
- Mapeo de item Alegra → forma que consume el front: `{ id, name, description, price, stock, category, brand, reference, image_url, inStock, product_type }`.
- Imagen: usa `images[0].url` directamente desde Alegra (sin descargar ni almacenar). Si expira ocasionalmente, se muestra placeholder.
- **Caché en memoria** dentro de la function (TTL 60s por combinación de params + índice de categorías con TTL 5 min) para reducir llamadas.
- CORS abierto para el frontend.

## 2. Configuración de la function

Añadir a `supabase/config.toml`:
```
[functions.alegra-catalog]
verify_jwt = false
```

## 3. Cambios en el frontend

Crear `src/lib/alegra-catalog.ts` con helpers tipados (`listProducts`, `getProduct`, `listCategories`, `listFeatured`) que invocan la edge function vía `supabase.functions.invoke`.

Actualizar:
- `src/pages/Products.tsx` — reemplaza `supabase.from("products")` por `listProducts`. Paginación server-side. Filtros de categoría/tipo/precio siguen igual, pero se envían como params. Lógica de "sin stock oculto salvo búsqueda explícita" implementada activando `inStockOnly` sólo cuando no hay `search`.
- `src/pages/ProductDetail.tsx` — `getProduct(id)` + productos relacionados vía `listProducts({ category, limit: 4 })`.
- `src/pages/Index.tsx` — `listFeatured()` para destacados de home.
- `src/components/ProductCard.tsx` — sin cambios funcionales (mismo shape).
- `src/pages/Cart.tsx` — el carrito guarda snapshots (id de Alegra, nombre, precio, imagen). Al abrir checkout, re-consulta stock/price actualizados vía `getProduct` para validar.

## 4. Ajustes en `alegra-create-order`

- Ya no lee `products` de la BD. Recibe `items` con `alegra_id`, `name`, `price`, `quantity`.
- Revalida `price` y `stock` consultando `/items/{id}` de Alegra antes de crear la factura.
- `order_items.product_id` (uuid, FK) queda inviable → migración: hacer `product_id` nullable y agregar columnas `alegra_item_id text`, `product_name text`, `product_reference text`. Se llena con snapshot del item facturado.

## 5. Admin

- Eliminar página `/admin/products` (CRUD de la tabla local) y su ruta en `App.tsx`.
- Eliminar `/admin/alegra` (sincronización) y su ruta.
- `AdminDashboard`: reemplazar contador `products` por conteo obtenido de Alegra (una llamada a `list` con `pageSize=1` para leer `total`), o simplemente ocultar la tarjeta si prefieres — mantengo la tarjeta con conteo Alegra.
- `AdminCategories`: mantiene categorías locales sólo si se siguen usando para agrupar UI; si no, se elimina. **Propuesta:** eliminarla y usar categorías Alegra.

## 6. Base de datos — migración de limpieza

Migración SQL:
- `ALTER TABLE public.order_items` → `product_id` nullable, agrega `alegra_item_id text`, `product_name text`, `product_reference text`, `product_image_url text`.
- Elimina foreign key `order_items.product_id → products.id` (drop constraint).
- Elimina tabla `product_categories`.
- Elimina tabla `products`.
- Elimina tabla `categories` (si confirmamos removerla).
- Elimina cron job de sincronización si existe.
- Elimina bucket `product-images` y sus policies.
- Borra edge function `alegra-sync-products` (archivo y `supabase/functions/alegra-sync-products/`).

Historial de pedidos previos: seguirá mostrando `product_name` desde el snapshot en `order_items` (por eso agregamos las columnas antes de dropear la FK).

## 7. MCP

- `src/lib/mcp/tools/list-products.ts` y `supabase/functions/mcp/index.ts` → cambiar a consultar Alegra vía el helper/edge function.

## 8. Validación

- Verificar que Home, Productos (con y sin filtros), Detalle, Carrito, Checkout y Admin funcionen.
- Confirmar que un pedido pasado (previo a la migración) se sigue visualizando en `AdminOrders` con nombre de producto (snapshot).
- Confirmar que buscar un producto sin stock lo muestra como "Agotado" y no se puede añadir al carrito.

## Detalles técnicos

```text
Frontend ──invoke──▶ edge:alegra-catalog ──HTTPS──▶ Alegra API
                          │
                          └── caché en memoria (TTL corto)
```

- La edge function usa caché por proceso (efímero); no requiere Redis.
- Todas las llamadas al catálogo pasan por la function; el frontend nunca recibe credenciales de Alegra.
- Se conservan tablas: `orders`, `order_items` (ajustada), `store_settings`, `profiles`, módulo repairs, reviews, etc.

## Riesgo / puntos a confirmar antes de ejecutar

1. **¿Eliminar tablas `products`, `product_categories` y `categories`?** Se pierden datos que no existen en Alegra (ej. `featured`, `full_description`, `subcategory`, `specifications` JSON). Si quieres conservar "destacados" o specs manuales, dejo una tabla `product_overrides(alegra_id, featured, full_description, specifications)` y la function hace merge. **Recomiendo esta opción.**
2. **`AdminCategories`** — ¿la eliminamos o queda como categorías propias además de las de Alegra? Recomiendo eliminarla.
3. Confirmar que quieres eliminar también el bucket `product-images`.

Cuando confirmes esos 3 puntos, ejecuto el plan completo.
