import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReservationDetail } from '../../components/admin/ReservationDetail'
import { Icon } from '../../components/ui/Icon'
import { Badge, Button, Card, Field, LoadingBlock, Modal, Select, TextArea } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { friendlyError } from '../../lib/errors'
import { longDate, money, monthName, toISO } from '../../lib/format'
import { RESERVATION_SELECT } from '../../lib/queries'
import { supabase } from '../../lib/supabase'
import { STATUS_LABEL, STATUS_TONE, type BlockedDate, type Reservation } from '../../lib/types'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const ACTIVE = ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED']

/** Suma un día a una fecha ISO cuando el bloque cruza la medianoche. */
const nextDay = (iso: string) =>
  new Date(new Date(`${iso}T12:00:00`).getTime() + 86400000).toISOString().slice(0, 10)

export default function Calendario() {
  const { slots, packages, eventTypes } = useSiteData()
  const { push } = useToast()
  const today = new Date()
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [blocks, setBlocks] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [detail, setDetail] = useState<Reservation | null>(null)
  const [newOpen, setNewOpen] = useState(false)

  const from = toISO(new Date(month.getFullYear(), month.getMonth(), 1))
  const to = toISO(new Date(month.getFullYear(), month.getMonth() + 1, 0))

  const load = useCallback(async () => {
    setLoading(true)
    const [res, blk] = await Promise.all([
      supabase.from('reservations').select(RESERVATION_SELECT).gte('event_date', from).lte('event_date', to),
      supabase.from('blocked_dates').select('*').gte('date', from).lte('date', to),
    ])
    setReservations((res.data as unknown as Reservation[]) ?? [])
    setBlocks((blk.data as BlockedDate[]) ?? [])
    setLoading(false)
  }, [from, to])

  useEffect(() => {
    void load()
  }, [load])

  const byDate = useMemo(() => {
    const map: Record<string, Reservation[]> = {}
    reservations.filter((r) => ACTIVE.includes(r.status)).forEach((r) => {
      ;(map[r.event_date] ??= []).push(r)
    })
    return map
  }, [reservations])

  const blocksByDate = useMemo(() => {
    const map: Record<string, BlockedDate[]> = {}
    blocks.forEach((b) => {
      ;(map[b.date] ??= []).push(b)
    })
    return map
  }, [blocks])

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const offset = (first.getDay() + 6) % 7
    const out: (string | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= total; d++) out.push(toISO(new Date(month.getFullYear(), month.getMonth(), d)))
    return out
  }, [month])

  const toggleBlock = async (date: string, slotId: string | null) => {
    const existing = (blocksByDate[date] ?? []).find((b) => b.time_slot_id === slotId)
    if (existing) {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', existing.id)
      if (error) return push(friendlyError(error), 'error')
      push('Bloqueo eliminado', 'success')
    } else {
      const { error } = await supabase.from('blocked_dates').insert({ date, time_slot_id: slotId })
      if (error) return push(friendlyError(error), 'error')
      push('Fecha bloqueada', 'success')
    }
    void load()
  }

  const dayReservations = selectedDate ? (byDate[selectedDate] ?? []) : []
  const dayBlocks = selectedDate ? (blocksByDate[selectedDate] ?? []) : []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl">Calendario</h1>
          <p className="mt-1 text-bark-500">Agenda del mes, bloqueos y reservas manuales.</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Icon name="plus" className="size-4" /> Nueva reserva
        </Button>
      </header>

      <Card className="p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="rounded-full p-2 transition hover:bg-cream-100"
            aria-label="Mes anterior"
          >
            <Icon name="chevronLeft" />
          </button>
          <p className="text-base font-semibold capitalize">
            {monthName(month.getMonth())} {month.getFullYear()}
          </p>
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="rounded-full p-2 transition hover:bg-cream-100"
            aria-label="Mes siguiente"
          >
            <Icon name="chevronRight" />
          </button>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="py-1 text-center text-[0.7rem] font-bold uppercase text-bark-500">{d}</div>
              ))}
              {cells.map((iso, i) => {
                if (!iso) return <div key={`e${i}`} />
                const items = byDate[iso] ?? []
                const blocked = (blocksByDate[iso] ?? []).some((b) => !b.time_slot_id)
                const isToday = iso === toISO(today)
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    className={`min-h-20 rounded-xl border p-1.5 text-left transition hover:border-leaf-600 ${
                      blocked ? 'border-transparent bg-cream-200' : 'border-bark-900/8 bg-white'
                    } ${isToday ? 'ring-2 ring-leaf-600/40' : ''}`}
                  >
                    <span className={`text-xs font-bold ${isToday ? 'text-leaf-700' : 'text-bark-500'}`}>
                      {Number(iso.slice(-2))}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {blocked && <Chip tone="gray">Bloqueado</Chip>}
                      {items.slice(0, 2).map((r) => (
                        <Chip key={r.id} tone={r.status === 'PENDING' ? 'amber' : r.status === 'AWAITING_PAYMENT' ? 'blue' : 'green'}>
                          {r.time_slots?.start_time.slice(0, 5)} {r.customers?.first_name}
                        </Chip>
                      ))}
                      {items.length > 2 && <span className="block text-[0.6rem] text-bark-500">+{items.length - 2} más</span>}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-bark-900/8 pt-4 text-xs text-bark-500">
              <Legend color="bg-sun-400" label="Solicitud" />
              <Legend color="bg-sky-500" label="Por pagar" />
              <Legend color="bg-leaf-500" label="Confirmada" />
              <Legend color="bg-bark-500" label="Bloqueado" />
            </div>
          </>
        )}
      </Card>

      {/* Detalle del día */}
      <Modal open={Boolean(selectedDate)} onClose={() => setSelectedDate(null)} title={selectedDate ? longDate(selectedDate) : ''}>
        <div className="space-y-4">
          {dayReservations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-bark-500">Reservas</h4>
              {dayReservations.map((r) => (
                <button key={r.id} onClick={() => { setDetail(r); setSelectedDate(null) }} className="w-full text-left">
                  <Card className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{r.customers?.first_name} {r.customers?.last_name}</p>
                      <p className="truncate text-sm text-bark-500">
                        {r.time_slots?.name} · {r.guests} personas · {money(r.total_amount)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </Card>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-bark-500">Disponibilidad</h4>
            <BlockRow
              label="Todo el día"
              blocked={dayBlocks.some((b) => !b.time_slot_id)}
              onToggle={() => selectedDate && void toggleBlock(selectedDate, null)}
            />
            {slots.map((s) => (
              <BlockRow
                key={s.id}
                label={`${s.name} · ${s.start_time.slice(0, 5)} — ${s.end_time.slice(0, 5)}`}
                blocked={dayBlocks.some((b) => b.time_slot_id === s.id)}
                busy={dayReservations.some((r) => r.time_slot_id === s.id)}
                onToggle={() => selectedDate && void toggleBlock(selectedDate, s.id)}
              />
            ))}
          </div>
        </div>
      </Modal>

      {newOpen && (
        <NewReservationModal
          slots={slots}
          packages={packages}
          eventTypes={eventTypes}
          onClose={() => setNewOpen(false)}
          onSaved={() => {
            setNewOpen(false)
            void load()
          }}
        />
      )}

      <ReservationDetail
        reservation={detail}
        onClose={() => setDetail(null)}
        onChanged={() => {
          setDetail(null)
          void load()
        }}
      />
    </div>
  )
}

function Chip({ tone, children }: { tone: 'amber' | 'blue' | 'green' | 'gray'; children: React.ReactNode }) {
  const tones = {
    amber: 'bg-sun-100 text-sun-600',
    blue: 'bg-sky-100 text-sky-800',
    green: 'bg-leaf-100 text-leaf-900',
    gray: 'bg-bark-900/10 text-bark-700',
  }
  return (
    <span className={`block truncate rounded px-1 py-0.5 text-[0.6rem] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} /> {label}
    </span>
  )
}

function BlockRow({ label, blocked, busy, onToggle }: { label: string; blocked: boolean; busy?: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-bark-900/8 bg-white p-3">
      <span className="text-sm font-medium">{label}</span>
      {busy ? (
        <Badge tone="green">Con reserva</Badge>
      ) : (
        <Button size="sm" variant={blocked ? 'outline' : 'ghost'} onClick={onToggle}>
          <Icon name={blocked ? 'check' : 'ban'} className="size-4" />
          {blocked ? 'Desbloquear' : 'Bloquear'}
        </Button>
      )}
    </div>
  )
}

function NewReservationModal({
  slots,
  packages,
  eventTypes,
  onClose,
  onSaved,
}: {
  slots: { id: string; name: string; start_time: string; end_time: string }[]
  packages: { id: string; name: string; price: number }[]
  eventTypes: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const { push } = useToast()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    date: toISO(new Date()),
    slotId: slots[0]?.id ?? '',
    packageId: packages[0]?.id ?? '',
    eventTypeId: eventTypes[0]?.id ?? '',
    guests: '20',
    status: 'CONFIRMED',
    notes: '',
  })
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    const slot = slots.find((s) => s.id === form.slotId)
    if (!slot) return push('Selecciona un horario', 'error')
    if (form.firstName.trim().length < 2) return push('Ingresa el nombre del cliente', 'error')
    const phone = form.phone.replace(/[^0-9+]/g, '')
    if (phone.length < 8) return push('Ingresa un teléfono válido', 'error')

    setBusy(true)
    const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone).maybeSingle()
    let customerId = existing?.id
    if (!customerId) {
      const { data: created, error } = await supabase
        .from('customers')
        .insert({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim() || null,
          phone,
          whatsapp: phone,
          email: form.email.trim() || null,
        })
        .select('id')
        .single()
      if (error) {
        setBusy(false)
        return push(friendlyError(error), 'error')
      }
      customerId = created.id
    }

    const { data: code } = await supabase.rpc('gen_reservation_code')
    const pkg = packages.find((p) => p.id === form.packageId)
    const endDate = slot.end_time <= slot.start_time ? nextDay(form.date) : form.date

    const { error } = await supabase.from('reservations').insert({
      code: code ?? `CA-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      customer_id: customerId,
      event_type_id: form.eventTypeId || null,
      package_id: form.packageId || null,
      time_slot_id: form.slotId,
      event_date: form.date,
      starts_at: `${form.date}T${slot.start_time}`,
      ends_at: `${endDate}T${slot.end_time}`,
      guests: Number(form.guests) || 1,
      status: form.status,
      package_price: pkg?.price ?? 0,
      total_amount: pkg?.price ?? 0,
      admin_notes: form.notes || null,
      source: 'admin',
    })
    setBusy(false)
    if (error) return push(friendlyError(error), 'error')
    push('Reserva creada', 'success')
    onSaved()
  }

  return (
    <Modal open onClose={onClose} title="Nueva reserva" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} />
        <Field label="Apellido" value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
        <Field label="Teléfono" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+56 9 …" />
        <Field label="Email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
        <Field label="Fecha" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
        <Select label="Horario" value={form.slotId} onChange={(e) => set({ slotId: e.target.value })}>
          {slots.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}</option>
          ))}
        </Select>
        <Select label="Tipo de evento" value={form.eventTypeId} onChange={(e) => set({ eventTypeId: e.target.value })}>
          {eventTypes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
        <Select label="Paquete" value={form.packageId} onChange={(e) => set({ packageId: e.target.value })}>
          <option value="">Sin paquete</option>
          {packages.map((p) => <option key={p.id} value={p.id}>{p.name} · {money(p.price)}</option>)}
        </Select>
        <Field label="Invitados" type="number" value={form.guests} onChange={(e) => set({ guests: e.target.value })} />
        <Select label="Estado" value={form.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="CONFIRMED">Confirmada (bloquea la fecha)</option>
          <option value="AWAITING_PAYMENT">Pendiente de pago (bloquea la fecha)</option>
          <option value="PENDING">Solicitud (no bloquea)</option>
        </Select>
        <div className="sm:col-span-2">
          <TextArea label="Notas internas" value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Button full disabled={busy} onClick={() => void save()}>
            {busy ? 'Creando…' : 'Crear reserva'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
