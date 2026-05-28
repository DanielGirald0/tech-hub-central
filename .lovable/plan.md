# Sincronización inteligente del módulo técnico

Objetivo: usar el **número de documento (cédula)** como identificador único que conecta cuentas de usuario con clientes del módulo de servicio técnico, en ambos sentidos.

## 1. Base de datos (1 migración)

**`profiles`** — agregar columna:
- `document_number TEXT UNIQUE` (nullable, normalizado: solo dígitos)
- índice único parcial `WHERE document_number IS NOT NULL`

**`repair_customers`** — agregar columnas:
- `document_number TEXT UNIQUE NOT NULL` (obligatorio en nuevas órdenes; migración existente: nullable inicial + backfill manual)
- `user_id UUID` (FK lógica a `auth.users`, nullable) — vínculo con la cuenta
- índice único parcial sobre `document_number`
- índice sobre `user_id`

**Función `public.link_repair_customer_to_user()`** (SECURITY DEFINER):
- Se ejecuta en `handle_new_user` y cuando el usuario actualiza su `document_number` en profiles
- Busca `repair_customers` con el mismo documento y setea `user_id`
- Actualiza también email/teléfono si faltan

**Función `public.find_repair_customer_by_document(_doc TEXT)`** (SECURITY DEFINER, solo admin):
- Devuelve datos del cliente + datos del usuario registrado si existe (join `profiles` por documento)
- Usada por el form de nueva orden para autocompletar

**Función `public.get_my_repair_orders()`** (SECURITY DEFINER):
- Devuelve órdenes del usuario autenticado uniendo por `user_id` directo o por `document_number` en su profile
- Usada en el Dashboard del cliente

**Trigger en `profiles`**: al INSERT/UPDATE de `document_number`, llamar `link_repair_customer_to_user`.

## 2. Frontend

**`AdminRepairOrderNew.tsx`** (cliente nuevo):
- Campo `Cédula/Documento *` como primer input
- Al hacer blur/debounce → llama `find_repair_customer_by_document`
- Si encuentra: auto-rellena nombre/tel/email/dirección + muestra badge "Cliente existente" con link a su historial
- Validación: documento obligatorio + email válido si se ingresa
- Backend: usa `upsert` por documento para evitar duplicados

**`AdminRepairCustomers.tsx`**:
- Mostrar columna "Documento" y badge "Cuenta vinculada" cuando `user_id IS NOT NULL`
- Buscador por documento/nombre/teléfono

**`Dashboard.tsx`** (cliente):
- Nueva pestaña **"Servicio Técnico"** que llama `get_my_repair_orders`
- Lista órdenes con estado, equipo, fecha, garantía, link a `/seguimiento?n=...`
- Si el profile no tiene `document_number`: banner "Agrega tu documento para ver tu historial técnico"

**`Register.tsx`**:
- Agregar campo opcional **"Número de documento"** durante el registro
- Se guarda en profile → trigger auto-vincula órdenes previas
- Toast: "Hemos encontrado N órdenes de servicio asociadas a tu cédula"

**`TrackRepair.tsx`** (consulta pública):
- Después de mostrar resultado, si el usuario NO está autenticado → modal moderno:
  > "Regístrate para tener una mejor experiencia y acceder a tu historial completo, garantías y seguimiento en tiempo real."
  - Botones: **Crear cuenta** / **Iniciar sesión**
- Si SÍ está autenticado pero la orden no está vinculada a su cuenta y su documento coincide → vincular automáticamente

**`components/BackButton.tsx`** (nuevo):
- Componente reutilizable: ícono `ArrowLeft` + "Volver"
- Usa `navigate(-1)` con fallback a `/` si `history.length <= 1`
- Mobile-friendly (top-left fijo, oculto en home)
- Integrado en: `Services`, `Products`, `ProductDetail`, `Cart`, `Contact`, `About`, `Security`, `TrackRepair`, `Dashboard`, todas las páginas admin

## 3. Anti-duplicados

- `document_number UNIQUE` a nivel DB (constraint dura)
- Al crear orden: `INSERT ... ON CONFLICT (document_number) DO UPDATE` en `repair_customers`
- Validación frontend: si el documento existe → forzar modo "cliente existente"
- Email no se exige único (un cliente puede no tener email); se valida formato

## 4. Detalles técnicos

- Normalización: documento = solo dígitos, mínimo 5
- Migración de datos existentes: clientes actuales sin documento quedan con `NULL`; admin debe completarlos al editar (banner en lista de clientes)
- `get_my_repair_orders` evita exponer datos sensibles (solo del usuario)
- Sin cambios en `repair_orders` ni `repair_devices` (siguen apuntando a `customer_id`)
- `App.tsx`: sin cambios de rutas
- No se toca el flujo de pedidos/ecommerce existente

## Archivos a crear/editar

**Crear:**
- `src/components/BackButton.tsx`
- `src/components/RegisterCTAModal.tsx`

**Editar:**
- `supabase/migrations/<new>.sql` (1 migración)
- `src/pages/admin/repairs/AdminRepairOrderNew.tsx` (campo documento + autocompletar)
- `src/pages/admin/repairs/AdminRepairCustomers.tsx` (mostrar documento + vínculo)
- `src/pages/Dashboard.tsx` (nueva pestaña Servicio Técnico + BackButton)
- `src/pages/Register.tsx` (campo documento opcional)
- `src/pages/TrackRepair.tsx` (modal CTA + auto-vincular)
- `src/pages/Services.tsx`, `Products.tsx`, `ProductDetail.tsx`, `Cart.tsx`, `Contact.tsx`, `About.tsx`, `Security.tsx` (BackButton)
- Páginas admin (BackButton en cabecera)

¿Lo confirmamos así? Si quieres que el documento sea obligatorio también en el registro (no solo opcional), avísame.