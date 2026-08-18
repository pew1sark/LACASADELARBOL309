import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ReservationDetail } from '../../components/admin/ReservationDetail'
import { Icon } from '../../components/ui/Icon'
import { Badge, Card, Field, LoadingBlock } from '../../components/ui/Primitives'
import { longDate, money, shortDate } from '../../lib/format'
import { RESERVATION_SELECT } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { STATUS_LABEL, STATUS_TONE, type Reservation, type ReservationStatus } from '../../lib/types'

const FILTERS: { key: ReservationStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'PENDING', label: 'Solicitudes' },
  { key: 'AWAITING_PAYMENT', label: 'Por pagar' },
  { key: 'CONFIRMED', label: 'Confirmadas' },
  { key: 'COMPLETED', label: 'Completadas' },
  { key: 'CANCELLED', label: 'Canceladas' },
]

export default function Reservas() {
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Reservation | null>(null)

  const filter = (params.get('estado') as ReservationStatus | 'ALL') ?? 'ALL'

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reservations')
      .select(RESERVATION_SELECT)
      .order('event_date', { ascending: false })
    setRows((data as unknown as Reservation[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== 'ALL' && r.status !== filter) return false
      if (filter === 'CANCELLED' && r.status === 'REJECTED') return true
      if (!q) return true
      const hay = [
        r.code,
        r.customers?.first_name,
        r.customers?.last_name,
        r.customers?.phone,
        r.customers?.email,
        r.event_types?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, filter, query])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length }
    rows.forEach((r) => {
      c[r.status] = (c[r.status] ?? 0) + 1
    })
    return c
  }, [rows])

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl">Reservas</h1>
          <p className="mt-1 text-bark-500">{visible.length} de {rows.length} reservas</p>
        </div>
        <div className="w-full sm:w-72">
          <Field
            placeholder="Buscar código, nombre o teléfono…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar reservas"
          />
        </div>
      </header>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setParams(f.key === 'ALL' ? {} : { estado: f.key }, { replace: true })}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === f.key ? 'bg-leaf-700 text-white' : 'bg-white text-bark-700 hover:bg-cream-200'
            }`}
          >
            {f.label}
            {counts[f.key] ? <span className="ml-1.5 opacity-60">{counts[f.key]}</span> : null}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock />
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center">
          <Icon name="list" className="mx-auto size-8 text-bark-500/40" />
          <p className="mt-3 font-semibold">No hay reservas en esta vista</p>
          <p className="mt-1 text-sm text-bark-500">Prueba con otro filtro o limpia la búsqueda.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((r) => (
            <button key={r.id} onClick={() => setSelected(r)} className="text-left">
              <Card className="p-4 transition hover:shadow-lift">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      <span className="font-mono text-xs text-bark-500">{r.code}</span>
                    </div>
                    <p className="mt-1.5 font-semibold">
                      {r.customers?.first_name} {r.customers?.last_name}
                      <span className="font-normal text-bark-500"> · {r.customers?.phone}</span>
                    </p>
                    <p className="text-sm text-bark-500">
                      {longDate(r.event_date)}
                      {r.time_slots && ` · ${r.time_slots.name}`} · {r.guests} personas
                      {r.packages && ` · ${r.packages.name}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <strong className="font-display text-lg text-leaf-700">{money(r.total_amount)}</strong>
                    {Number(r.paid_amount) > 0 && (
                      <p className="text-xs text-bark-500">Pagado {money(r.paid_amount)}</p>
                    )}
                    <p className="mt-1 text-[0.68rem] text-bark-500/70">
                      Solicitada {shortDate(r.created_at.slice(0, 10))}
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
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
