import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// =============================================================================
// notify-status-change
// Estructura base para notificar a un cliente cuando cambia el estado de su
// orden de reparación. Soporta dos canales (configurables):
//   1. WhatsApp  -> genera deep link wa.me y lo devuelve (envío manual o
//                   automático vía API oficial cuando esté disponible).
//   2. Email     -> envía vía send-transactional-email si está habilitado.
//
// Invocación esperada (desde el panel admin al cambiar status):
//   supabase.functions.invoke('notify-status-change', {
//     body: { order_id: '<uuid>', channels: ['whatsapp','email'] }
//   })
// =============================================================================

const STATUS_LABELS: Record<string, string> = {
  recibido: 'Recibido en taller',
  diagnosticando: 'En diagnóstico',
  pendiente_aprobacion: 'Pendiente de aprobación',
  aprobado: 'Aprobado, en reparación',
  reparando: 'En reparación',
  listo: 'Listo para entrega',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

function buildMessage(orderNumber: string, status: string, customerName: string) {
  const label = STATUS_LABELS[status] ?? status
  return (
    `Hola ${customerName.split(' ')[0] || ''} 👋\n\n` +
    `Tu orden de servicio *#${orderNumber}* cambió a estado: *${label}*.\n\n` +
    `Puedes consultar el detalle en cualquier momento desde tu cuenta de Tecno Gz.\n` +
    `Si tienes preguntas, responde este mensaje. ¡Gracias por confiar en nosotros!`
  )
}

function buildWhatsAppUrl(phone: string, message: string) {
  // Normaliza a formato internacional Colombia (+57) sin signos.
  const digits = phone.replace(/\D/g, '')
  const full = digits.startsWith('57') ? digits : `57${digits}`
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // --- Auth (solo staff) ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token)
    if (claimsErr || !claims?.claims) return json({ error: 'Unauthorized' }, 401)

    const { data: isStaff } = await supabase.rpc('is_staff', { _uid: claims.claims.sub })
    if (!isStaff) return json({ error: 'Forbidden' }, 403)

    // --- Input ---
    const body = await req.json().catch(() => ({}))
    const orderId: string | undefined = body?.order_id
    const channels: string[] = Array.isArray(body?.channels) && body.channels.length
      ? body.channels
      : ['whatsapp']
    if (!orderId || typeof orderId !== 'string') {
      return json({ error: 'order_id requerido' }, 400)
    }

    // --- Service-role client para leer todo ---
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: order, error: orderErr } = await admin
      .from('repair_orders')
      .select('id, order_number, status, repair_customers(name, phone, email)')
      .eq('id', orderId)
      .single()
    if (orderErr || !order) return json({ error: 'Orden no encontrada' }, 404)

    const customer = (order as any).repair_customers
    const message = buildMessage(order.order_number, order.status, customer?.name ?? 'cliente')

    const result: Record<string, unknown> = { order_number: order.order_number, status: order.status }

    // --- Canal WhatsApp ---
    if (channels.includes('whatsapp')) {
      if (!customer?.phone) {
        result.whatsapp = { sent: false, reason: 'sin_telefono' }
      } else {
        result.whatsapp = { sent: true, url: buildWhatsAppUrl(customer.phone, message) }
      }
    }

    // --- Canal Email (placeholder: requiere setup_email_infra + plantilla) ---
    if (channels.includes('email')) {
      if (!customer?.email) {
        result.email = { sent: false, reason: 'sin_email' }
      } else {
        try {
          const { error: emailErr } = await admin.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'repair-status-change',
              recipientEmail: customer.email,
              idempotencyKey: `repair-status-${order.id}-${order.status}`,
              templateData: {
                name: customer.name,
                orderNumber: order.order_number,
                statusLabel: STATUS_LABELS[order.status] ?? order.status,
              },
            },
          })
          result.email = emailErr
            ? { sent: false, reason: 'send_failed', detail: String(emailErr?.message ?? emailErr) }
            : { sent: true }
        } catch (e) {
          result.email = { sent: false, reason: 'not_configured', detail: String((e as Error).message) }
        }
      }
    }

    return json(result, 200)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
