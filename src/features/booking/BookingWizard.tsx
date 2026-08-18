import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar } from '../../components/Calendar'
import { Icon } from '../../components/ui/Icon'
import { Badge, Button, Card, Field, LoadingBlock, TextArea } from '../../components/ui/Primitives'
import type { DayAvailability } from '../../hooks/useAvailability'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { track } from '../../lib/analytics'
import { asset } from '../../lib/asset'
import { friendlyError } from '../../lib/errors'
import { longDate, money } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import type { Addon, SlotStatus } from '../../lib/types'
import { BookingSuccess, type SubmittedReservation } from './BookingSuccess'

const STEPS = [
  'Evento',
  'Paquete',
  'Fecha',
  'Horario',
  'Invitados',
  'Extras',
  'Tus datos',
  'Resumen',
] as const

interface Draft {
  eventTypeId: string | null
  packageId: string | null
  date: string | null
  slotId: string | null
  guests: number
  addons: Record<string, number>
  firstName: string
  lastName: string
  phone: string
  email: string
  notes: string
}

const EMPTY: Draft = {
  eventTypeId: null,
  packageId: null,
  date: null,
  slotId: null,
  guests: 20,
  addons: {},
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  notes: '',
}

const DRAFT_KEY = 'lca309-draft'

export function BookingWizard() {
  const { settings, eventTypes, packages, addons, loading } = useSiteData()
  const { push } = useToast()
  const [params] = useSearchParams()

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      return saved ? { ...EMPTY, ...JSON.parse(saved) } : EMPTY
    } catch {
      return EMPTY
    }
  })
  const [day, setDay] = useState<DayAvailability | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<SubmittedReservation | null>(null)

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [draft])

  useEffect(() => {
    track('reservation_started')
  }, [])

  // Prefill desde la landing (?evento=slug / ?paquete=slug)
  useEffect(() => {
    if (loading) return
    const et = params.get('evento')
    const pk = params.get('paquete')
    let jump = 0
    const patch: Partial<Draft> = {}
    if (et) {
      const found = eventTypes.find((x) => x.slug === et)
      if (found) {
        patch.eventTypeId = found.id
        jump = 1
      }
    }
    if (pk) {
      const found = packages.find((x) => x.slug === pk)
      if (found) {
        patch.packageId = found.id
        patch.eventTypeId = found.event_type_id ?? patch.eventTypeId ?? null
        jump = 2
      }
    }
    if (Object.keys(patch).length) {
      set(patch)
      setStep((s) => Math.max(s, jump))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const pkg = packages.find((p) => p.id === draft.packageId) ?? null
  const eventType = eventTypes.find((e) => e.id === draft.eventTypeId) ?? null
  const slot = day?.slots.find((s) => s.id === draft.slotId) ?? null

  const visiblePackages = useMemo(
    () =>
      draft.eventTypeId
        ? packages.filter((p) => !p.event_type_id || p.event_type_id === draft.eventTypeId)
        : packages,
    [packages, draft.eventTypeId],
  )

  const selectedAddons = useMemo(
    () =>
      addons
        .filter((a) => draft.addons[a.id])
        .map((a) => ({
          addon: a,
          quantity: a.per_guest ? draft.guests : draft.addons[a.id],
        })),
    [addons, draft.addons, draft.guests],
  )

  const addonsTotal = selectedAddons.reduce((sum, s) => sum + s.addon.price * s.quantity, 0)
  const total = (pkg?.price ?? 0) + addonsTotal

  const maxGuests = pkg?.max_guests ?? settings?.max_capacity ?? 60

  const canContinue = (() => {
    switch (step) {
      case 0: return Boolean(draft.eventTypeId)
      case 1: return Boolean(draft.packageId)
      case 2: return Boolean(draft.date)
      case 3: return Boolean(draft.slotId)
      case 4: return draft.guests > 0 && draft.guests <= maxGuests
      case 5: return true
      case 6: return draft.firstName.trim().length >= 2 && draft.phone.replace(/\D/g, '').length >= 8
      default: return true
    }
  })()

  const next = () => {
    if (!canContinue) return
    const target = Math.min(step + 1, STEPS.length - 1)
    track('reservation_step', { step: target, name: STEPS[target] })
    setStep(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const back = () => {
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    const payload = {
      event_type_id: draft.eventTypeId,
      package_id: draft.packageId,
      time_slot_id: draft.slotId,
      event_date: draft.date,
      guests: draft.guests,
      first_name: draft.firstName.trim(),
      last_name: draft.lastName.trim(),
      phone: draft.phone.trim(),
      whatsapp: draft.phone.trim(),
      email: draft.email.trim(),
      notes: draft.notes.trim(),
      addons: selectedAddons.map((s) => ({ addon_id: s.addon.id, quantity: s.quantity })),
    }
    const { data, error } = await supabase.rpc('create_reservation_request', { payload })
    setSubmitting(false)

    if (error) {
      push(friendlyError(error), 'error')
      if (error.message.includes('HORARIO_NO_DISPONIBLE')) setStep(2)
      return
    }

    track('reservation_submitted', { total, guests: draft.guests, package: pkg?.slug })
    sessionStorage.removeItem(DRAFT_KEY)
    setDone({
      ...(data as SubmittedReservation),
      addonNames: selectedAddons.map((s) => s.addon.name),
      customerName: `${draft.firstName} ${draft.lastName}`.trim(),
      eventTypeName: eventType?.name ?? null,
    })
    window.scrollTo({ top: 0 })
  }

  if (loading) return <LoadingBlock label="Cargando disponibilidad…" />
  if (done) return <BookingSuccess reservation={done} />

  return (
    <div className="container-x py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <Progress step={step} />

        <div className="mt-8 fade-up" key={step}>
          {step === 0 && (
            <StepShell title="¿Qué quieres celebrar?" subtitle="Elige el tipo de evento para mostrarte los paquetes correctos.">
              <div className="grid gap-3 sm:grid-cols-3">
                {eventTypes.map((et) => (
                  <OptionCard
                    key={et.id}
                    selected={draft.eventTypeId === et.id}
                    onClick={() => {
                      set({ eventTypeId: et.id, packageId: null })
                      setStep(1)
                    }}
                    image={asset(et.image_url)}
                    title={et.name}
                    text={et.short_description ?? ''}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="Elige tu paquete" subtitle="Todos incluyen el uso exclusivo del espacio. Podrás sumar extras más adelante.">
              <div className="grid gap-3 sm:grid-cols-2">
                {visiblePackages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      set({ packageId: p.id, guests: Math.min(draft.guests, p.max_guests) })
                      setStep(2)
                    }}
                    className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition ${
                      draft.packageId === p.id ? 'border-leaf-700 shadow-lift' : 'border-bark-900/8 hover:border-leaf-300'
                    }`}
                  >
                    <img src={asset(p.image_url)} alt="" className="aspect-[16/9] w-full object-cover" />
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg leading-snug">{p.name}</h3>
                        {p.badge && <Badge tone="amber">{p.badge}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-bark-500">{p.subtitle}</p>
                      <p className="mt-3 font-display text-2xl font-semibold text-leaf-700">
                        {p.price_is_from && <span className="mr-1 text-xs uppercase text-bark-500">desde</span>}
                        {money(p.price)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="cream"><Icon name="clock" className="size-3.5" /> {p.duration_hours} h</Badge>
                        <Badge tone="cream"><Icon name="users" className="size-3.5" /> hasta {p.max_guests}</Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Selecciona la fecha" subtitle="Te mostramos solo los días con disponibilidad real.">
              <Calendar
                value={draft.date}
                onSelect={(iso, d) => {
                  set({ date: iso, slotId: null })
                  setDay(d)
                  track('date_selected', { date: iso })
                  setStep(3)
                }}
                onMonthChange={() => track('calendar_open')}
              />
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              title="Elige el horario"
              subtitle={draft.date ? longDate(draft.date) : undefined}
            >
              <div className="grid gap-3">
                {(day?.slots ?? []).map((s) => {
                  const free = s.status === 'available'
                  const pending = s.status === 'pending'
                  const disabled = !free && !pending
                  return (
                    <button
                      key={s.id}
                      disabled={disabled}
                      onClick={() => {
                        set({ slotId: s.id })
                        setStep(4)
                      }}
                      className={`flex items-center justify-between gap-4 rounded-2xl border-2 bg-white p-4 text-left transition ${
                        draft.slotId === s.id
                          ? 'border-leaf-700 shadow-lift'
                          : disabled
                            ? 'cursor-not-allowed border-bark-900/8 opacity-50'
                            : 'border-bark-900/8 hover:border-leaf-300'
                      }`}
                    >
                      <span>
                        <span className="block font-semibold">{s.name}</span>
                        <span className="text-sm text-bark-500">{s.start} — {s.end}</span>
                      </span>
                      <SlotBadge status={s.status} />
                    </button>
                  )
                })}
                {!day?.slots.length && (
                  <p className="rounded-xl bg-cream-100 p-4 text-sm text-bark-500">
                    Vuelve al paso anterior y selecciona una fecha.
                  </p>
                )}
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="¿Cuántas personas serán?" subtitle={`Capacidad máxima de este paquete: ${maxGuests} personas.`}>
              <Card className="p-6">
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="outline"
                    onClick={() => set({ guests: Math.max(1, draft.guests - 5) })}
                    aria-label="Menos invitados"
                    className="size-12 !p-0"
                  >
                    −
                  </Button>
                  <div className="text-center">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={draft.guests}
                      min={1}
                      max={maxGuests}
                      onChange={(e) => set({ guests: Math.max(1, Math.min(maxGuests, Number(e.target.value) || 0)) })}
                      className="w-28 border-0 bg-transparent text-center font-display text-5xl font-semibold text-leaf-700 focus:outline-none"
                    />
                    <span className="block text-sm text-bark-500">invitados</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => set({ guests: Math.min(maxGuests, draft.guests + 5) })}
                    aria-label="Más invitados"
                    className="size-12 !p-0"
                  >
                    +
                  </Button>
                </div>
                {draft.guests > maxGuests && (
                  <p className="mt-4 text-center text-sm font-medium text-terra-500">
                    Supera la capacidad del paquete. Escríbenos por WhatsApp y lo revisamos.
                  </p>
                )}
              </Card>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title="¿Quieres agregar algo más?" subtitle="Opcional. Puedes agregar o quitar extras al confirmar con nosotros.">
              <div className="grid gap-3 sm:grid-cols-2">
                {addons.map((a) => (
                  <AddonCard
                    key={a.id}
                    addon={a}
                    guests={draft.guests}
                    quantity={draft.addons[a.id] ?? 0}
                    onChange={(q) => {
                      const nextAddons = { ...draft.addons }
                      if (q <= 0) delete nextAddons[a.id]
                      else nextAddons[a.id] = q
                      set({ addons: nextAddons })
                    }}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {step === 6 && (
            <StepShell title="Tus datos" subtitle="Solo lo necesario para confirmar contigo. No compartimos tu información.">
              <Card className="grid gap-4 p-5 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  value={draft.firstName}
                  onChange={(e) => set({ firstName: e.target.value })}
                  placeholder="María"
                  autoComplete="given-name"
                  required
                />
                <Field
                  label="Apellido"
                  value={draft.lastName}
                  onChange={(e) => set({ lastName: e.target.value })}
                  placeholder="González"
                  autoComplete="family-name"
                />
                <Field
                  label="Teléfono / WhatsApp"
                  hint="Por aquí te confirmamos"
                  value={draft.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
                <Field
                  label="Email"
                  hint="opcional"
                  value={draft.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="maria@correo.cl"
                  type="email"
                  autoComplete="email"
                />
                <div className="sm:col-span-2">
                  <TextArea
                    label="¿Algo que debamos saber?"
                    hint="opcional"
                    value={draft.notes}
                    onChange={(e) => set({ notes: e.target.value })}
                    placeholder="Cumple 5 años, temática dinosaurios, llevamos torta propia…"
                  />
                </div>
              </Card>
            </StepShell>
          )}

          {step === 7 && (
            <StepShell title="Revisa tu solicitud" subtitle="Confirma que todo esté correcto antes de enviarla.">
              <Card className="overflow-hidden">
                <dl className="divide-y divide-bark-900/8">
                  <Row label="Evento" value={eventType?.name ?? '—'} />
                  <Row label="Paquete" value={pkg?.name ?? '—'} />
                  <Row label="Fecha" value={draft.date ? longDate(draft.date) : '—'} />
                  <Row label="Horario" value={slot ? `${slot.name} · ${slot.start} — ${slot.end}` : '—'} />
                  <Row label="Invitados" value={`${draft.guests} personas`} />
                  <Row label="A nombre de" value={`${draft.firstName} ${draft.lastName}`.trim()} />
                  <Row label="Contacto" value={draft.phone} />
                  {selectedAddons.length > 0 && (
                    <div className="px-5 py-4">
                      <dt className="mb-2 text-sm text-bark-500">Servicios adicionales</dt>
                      <dd className="space-y-1.5">
                        {selectedAddons.map((s) => (
                          <div key={s.addon.id} className="flex justify-between gap-4 text-sm">
                            <span>
                              {s.addon.name}
                              {s.quantity > 1 && <span className="text-bark-500"> × {s.quantity}</span>}
                            </span>
                            <span className="font-medium">{money(s.addon.price * s.quantity)}</span>
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="border-t border-bark-900/8 bg-cream-100 px-5 py-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-semibold uppercase tracking-wide text-bark-500">Total estimado</span>
                    <span className="font-display text-3xl font-semibold text-leaf-700">{money(total)}</span>
                  </div>
                  {settings && (
                    <p className="mt-2 text-sm text-bark-500">
                      Para confirmar se solicita un abono del {settings.deposit_percent}% ({money((total * settings.deposit_percent) / 100)}).
                      <strong className="block text-bark-900">No pagas nada ahora.</strong>
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Badge tone="amber"><Icon name="clock" className="size-3.5" /> Pendiente de confirmación</Badge>
                  </div>
                </div>
              </Card>

              <Button full size="lg" className="mt-5" onClick={submit} disabled={submitting}>
                {submitting ? 'Enviando…' : 'Solicitar reserva'}
                {!submitting && <Icon name="arrowRight" className="size-4.5" />}
              </Button>
              <p className="mt-3 text-center text-xs text-bark-500">
                Al enviar, un administrador revisará la disponibilidad y te contactará por WhatsApp.
              </p>
            </StepShell>
          )}
        </div>

        {step < 7 && (
          <div className="sticky bottom-0 z-20 mt-8 flex items-center gap-3 border-t border-bark-900/8 bg-cream-50/95 py-4 backdrop-blur">
            {step > 0 && (
              <Button variant="ghost" onClick={back}>
                <Icon name="chevronLeft" className="size-4" /> Atrás
              </Button>
            )}
            <div className="flex-1" />
            {total > 0 && step >= 1 && (
              <span className="hidden text-sm text-bark-500 sm:block">
                Total estimado <strong className="text-bark-900">{money(total)}</strong>
              </span>
            )}
            <Button onClick={next} disabled={!canContinue}>
              Continuar <Icon name="arrowRight" className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------- subcomponentes ------------------------------ */

function Progress({ step }: { step: number }) {
  const pct = ((step + 1) / STEPS.length) * 100
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-sm font-semibold text-leaf-700">
          Paso {step + 1} de {STEPS.length} · {STEPS[step]}
        </p>
        <p className="text-xs text-bark-500">{Math.round(pct)}%</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bark-900/8">
        <div
          className="h-full rounded-full bg-leaf-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl leading-snug md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-bark-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  )
}

function OptionCard({ selected, onClick, image, title, text }: {
  selected: boolean
  onClick: () => void
  image: string
  title: string
  text: string
}) {
  return (
    <button
      onClick={onClick}
      className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition ${
        selected ? 'border-leaf-700 shadow-lift' : 'border-bark-900/8 hover:border-leaf-300'
      }`}
    >
      <img src={image} alt="" className="aspect-[4/3] w-full object-cover" />
      <div className="p-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-snug text-bark-500">{text}</p>
      </div>
    </button>
  )
}

function SlotBadge({ status }: { status: SlotStatus }) {
  if (status === 'available') return <Badge tone="green"><Icon name="check" className="size-3.5" /> Disponible</Badge>
  if (status === 'pending') return <Badge tone="amber">Con solicitud</Badge>
  if (status === 'reserved') return <Badge tone="red">Reservado</Badge>
  if (status === 'blocked') return <Badge tone="gray">No disponible</Badge>
  return <Badge tone="gray">Cerrado</Badge>
}

function AddonCard({ addon, guests, quantity, onChange }: {
  addon: Addon
  guests: number
  quantity: number
  onChange: (q: number) => void
}) {
  const active = quantity > 0
  const effective = addon.per_guest ? guests : quantity
  return (
    <div
      className={`rounded-2xl border-2 bg-white p-4 transition ${active ? 'border-leaf-700' : 'border-bark-900/8'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold leading-snug">{addon.name}</h3>
          {addon.description && <p className="mt-1 text-sm leading-snug text-bark-500">{addon.description}</p>}
        </div>
        <button
          onClick={() => onChange(active ? 0 : 1)}
          aria-label={active ? `Quitar ${addon.name}` : `Agregar ${addon.name}`}
          className={`grid size-8 shrink-0 place-items-center rounded-full transition ${
            active ? 'bg-leaf-700 text-white' : 'bg-cream-100 text-bark-700 hover:bg-cream-200'
          }`}
        >
          <Icon name={active ? 'check' : 'plus'} className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-leaf-700">
          {money(addon.price)}
          <span className="font-normal text-bark-500"> / {addon.unit}</span>
        </span>
        {active && !addon.per_guest && addon.unit === 'unidad' && (
          <div className="flex items-center gap-2">
            <button onClick={() => onChange(quantity - 1)} className="size-7 rounded-full bg-cream-100 text-bark-700">−</button>
            <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
            <button onClick={() => onChange(quantity + 1)} className="size-7 rounded-full bg-cream-100 text-bark-700">+</button>
          </div>
        )}
        {active && addon.per_guest && (
          <span className="text-xs text-bark-500">× {effective} personas</span>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
      <dt className="text-sm text-bark-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}
