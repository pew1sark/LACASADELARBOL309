// Crea una preferencia de pago de Mercado Pago (Checkout Pro) para una reserva.
//
//   POST { code: "CA-XXXXXX", kind: "deposit" | "full" | "balance" }
//   → { url }   (link de pago de Mercado Pago)
//
// La llama la web pública sin sesión: el monto lo calcula SIEMPRE el servidor
// desde la reserva, nunca se acepta un monto enviado por el navegador.
import { adminClient, cors, json, mpToken, MP_API, SITE_URL } from '../_shared/mp.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'METODO_NO_PERMITIDO' }, 405)

  const token = mpToken()
  if (!token) return json({ error: 'PAGOS_NO_CONFIGURADOS' }, 503)

  let body: { code?: string; kind?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'SOLICITUD_INVALIDA' }, 400)
  }
  const code = String(body.code ?? '').trim().toUpperCase()
  const kind = body.kind === 'full' || body.kind === 'balance' ? body.kind : 'deposit'
  if (!/^[A-Z]{2}-[A-Z0-9]{4,10}$/.test(code)) return json({ error: 'CODIGO_INVALIDO' }, 400)

  const db = adminClient()
  const { data: cfg } = await db.from('settings').select('business_name, deposit_percent, mercadopago_enabled, online_payment_mode').eq('id', 1).single()
  if (!cfg?.mercadopago_enabled) return json({ error: 'PAGOS_DESACTIVADOS' }, 403)
  if (cfg.online_payment_mode === 'deposit' && kind === 'full') return json({ error: 'MODO_NO_PERMITIDO' }, 400)
  if (cfg.online_payment_mode === 'full' && kind === 'deposit') return json({ error: 'MODO_NO_PERMITIDO' }, 400)

  const { data: r } = await db
    .from('reservations')
    .select('id, code, status, event_date, total_amount, paid_amount, period, time_slots(name), customers(first_name, last_name, email, phone)')
    .eq('code', code)
    .maybeSingle()
  if (!r) return json({ error: 'RESERVA_NO_EXISTE' }, 404)
  if (!['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED'].includes(r.status)) return json({ error: 'RESERVA_NO_PAGABLE' }, 409)

  // La fecha podría haberse tomado mientras el cliente decidía.
  if (r.status !== 'CONFIRMED') {
    const { data: clash } = await db
      .from('reservations')
      .select('id')
      .in('status', ['AWAITING_PAYMENT', 'CONFIRMED'])
      .neq('id', r.id)
      .overlaps('period', r.period)
      .limit(1)
    if (clash?.length) return json({ error: 'HORARIO_NO_DISPONIBLE' }, 409)
  }

  const total = Number(r.total_amount)
  const paid = Number(r.paid_amount)
  const deposit = Math.round((total * Number(cfg.deposit_percent)) / 100)
  const amount = kind === 'deposit' ? deposit - paid : total - paid
  if (amount <= 0) return json({ error: 'NADA_POR_PAGAR' }, 409)

  const { data: intent, error: ie } = await db
    .from('payment_intents')
    .insert({ reservation_id: r.id, kind, amount })
    .select('id')
    .single()
  if (ie || !intent) return json({ error: 'NO_SE_PUDO_INICIAR' }, 500)

  const customer = r.customers as unknown as { first_name: string; last_name: string | null; email: string | null; phone: string }
  const slot = (r.time_slots as unknown as { name: string } | null)?.name
  const label = kind === 'deposit' ? 'Abono' : kind === 'balance' ? 'Saldo' : 'Pago total'
  const back = `${SITE_URL}/estado?codigo=${encodeURIComponent(code)}`

  const pref = {
    items: [{
      id: code,
      title: `${label} arriendo ${cfg.business_name} · ${r.event_date}${slot ? ` (${slot})` : ''}`,
      quantity: 1,
      currency_id: 'CLP',
      unit_price: amount,
    }],
    payer: {
      name: customer?.first_name,
      surname: customer?.last_name ?? undefined,
      email: customer?.email ?? undefined,
    },
    external_reference: `${code}|${intent.id}`,
    notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
    back_urls: { success: `${back}&pago=ok`, pending: `${back}&pago=pendiente`, failure: `${back}&pago=error` },
    auto_return: 'approved',
    statement_descriptor: 'CASA DEL ARBOL',
    metadata: { code, intent_id: intent.id, kind },
    expires: true,
    expiration_date_to: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
  }

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': intent.id },
    body: JSON.stringify(pref),
  })
  const mp = await res.json().catch(() => ({}))
  if (!res.ok || !mp.init_point) {
    await db.from('payment_intents').update({ status: 'cancelled', raw: mp }).eq('id', intent.id)
    return json({ error: 'MERCADOPAGO_ERROR', detail: mp?.message ?? null }, 502)
  }

  await db.from('payment_intents').update({ preference_id: mp.id }).eq('id', intent.id)
  return json({ url: mp.init_point, amount, kind })
})
