# Rol Técnico + Módulo de Reportes

## 1. Base de datos (migración)

**Enum `app_role`**: agregar valor `'technician'`.

**`repair_orders`**: agregar columna `assigned_technician_id uuid` (referencia lógica a `auth.users`, sin FK), índice por `assigned_technician_id` y por `received_at`.

**Funciones SQL nuevas / actualizadas**:
- `has_role` ya cubre el nuevo valor.
- Helper `is_staff(uid)` = `has_role(uid,'admin') OR has_role(uid,'technician')`.
- `admin_update_user`: aceptar rol `technician`. Solo admin puede asignar/quitar el rol `admin`; técnicos no acceden a esta función.
- `get_repair_report(_from timestamptz, _to timestamptz)`: devuelve filas con nº orden, fechas, cliente, documento, técnico asignado, equipo, marca, modelo, estado, costo. SECURITY DEFINER; valida `is_staff(auth.uid())`.
- `get_repair_report_summary(_from, _to)`: totales, entregadas, pendientes, canceladas, ingresos, ticket promedio, top técnico por órdenes y por facturación, series diarias (órdenes/ingresos), órdenes por técnico, conteo por estado. Devuelve `jsonb`.

**RLS**:
- `repair_customers`, `repair_devices`, `repair_orders`, `repair_order_history`, `repair_order_photos`: políticas separadas
  - Admin: `ALL` (mantener).
  - Technician: `SELECT/INSERT/UPDATE` permitido; `DELETE` denegado.
- `user_roles`: técnicos no pueden modificar (políticas existentes ya limitan a admin).
- `profiles`: técnicos pueden ver perfiles (para cliente técnico) — opcional, agregar `SELECT` para technician.

## 2. Frontend

**`AuthContext`**: `userRole` ahora `"customer" | "admin" | "technician" | null`.

**`ProtectedRoute`**: aceptar `requiredRole?: "admin" | "technician" | Array<...>`. Helper para "staff" (admin o técnico).

**Rutas nuevas / ajustadas en `App.tsx`**:
- `/admin/repairs/*` → permitidas a `admin` y `technician`.
- `/admin/repairs/reports` → nueva, staff.
- Resto de `/admin/*` (productos, usuarios, categorías, etc.) → solo `admin`.

**Navbar / Layout admin**: si el rol es `technician`, mostrar acceso directo a Servicio Técnico y Reportes; ocultar enlaces de admin generales.

**`AdminUsers`**: agregar opción `Técnico` en selector de rol.

**`AdminRepairsDashboard`**: agregar tarjeta/enlace a "Reportes".

**Nueva página `src/pages/admin/repairs/AdminRepairReports.tsx`**:
- Filtros: Hoy, Ayer, Esta semana, Este mes, Últimos 30 días, Personalizado (date pickers).
- KPIs: total órdenes, entregadas, pendientes, canceladas, ingresos, ticket promedio, top técnico (órdenes y facturación), órdenes/ingresos del día/semana/mes.
- Gráficos con `recharts` (ya disponible vía shadcn chart): barras de órdenes por día, líneas de ingresos por día, barras por técnico, dona de estados.
- Tabla ordenable + búsqueda (cliente, nº orden, técnico). Paginación cliente.
- Exportar **Excel** (CSV con BOM, descarga directa) y **PDF** (usar `jspdf` + `jspdf-autotable`). Incluye logo, rango, fecha de generación, resumen y listado.
- Responsive (grid `sm:grid-cols-2 lg:grid-cols-4`).

**Asignación de técnico en órdenes**: en `AdminRepairOrderNew` / `AdminRepairOrderDetail`, agregar select de técnico (lista vía `get_all_users` filtrada por rol technician + admin). Guarda `assigned_technician_id`. Mantener campo libre `assigned_technician` para retrocompatibilidad (auto-rellenar con el nombre).

## 3. Dependencias nuevas
- `jspdf`, `jspdf-autotable` para exportación PDF.

## 4. Seguridad
- Todas las RPC nuevas validan `is_staff`.
- DELETEs en módulo de reparaciones bloqueados a technician vía RLS.
- Rutas no-reparación de admin permanecen exclusivas de admin.
- Cliente nunca puede acceder a `/admin/*`.

## Archivos a crear/editar
- `supabase/migrations/<ts>_technician_role_and_reports.sql`
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/App.tsx`
- `src/components/Navbar.tsx` (acceso técnico)
- `src/pages/admin/AdminUsers.tsx` (opción rol técnico)
- `src/pages/admin/repairs/AdminRepairsDashboard.tsx` (link a reportes)
- `src/pages/admin/repairs/AdminRepairOrderNew.tsx` / `AdminRepairOrderDetail.tsx` (selector técnico)
- `src/pages/admin/repairs/AdminRepairReports.tsx` (nuevo)
- `src/lib/repairs.ts` (helpers de fechas/labels si hace falta)
- `package.json` (+ jspdf, jspdf-autotable)
