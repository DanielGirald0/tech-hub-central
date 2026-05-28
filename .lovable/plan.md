## Módulo de Servicio Técnico

Sistema completo de gestión de reparaciones integrado con la app actual, sin afectar el ecommerce ni el módulo existente de "Solicitudes de servicio".

### 1. Base de datos (nueva migración)

Nuevas tablas en `public`:

- **`repair_customers`** — clientes del taller (independiente de `auth.users`, para walk-ins)
  - `name`, `phone`, `email`, `address`, `notes`
- **`repair_devices`** — equipos
  - `customer_id` → repair_customers, `device_type`, `brand`, `model`, `serial_imei`, `device_password`, `accessories`, `physical_condition`
- **`repair_orders`** — órdenes de reparación
  - `order_number` (auto: `OS-2026-0001` vía secuencia), `customer_id`, `device_id`
  - `received_at`, `reported_issue`, `diagnosis`, `solution`
  - `assigned_technician`, `status` (enum), `cost`, `estimated_date`, `warranty_days`, `delivered_at`
- **`repair_order_photos`** — fotos antes/después
  - `order_id`, `url`, `label` ("antes" | "despues" | "otro")
- **`repair_order_history`** — auditoría de cambios de estado
  - `order_id`, `from_status`, `to_status`, `note`, `changed_by`, `created_at`

Enum `repair_status`: `recibido`, `en_diagnostico`, `esperando_repuesto`, `en_reparacion`, `reparado`, `listo_entrega`, `entregado`, `cancelado`.

Storage bucket público `repair-photos` para imágenes.

**RLS:**
- Admins: acceso total a las 5 tablas.
- Público (anon): solo `SELECT` mínimo sobre `repair_orders` filtrado por número de orden + teléfono (vía función `public.lookup_repair_order(order_number, phone)` SECURITY DEFINER que devuelve estado y datos básicos — evita exponer toda la tabla).
- GRANTs explícitos a authenticated/service_role; anon solo EXECUTE en la función de lookup.

Trigger para autogenerar `order_number` y registrar cambios de estado en `repair_order_history`.

### 2. Frontend público

- **`/seguimiento`** — página pública de consulta. Form con número de orden + teléfono → llama RPC `lookup_repair_order` → muestra timeline de estados, equipo, costo, fecha estimada.
- Sección en `/services` con CTA "Consultar estado de mi reparación" → `/seguimiento`.

### 3. Panel administrativo (`/admin/repairs/*`)

Rutas protegidas con `ProtectedRoute requiredRole="admin"`, lazy-loaded en `App.tsx`:

- **`/admin/repairs`** — dashboard con stats (órdenes por estado, ingresos del mes, órdenes activas) + tabla de últimas órdenes.
- **`/admin/repairs/orders`** — listado con buscador (número, cliente, teléfono, IMEI), filtros por estado, paginación.
- **`/admin/repairs/orders/new`** — crear orden (selecciona o crea cliente + equipo en el mismo flujo).
- **`/admin/repairs/orders/:id`** — detalle: datos, cambio de estado, diagnóstico/solución, costo, garantía, técnico, subida de fotos (antes/después), notas, historial, botón "Notificar por WhatsApp", botón "Generar PDF".
- **`/admin/repairs/customers`** — CRUD de clientes con historial de órdenes.
- **`/admin/repairs/devices`** — listado de equipos por cliente.

Enlace en `AdminDashboard` hacia el nuevo módulo + card de "Órdenes activas".

### 4. Funciones extra

- **WhatsApp:** al cambiar estado, botón que abre `wa.me/57<telefono>` con mensaje plantilla en es-CO (no automático en server para evitar costos de API).
- **PDF de la orden:** generado en cliente con `jspdf` + `jspdf-autotable` (logo, datos cliente/equipo, diagnóstico, costo, garantía, firma).
- **Fotos antes/después:** subida a bucket `repair-photos`, preview en galería.
- **Historial del cliente:** en `/admin/repairs/customers/:id` lista todas sus órdenes pasadas.

### 5. Arquitectura

- Hooks reutilizables: `useRepairOrders`, `useRepairCustomers`, `useRepairDevices` (React Query con `staleTime` apropiado).
- Componentes: `RepairStatusBadge`, `RepairTimeline`, `RepairOrderForm`, `CustomerPicker`, `DevicePicker`, `PhotoUploader`, `OrderPDFButton`.
- Validación con `zod` en todos los formularios.
- Skeletons y error boundaries por ruta.
- Estilo consistente con la estética dark/gaming actual (Iosevka, #D90429, uppercase en títulos).

### 6. Integración sin romper nada

- Las tablas son nuevas (`repair_*`); no se toca `service_requests`, `orders`, `products`, etc.
- `App.tsx`: solo se añaden rutas lazy nuevas.
- `AdminDashboard`: solo se añade una card y un enlace.
- `Services.tsx`: solo se añade CTA hacia `/seguimiento`.

### Detalles técnicos

- Migración única con CREATE TABLE + GRANTs + RLS + POLICIES + trigger de número de orden + función `lookup_repair_order`.
- Bucket `repair-photos` público con políticas RLS (admins INSERT/DELETE, público SELECT).
- Dependencias nuevas: `jspdf`, `jspdf-autotable`.
- Sin edge functions adicionales (WhatsApp se abre client-side).

### Confirmación necesaria

1. ¿Confirmas crear el bucket público `repair-photos` para las fotos de equipos?
2. ¿El número de orden debe seguir el formato `OS-2026-0001` o prefieres otro?
3. Para consulta pública, ¿basta con número de orden + teléfono, o quieres también opción solo por número?
