// Recibe las notificaciones de Mercado Pago.
//
// Nunca confía en el contenido de la notificación: con el id recibido consulta
// el pago directamente a la API de Mercado Pago (con nuestro token) y recién
// ahí registra el pago y confirma la reserva. Si está configurado
// MP_WEBHOOK_SECRET, además valida la firma x-signature.
import { adminClient, json, mpToken, MP_API } from '../_shared/mp.ts'

async function validSignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET')
  if (!secret) return true
  const header = req.headers.get('x-signature') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=') as [string, string]))
  if (!parts.ts || !parts.v1) return false
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex === parts.v1
}

const STATUS: Record<string, string> = {
  approved: 'approved',
  authorized: 'pending',
  in_process: 'pending',
  in_mediation: 'pending',
  pending: 'pending',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'cancelled',
  charged_back: 'cancelled',
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    /* las notificaciones IPN antiguas vienen solo por query */
  }
  const type = String(body.type ?? body.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic') ?? '')
  const dataId = String((body.data as { id?: string } | undefined)?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '')

  // Mercado Pago espera 200/201 rápido; lo que no es un pago se ignora.
  if (type !== 'payment' || !dataId) return json({ ignored: true })
  if (!(await validSignature(req, dataId))) return json({ error: 'FIRMA_INVALIDA' }, 401)

  const token = mpToken()
  if (!token) return json({ error: 'PAGOS_NO_CONFIGURADOS' }, 503)

  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(dataId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return json({ error: 'PAGO_NO_ENCONTRADO' }, 200)
  const p = await res.json()

  const [code, intentId] = String(p.external_reference ?? '').split('|')
  if (!code || !intentId) return json({ ignored: 'sin referencia' })

  const db = adminClient()
  const { data: intent } = await db
    .from('payment_intents')
    .select('id, reservation_id, kind, amount, status')
    .eq('id', intentId)
    .maybeSingle()
  if (!intent) return json({ ignored: 'intento desconocido' })

  const status = STATUS[p.status] ?? 'pending'
  await db
    .from('payment_intents')
    .update({
      status: intent.status === 'refund_needed' ? 'refund_needed' : status,
      provider_payment_id: String(p.id),
      status_detail: p.status_detail ?? null,
      payer_email: p.payer?.email ?? null,
      raw: { id: p.id, status: p.status, status_detail: p.status_detail, amount: p.transaction_amount, method: p.payment_method_id, date_approved: p.date_approved },
    })
    .eq('id', intent.id)

  if (p.status !== 'approved') return json({ ok: true, status })

  // Registrar el pago una sola vez (índice único por proveedor + id).
  const { error: payErr } = await db.from('payments').insert({
    reservation_id: intent.reservation_id,
    amount: Math.round(Number(p.transaction_amount)),
    method: 'mercadopago',
    provider: 'mercadopago',
    provider_payment_id: String(p.id),
    reference: `MP ${p.id}`,
    notes: `${intent.kind === 'deposit' ? 'Abono' : intent.kind === 'balance' ? 'Saldo' : 'Pago total'} en línea (${p.payment_method_id ?? 'Mercado Pago'})`,
    paid_at: p.date_approved ?? new Date().toISOString(),
  })
  if (payErr && !String(payErr.message).includes('duplicate')) return json({ error: payErr.message }, 500)
  if (payErr) return json({ ok: true, duplicate: true })

  // Con el abono pagado, la reserva queda confirmada y la fecha bloqueada.
  const { data: r } = await db
    .from('reservations')
    .select('id, code, status, total_amount, paid_amount')
    .eq('id', intent.reservation_id)
    .single()
  const { data: cfg } = await db.from('settings').select('deposit_percent').eq('id', 1).single()
  const deposit = Math.round((Number(r?.total_amount ?? 0) * Number(cfg?.deposit_percent ?? 30)) / 100)

  if (r && ['PENDING', 'AWAITING_PAYMENT'].includes(r.status) && Number(r.paid_amount) >= deposit) {
    const { error: upErr } = await db.from('reservations').update({ status: 'CONFIRMED' }).eq('id', r.id)
    if (upErr) {
      // Otra reserva tomó el horario: el pago entró pero hay que devolverlo o reagendar.
      await db.from('payment_intents').update({ status: 'refund_needed' }).eq('id', intent.id)
      await db.from('notifications').insert({
        type: 'payment_conflict',
        title: `Pago recibido para ${r.code} pero el horario ya está ocupado`,
        body: `Mercado Pago ${p.id} · ${p.transaction_amount}. Contactar al cliente para reagendar o devolver.`,
        reservation_id: r.id,
      })
      return json({ ok: true, conflict: true })
    }
  }

  await db.from('notifications').insert({
    type: 'payment_received',
    title: `Pago en línea recibido · ${code}`,
    body: `$${Math.round(Number(p.transaction_amount)).toLocaleString('es-CL')} vía Mercado Pago`,
    reservation_id: intent.reservation_id,
  })
  return json({ ok: true })
})
