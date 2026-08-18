import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReservationDetail } from '../../components/admin/ReservationDetail'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Badge, Button, Card, LoadingBlock } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { friendlyError } from '../../lib/errors'
import { longDate, money, relativeTime, toISO } from '../../lib/format'
import { RESERVATION_SELECT } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { STATUS_LABEL, STATUS_TONE, type Reservation } from '../../lib/types'

export default function Dashboard() {
  const { push } = useToast()
  const { settings } = useSiteData()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [income, setIncome] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Reservation | null>(null)

  const load = useCallback(async () => {
    const today = toISO(new Date())
    const monthStart = toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

    const [res, pays] = await Promise.all([
      supabase
        .from('reservations')
        .select(RESERVATION_SELECT)
        .order('event_date', { ascending: true }),
      supabase.from('payments').select('amount, paid_at').gte('paid_at', monthStart),
    ])

    const rows = (res.data as unknown as Reservation[]) ?? []
    setReservations(rows)
    setIncome(((pays.data as { amount: number }[]) ?? []).reduce((s, p) => s + Number(p.amount), 0))
    setLoading(false)
    void today
  }, [])

  useEffect(() => {
    void load()
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => void load())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [load])

  if (loading) return <LoadingBlock label="Cargando panel…" />

  const today = toISO(new Date())
  const pending = reservations.filter((r) => r.status === 'PENDING')
  const awaiting = reservations.filter((r) => r.status === 'AWAITING_PAYMENT')
  const upcoming = reservations.filter((r) => r.status === 'CONFIRMED' && r.event_date >= today)
  const todayEvents = reservations.filter((r) => r.event_date === today && ['CONFIRMED', 'COMPLETED'].includes(r.status))
  const owed = awaiting.reduce((s, r) => s + Number(r.total_amount) - Number(r.paid_amount), 0)

  const quickAction = async (r: Reservation, status: 'AWAITING_PAYMENT' | 'REJECTED') => {
    const { error } = await supabase.from('reservations').update({ status }).eq('id', r.id)
    if (error) return push(friendlyError(error), 'error')
    push(`${r.code}: ${STATUS_LABEL[status]}`, 'success')
    void load()
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl">
          Hola{pending.length > 0 ? `, tienes ${pending.length} ${pending.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}` : ' 👋'}
        </h1>
        <p className="mt-1 text-bark-500">
          {todayEvents.length > 0
            ? `Hoy hay ${todayEvents.length} ${todayEvents.length === 1 ? 'evento' : 'eventos'} en la casa.`
            : 'Hoy no hay eventos programados.'}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="bell" label="Solicitudes pendientes" value={String(pending.length)} tone="amber" to="/admin/reservas?estado=PENDING" />
        <Stat icon="money" label="Por cobrar" value={money(owed)} tone="blue" to="/admin/reservas?estado=AWAITING_PAYMENT" />
        <Stat icon="calendar" label="Próximos eventos" value={String(upcoming.length)} tone="green" to="/admin/calendario" />
        <Stat icon="chart" label="Ingresos del mes" value={money(income)} tone="cream" />
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg">Solicitudes por revisar</h2>
          <div className="grid gap-3">
            {pending.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      <span className="font-mono text-xs text-bark-500">{r.code}</span>
                      <span className="text-xs text-bark-500">· {relativeTime(r.created_at)}</span>
                    </div>
                    <p className="mt-2 font-display text-lg leading-snug">
                      {r.event_types?.name ?? 'Evento'} · {r.guests} personas
                    </p>
                    <p className="text-sm text-bark-500">
                      {longDate(r.event_date)}
                      {r.time_slots && ` · ${r.time_slots.start_time.slice(0, 5)} — ${r.time_slots.end_time.slice(0, 5)}`}
                    </p>
                    <p className="mt-1 text-sm">
                      <strong>{r.customers?.first_name} {r.customers?.last_name}</strong>
                      <span className="text-bark-500"> · {r.customers?.phone}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <strong className="font-display text-xl text-leaf-700">{money(r.total_amount)}</strong>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                        Ver solicitud
                      </Button>
                      <Button size="sm" onClick={() => void quickAction(r, 'AWAITING_PAYMENT')}>
                        <Icon name="check" className="size-4" /> Confirmar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => void quickAction(r, 'REJECTED')}>
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg">Próximos eventos</h2>
          <Link to="/admin/reservas" className="text-sm font-semibold text-leaf-700">Ver todas</Link>
        </div>
        {upcoming.length === 0 ? (
          <Card className="p-6 text-center text-sm text-bark-500">Aún no hay eventos confirmados.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.slice(0, 6).map((r) => (
              <button key={r.id} onClick={() => setSelected(r)} className="text-left">
                <Card className="flex items-center gap-4 p-4 transition hover:shadow-lift">
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-leaf-100 text-leaf-900">
                    <span className="font-display text-xl font-semibold leading-none">{r.event_date.slice(8, 10)}</span>
                    <span className="text-[0.6rem] font-bold uppercase">{new Date(r.event_date + 'T00:00').toLocaleDateString('es-CL', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.event_types?.name ?? 'Evento'} · {r.guests} personas</p>
                    <p className="truncate text-sm text-bark-500">
                      {r.time_slots?.name} · {r.customers?.first_name} {r.customers?.last_name}
                    </p>
                  </div>
                  {Number(r.paid_amount) < Number(r.total_amount) && (
                    <Badge tone="amber">Saldo {money(Number(r.total_amount) - Number(r.paid_amount))}</Badge>
                  )}
                </Card>
              </button>
            ))}
          </div>
        )}
      </section>

      {settings && awaiting.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg">Esperando pago</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {awaiting.map((r) => (
              <button key={r.id} onClick={() => setSelected(r)} className="text-left">
                <Card className="flex items-center justify-between gap-4 p-4 transition hover:shadow-lift">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.customers?.first_name} {r.customers?.last_name}</p>
                    <p className="truncate text-sm text-bark-500">{longDate(r.event_date)}</p>
                  </div>
                  <strong className="shrink-0 text-leaf-700">{money(Number(r.total_amount) - Number(r.paid_amount))}</strong>
                </Card>
              </button>
            ))}
          </div>
        </section>
      )}

      <ReservationDetail
        reservation={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          setSelected(null)
          void load()
        }}
      />
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  tone,
  to,
}: {
  icon: IconName
  label: string
  value: string
  tone: 'amber' | 'blue' | 'green' | 'cream'
  to?: string
}) {
  const tones = {
    amber: 'bg-sun-100 text-sun-600',
    blue: 'bg-sky-100 text-sky-800',
    green: 'bg-leaf-100 text-leaf-700',
    cream: 'bg-cream-200 text-bark-700',
  }
  const inner = (
    <Card className="flex items-center gap-3.5 p-4 transition hover:shadow-lift">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon name={icon} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold uppercase tracking-wide text-bark-500">{label}</span>
        <strong className="block truncate font-display text-xl">{value}</strong>
      </span>
    </Card>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}
