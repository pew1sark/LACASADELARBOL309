import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteData } from '../../hooks/useSiteData'
import { longDate, money, monthName, toISO } from '../../lib/format'
import { STATUS_LABEL } from '../../lib/types'
import { ACTIVE, originOf, useAnima } from './data'
import { Bars, Kpi, Page, Panel, Pill, Share } from './ui'

const RANGES = [
  { id: '30', label: '30 días', days: 30 },
  { id: '90', label: '90 días', days: 90 },
  { id: '365', label: '12 meses', days: 365 },
  { id: 'all', label: 'Todo', days: 0 },
] as const

export default function Resumen() {
  const { reservations, intents, notifications } = useAnima()
  const { slots } = useSiteData()
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('90')

  const m = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)!.days
    const from = days ? Date.now() - days * 86400000 : 0
    const inRange = reservations.filter((r) => new Date(r.created_at).getTime() >= from)
    const won = inRange.filter((r) => ACTIVE.includes(r.status))
    const payments = reservations.flatMap((r) => (r.payments ?? []).map((p) => ({ ...p, code: r.code })))
    const paidInRange = payments.filter((p) => new Date(p.paid_at).getTime() >= from)
    const collected = paidInRange.reduce((s, p) => s + Number(p.amount), 0)
    const online = paidInRange.filter((p) => p.method === 'mercadopago').reduce((s, p) => s + Number(p.amount), 0)
    const today = toISO(new Date())
    const receivable = reservations
      .filter((r) => ['AWAITING_PAYMENT', 'CONFIRMED'].includes(r.status) && r.event_date >= today)
      .reduce((s, r) => s + Math.max(Number(r.total_amount) - Number(r.paid_amount), 0), 0)
    const booked = won.reduce((s, r) => s + Number(r.total_amount), 0)

    // Ocupación: bloques confirmados vs. bloques ofrecidos en los próximos 30 días.
    let offered = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      offered += slots.filter((s) => s.active !== false && s.weekdays.includes(d.getDay())).length
    }
    const in30 = toISO(new Date(Date.now() + 30 * 86400000))
    const taken = reservations.filter((r) => ['AWAITING_PAYMENT', 'CONFIRMED'].includes(r.status) && r.event_date >= today && r.event_date <= in30).length

    // Solicitudes por mes (últimos 6 meses)
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - (5 - i))
      return { y: d.getFullYear(), m: d.getMonth() }
    })
    const perMonth = months.map(({ y, m: mo }) => {
      const list = reservations.filter((r) => {
        const c = new Date(r.created_at)
        return c.getFullYear() === y && c.getMonth() === mo
      })
      return { label: monthName(mo).slice(0, 3), value: list.length, won: list.filter((r) => ACTIVE.includes(r.status)).length }
    })

    const count = (list: string[]) =>
      Object.entries(list.reduce<Record<string, number>>((a, k) => ((a[k] = (a[k] ?? 0) + 1), a), {}))
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)

    const upcoming = reservations
      .filter((r) => ['AWAITING_PAYMENT', 'CONFIRMED', 'PENDING'].includes(r.status) && r.event_date >= today)
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 6)

    return {
      total: inRange.length,
      won: won.length,
      pending: inRange.filter((r) => r.status === 'PENDING').length,
      conversion: inRange.length ? Math.round((won.length / inRange.length) * 100) : 0,
      collected,
      online,
      receivable,
      booked,
      ticket: won.length ? Math.round(booked / won.length) : 0,
      occupancy: offered ? Math.round((taken / offered) * 100) : 0,
      taken,
      perMonth,
      origins: count(inRange.map(originOf)),
      events: count(inRange.map((r) => r.event_types?.name ?? 'Sin especificar')),
      upcoming,
    }
  }, [reservations, slots, range])

  const alerts = [
    ...intents.filter((i) => i.status === 'refund_needed').map((i) => `Pago ${i.reservations?.code ?? ''} recibido con horario ocupado: devolver o reagendar.`),
    ...notifications.filter((n) => !n.read_at && n.type === 'new_request').slice(0, 3).map((n) => n.title),
  ]

  return (
    <Page
      title="Resumen del negocio"
      subtitle="La Casa del Árbol · Los Castaños — datos en vivo desde Supabase"
      actions={
        <div className="inline-flex overflow-hidden rounded-xl border border-anima-line bg-white">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)} className={`px-3 py-2 text-xs font-semibold ${range === r.id ? 'bg-anima-ink text-white' : 'text-anima-muted hover:text-anima-ink'}`}>
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <p key={a} className="rounded-xl border border-anima-gold/40 bg-[#f6ecd8] px-4 py-2.5 text-sm text-anima-gold-deep">{a}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Solicitudes" value={String(m.total)} hint={`${m.pending} pendientes de respuesta`} />
        <Kpi label="Reservas ganadas" value={String(m.won)} hint={`Conversión ${m.conversion}%`} tone="ok" />
        <Kpi label="Cobrado" value={money(m.collected)} hint={`${money(m.online)} en línea (Mercado Pago)`} tone="gold" />
        <Kpi label="Por cobrar" value={money(m.receivable)} hint="Saldos de eventos futuros" tone={m.receivable ? 'danger' : 'ink'} />
        <Kpi label="Vendido" value={money(m.booked)} hint="Valor de reservas ganadas" />
        <Kpi label="Ticket promedio" value={money(m.ticket)} />
        <Kpi label="Ocupación 30 días" value={`${m.occupancy}%`} hint={`${m.taken} bloques tomados`} />
        <Kpi label="Pagos en línea" value={String(intents.filter((i) => i.status === 'approved').length)} hint={`${intents.filter((i) => i.status === 'rejected').length} rechazados`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Solicitudes por mes">
          <Bars data={m.perMonth.map((d) => ({ label: d.label, value: d.value, display: `${d.value} · ${d.won}✓` }))} />
          <p className="mt-3 text-xs text-anima-muted">Total de solicitudes · ✓ = reservas ganadas</p>
        </Panel>
        <Panel title="Origen de los clientes">
          <Share data={m.origins} />
          <p className="mt-4 text-xs text-anima-muted">Se toma de los parámetros utm / fbclid de los anuncios.</p>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Próximos eventos" right={<Link to="/anima/reservas" className="text-xs font-semibold text-anima-gold-deep">Ver todas →</Link>}>
          <ul className="divide-y divide-anima-line">
            {m.upcoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold first-letter:uppercase">{longDate(r.event_date)}</p>
                  <p className="truncate text-xs text-anima-muted">{r.code} · {r.customers?.first_name} {r.customers?.last_name ?? ''} · {r.time_slots?.name}</p>
                </div>
                <Pill tone={r.status === 'CONFIRMED' ? 'ok' : r.status === 'PENDING' ? 'gold' : 'muted'}>{STATUS_LABEL[r.status]}</Pill>
              </li>
            ))}
            {!m.upcoming.length && <li className="py-3 text-sm text-anima-muted">No hay eventos próximos.</li>}
          </ul>
        </Panel>
        <Panel title="Qué celebran">
          <Share data={m.events} />
        </Panel>
      </div>
    </Page>
  )
}
