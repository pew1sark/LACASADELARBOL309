import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar } from '../../components/Calendar'
import { Icon, WhatsAppIcon } from '../../components/ui/Icon'
import { Badge, Button, Field, LoadingBlock, Spinner, TextArea } from '../../components/ui/Primitives'
import type { DayAvailability } from '../../hooks/useAvailability'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { track } from '../../lib/analytics'
import { getAttribution, sourceLabel } from '../../lib/attribution'
import { asset } from '../../lib/asset'
import { friendlyError, isBusinessError } from '../../lib/errors'
import { longDate, money } from '../../lib/format'
import { quotePackage } from '../../lib/pricing'
import { PREFILL_EVENT, type PrefillDetail } from '../../lib/quote'
import { supabase } from '../../lib/supabase'
import type { Addon, SlotStatus } from '../../lib/types'
import { BookingSuccess, type SubmittedReservation } from './BookingSuccess'

const STEPS = ['Evento', 'Fecha', 'Extras', 'Confirmar'] as const

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

function localCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return `LC-${s}`
}

export function BookingWizard({ embedded = false }: { embedded?: boolean }) {
  const { settings, eventTypes, packages, addons, slots, loading, offline } = useSiteData()
  const { push } = useToast()
  const [params] = useSearchParams()
  const rootRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      return saved ? { ...EMPTY, ...JSON.parse(saved), date: null, slotId: null } : EMPTY
    } catch {
      return EMPTY
    }
  })
  const [day, setDay] = useState<DayAvailability | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<SubmittedReservation | null>(null)
  const started = useRef(false)

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      /* sin almacenamiento */
    }
  }, [draft])

  const markStarted = () => {
    if (started.current) return
    started.current = true
    track('reservation_started')
  }

  useEffect(() => {
    if (!embedded) markStarted()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scrollTop = () => {
    const el = rootRef.current
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 80
    if (Math.abs(window.scrollY - y) > 40) window.scrollTo({ top: y, behavior: 'smooth' })
  }

  const applyPrefill = (detail: PrefillDetail) => {
    const patch: Partial<Draft> = {}
    let jump = 0
    if (detail.eventSlug) {
      const found = eventTypes.find((x) => x.slug === detail.eventSlug)
      if (found) {
        patch.eventTypeId = found.id
        patch.packageId = null
      }
    }
    if (detail.packageSlug) {
      const found = packages.find((x) => x.slug === detail.packageSlug)
      if (found) {
        patch.packageId = found.id
        patch.eventTypeId = found.event_type_id ?? patch.eventTypeId ?? null
        jump = 1
      }
    }
    if (detail.guests) patch.guests = detail.guests
    if (Object.keys(patch).length) {
      markStarted()
      set(patch)
      setStep(jump)
    }
  }

  // Precarga desde la URL (?evento=slug / ?paquete=slug) — sirve para enlazar
  // anuncios distintos a paquetes distintos.
  useEffect(() => {
    if (loading) return
    applyPrefill({
      eventSlug: params.get('evento') ?? undefined,
      packageSlug: params.get('paquete') ?? undefined,
      guests: Number(params.get('invitados')) || undefined,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // Precarga desde el cotizador del hero y los botones de paquetes.
  useEffect(() => {
    const onPrefill = (e: Event) => {
      applyPrefill((e as CustomEvent<PrefillDetail>).detail ?? {})
      setTimeout(scrollTop, 30)
    }
    window.addEventListener(PREFILL_EVENT, onPrefill)
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTypes, packages])

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
  const slotDef = slots.find((s) => s.id === draft.slotId) ?? null
  const pq = quotePackage(pkg, {
    date: draft.date,
    guests: draft.guests,
    slot: slotDef,
    weekendDays: settings?.weekend_days,
  })
  const total = pq.total + addonsTotal
  const priceLines = [
    pq.extraGuests > 0 ? { label: `${pq.extraGuests} invitados adicionales × ${money(pq.extraGuestPrice)}`, value: pq.extraGuestsTotal } : null,
    pq.slotSurcharge > 0 && slotDef ? { label: `Recargo horario ${slotDef.name}`, value: pq.slotSurcharge } : null,
  ].filter(Boolean) as { label: string; value: number }[]
  const depositPct = settings?.deposit_percent ?? 30
  const deposit = Math.round((total * depositPct) / 100)
  const maxGuests = pkg?.max_guests ?? settings?.max_capacity ?? 60

  const phoneOk = draft.phone.replace(/\D/g, '').length >= 8
  const nameOk = draft.firstName.trim().length >= 2

  const canContinue = (() => {
    switch (step) {
      case 0: return Boolean(draft.packageId)
      case 1: return Boolean(draft.date && draft.slotId)
      case 2: return draft.guests > 0 && draft.guests <= maxGuests
      default: return nameOk && phoneOk
    }
  })()

  const goTo = (target: number) => {
    markStarted()
    const t = Math.max(0, Math.min(target, STEPS.length - 1))
    track('reservation_step', { step: t + 1, name: STEPS[t] })
    setStep(t)
    setTimeout(scrollTop, 30)
  }

  const submit = async () => {
    if (submitting || !canContinue || !pkg || !draft.date) return
    setSubmitting(true)
    const attribution = getAttribution()
    const source = sourceLabel(attribution)
    const notes = [draft.notes.trim(), source ? `Origen: ${source}` : ''].filter(Boolean).join('\n')

    const base: SubmittedReservation = {
      code: localCode(),
      event_date: draft.date,
      slot_name: slot?.name ?? null,
      start_time: slot?.start ?? null,
      end_time: slot?.end ?? null,
      guests: draft.guests,
      package_name: pkg.name,
      package_price: pq.base,
      price_lines: priceLines,
      weekend: pq.weekend,
      total_amount: total,
      deposit,
      addons: selectedAddons.map((s) => ({ name: s.addon.name, quantity: s.quantity, subtotal: s.addon.price * s.quantity })),
      customerName: `${draft.firstName} ${draft.lastName}`.trim(),
      phone: draft.phone.trim(),
      notes: draft.notes.trim(),
      source,
      eventTypeName: eventType?.name ?? null,
      registered: false,
    }

    if (!offline) {
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
        notes,
        addons: selectedAddons.map((s) => ({ addon_id: s.addon.id, quantity: s.quantity })),
      }
      const res = await Promise.race([
        supabase.rpc('create_reservation_request', { payload }).then((r) => r, (e) => ({ data: null, error: e })),
        new Promise<null>((r) => setTimeout(() => r(null), 8000)),
      ])
      if (res && !res.error && res.data) {
        const data = res.data as { code: string; total_amount?: number }
        base.code = data.code
        base.total_amount = Number(data.total_amount ?? total)
        base.deposit = Math.round((base.total_amount * depositPct) / 100)
        base.registered = true
      } else if (res?.error && isBusinessError(res.error)) {
        setSubmitting(false)
        push(friendlyError(res.error), 'error')
        if (String(res.error.message).includes('HORARIO_NO_DISPONIBLE')) goTo(1)
        return
      }
      // Si la base no respondió, la solicitud igual llega completa por WhatsApp.
    }

    setSubmitting(false)
    track('reservation_submitted', {
      value: total,
      currency: 'CLP',
      guests: draft.guests,
      package: pkg.slug,
      content_name: pkg.name,
    })
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      /* nada */
    }
    setDone(base)
    setTimeout(scrollTop, 30)
  }

  if (loading) return <LoadingBlock label="Cargando disponibilidad…" />
  if (done)
    return (
      <div ref={rootRef}>
        <BookingSuccess reservation={done} embedded={embedded} />
      </div>
    )

  return (
    <div ref={rootRef} className={embedded ? '' : 'container-x py-8 md:py-12'}>
      <div className={`mx-auto grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-8 ${embedded ? '' : 'max-w-5xl'}`}>
        <div className="min-w-0 rounded-3xl border border-bark-900/8 bg-white p-4 shadow-soft sm:p-6 md:p-8">
          <Progress step={step} onJump={(i) => i < step && goTo(i)} />

          <div className="mt-7 fade-up" key={step}>
            {step === 0 && (
              <StepShell title="¿Qué quieres celebrar?" subtitle="Elige el tipo de evento y tu paquete. Verás el precio al instante.">
                <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {eventTypes.map((et) => {
                    const active = draft.eventTypeId === et.id
                    return (
                      <button
                        key={et.id}
                        onClick={() => {
                          markStarted()
                          set({ eventTypeId: active ? null : et.id, packageId: null })
                        }}
                        className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? 'border-leaf-700 bg-leaf-700 text-white'
                            : 'border-bark-900/12 bg-cream-50 text-bark-700 hover:border-leaf-600'
                        }`}
                      >
                        {et.name}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {visiblePackages.map((p) => {
                    const active = draft.packageId === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          set({
                            packageId: p.id,
                            eventTypeId: p.event_type_id ?? draft.eventTypeId,
                            guests: Math.min(draft.guests, p.max_guests),
                          })
                          track('view_package', { package: p.slug, content_name: p.name, value: p.price, currency: 'CLP' })
                          goTo(1)
                        }}
                        className={`group flex gap-3 overflow-hidden rounded-2xl border-2 bg-white p-2.5 text-left transition ${
                          active ? 'border-leaf-700 shadow-lift' : 'border-bark-900/8 hover:border-leaf-300'
                        }`}
                      >
                        <img src={asset(p.image_url)} alt="" className="size-24 shrink-0 rounded-xl object-cover sm:size-28" />
                        <div className="min-w-0 flex-1 py-0.5 pr-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base leading-snug">{p.name}</h3>
                            {active && <Icon name="check" className="size-5 shrink-0 text-leaf-700" />}
                          </div>
                          {p.badge && <Badge tone="amber" className="mt-1">{p.badge}</Badge>}
                          <p className="mt-1.5 font-display text-xl font-semibold text-leaf-700">
                            {p.price_is_from && <span className="mr-1 font-sans text-[0.65rem] uppercase text-bark-500">desde</span>}
                            {money(p.price)}
                          </p>
                          <p className="mt-1 text-xs text-bark-500">
                            {p.duration_hours} h · hasta {p.max_guests} personas
                            {p.included_guests != null && Number(p.extra_guest_price) > 0 && (
                              <> · incluye {p.included_guests}, +{money(p.extra_guest_price)} c/u adicional</>
                            )}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </StepShell>
            )}

            {step === 1 && (
              <StepShell title="¿Cuándo es tu evento?" subtitle="Elige el día y el horario. Te mostramos solo lo que está libre.">
                <Calendar
                  value={draft.date}
                  onSelect={(iso, d) => {
                    set({ date: iso, slotId: null })
                    setDay(d)
                    track('date_selected', { date: iso })
                  }}
                  onMonthChange={() => track('calendar_open')}
                />

                {draft.date && day && (
                  <div className="mt-5 fade-up">
                    <p className="mb-3 text-sm font-semibold text-bark-700 first-letter:uppercase">{longDate(draft.date)}</p>
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      {day.slots.map((s) => {
                        const selectable = s.status === 'available' || s.status === 'pending'
                        const active = draft.slotId === s.id
                        return (
                          <button
                            key={s.id}
                            disabled={!selectable}
                            onClick={() => {
                              set({ slotId: s.id })
                              goTo(2)
                            }}
                            className={`rounded-2xl border-2 p-3.5 text-left transition ${
                              active
                                ? 'border-leaf-700 bg-leaf-50'
                                : selectable
                                  ? 'border-bark-900/8 bg-white hover:border-leaf-300'
                                  : 'cursor-not-allowed border-bark-900/5 bg-cream-50 opacity-50'
                            }`}
                          >
                            <span className="block font-semibold">{s.name}</span>
                            <span className="block text-sm text-bark-500">{s.start} — {s.end}</span>
                            {Number(slots.find((x) => x.id === s.id)?.surcharge ?? 0) > 0 && (
                              <span className="mt-1 block text-xs font-semibold text-sun-600">
                                +{money(slots.find((x) => x.id === s.id)?.surcharge)}
                              </span>
                            )}
                            <span className="mt-2 block"><SlotBadge status={s.status} /></span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title="Invitados y extras" subtitle="Ajusta la cantidad de personas y suma lo que quieras. Todo es opcional.">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-100 p-4">
                  <div>
                    <p className="font-semibold">Invitados</p>
                    <p className="text-xs text-bark-500">
                      Máximo {maxGuests} en este paquete
                      {pkg?.included_guests != null && Number(pkg.extra_guest_price) > 0 && (
                        <> · {pkg.included_guests} incluidos, luego {money(pkg.extra_guest_price)} c/u</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StepBtn label="Menos invitados" onClick={() => set({ guests: Math.max(1, draft.guests - 5) })}>−</StepBtn>
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label="Cantidad de invitados"
                      value={draft.guests}
                      min={1}
                      max={maxGuests}
                      onChange={(e) => set({ guests: Math.max(1, Math.min(maxGuests, Number(e.target.value) || 0)) })}
                      className="w-14 border-0 bg-transparent text-center font-display text-3xl font-semibold text-leaf-700 focus:outline-none"
                    />
                    <StepBtn label="Más invitados" onClick={() => set({ guests: Math.min(maxGuests, draft.guests + 5) })}>+</StepBtn>
                  </div>
                </div>

                {groupByCategory(addons).map(([category, list]) => (
                <div key={category} className="mt-5">
                  {category && <p className="mb-2 text-xs font-bold uppercase tracking-wider text-bark-500">{category}</p>}
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {list.map((a) => (
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
                </div>
                ))}
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title="¿A nombre de quién?" subtitle="Te enviamos la cotización por WhatsApp para confirmar tu fecha.">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    hint="opcional"
                    value={draft.lastName}
                    onChange={(e) => set({ lastName: e.target.value })}
                    placeholder="González"
                    autoComplete="family-name"
                  />
                  <Field
                    label="WhatsApp"
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
                      rows={2}
                      value={draft.notes}
                      onChange={(e) => set({ notes: e.target.value })}
                      placeholder="Cumple 5 años, temática dinosaurios, llevamos torta propia…"
                    />
                  </div>
                </div>

                <div className="mt-5 lg:hidden">
                  <QuoteSummary
                    eventName={eventType?.name}
                    pkgName={pkg?.name}
                    pkgPrice={pkg ? pq.base : undefined}
                    weekend={pq.weekend}
                    lines={priceLines}
                    date={draft.date}
                    slot={slot ? `${slot.name} · ${slot.start}–${slot.end}` : null}
                    guests={draft.guests}
                    addons={selectedAddons.map((s) => ({ name: s.addon.name, subtotal: s.addon.price * s.quantity }))}
                    total={total}
                    deposit={deposit}
                    depositPct={depositPct}
                  />
                </div>

                <Button full size="lg" variant="whatsapp" className="mt-6" onClick={submit} disabled={submitting || !canContinue}>
                  {submitting ? <Spinner className="size-5" /> : <WhatsAppIcon />}
                  {submitting ? 'Preparando tu cotización…' : 'Agendar y recibir por WhatsApp'}
                </Button>
                <p className="mt-3 text-center text-xs text-bark-500">
                  No pagas nada ahora. Confirmamos disponibilidad por WhatsApp y recién ahí se solicita el abono.
                </p>
              </StepShell>
            )}
          </div>

          {step < 3 && (
            <div className="mt-7 flex items-center gap-3 border-t border-bark-900/8 pt-5">
              {step > 0 && (
                <Button variant="ghost" onClick={() => goTo(step - 1)}>
                  <Icon name="chevronLeft" className="size-4" /> Atrás
                </Button>
              )}
              <div className="flex-1" />
              {total > 0 && (
                <span className="text-sm text-bark-500 lg:hidden">
                  <strong className="text-bark-900">{money(total)}</strong>
                </span>
              )}
              <Button onClick={() => canContinue && goTo(step + 1)} disabled={!canContinue}>
                Continuar <Icon name="arrowRight" className="size-4" />
              </Button>
            </div>
          )}
          {step === 3 && (
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={() => goTo(2)}>
                <Icon name="chevronLeft" className="size-4" /> Atrás
              </Button>
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <QuoteSummary
              eventName={eventType?.name}
              pkgName={pkg?.name}
              pkgPrice={pkg ? pq.base : undefined}
              weekend={pq.weekend}
              lines={priceLines}
              date={draft.date}
              slot={slot ? `${slot.name} · ${slot.start}–${slot.end}` : null}
              guests={draft.guests}
              addons={selectedAddons.map((s) => ({ name: s.addon.name, subtotal: s.addon.price * s.quantity }))}
              total={total}
              deposit={deposit}
              depositPct={depositPct}
            />
            <ul className="mt-4 space-y-2 px-1 text-xs text-bark-500">
              <li className="flex gap-2"><Icon name="shield" className="size-4 shrink-0 text-leaf-600" /> Sin pago para solicitar</li>
              <li className="flex gap-2"><Icon name="clock" className="size-4 shrink-0 text-leaf-600" /> Respuesta el mismo día</li>
              <li className="flex gap-2"><Icon name="lock" className="size-4 shrink-0 text-leaf-600" /> Tus datos no se comparten</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ------------------------------- subcomponentes ------------------------------ */

function Progress({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((name, i) => {
        const done = i < step
        const active = i === step
        return (
          <li key={name}>
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={!done}
              className="w-full text-left disabled:cursor-default"
            >
              <span
                className={`block h-1.5 rounded-full transition-colors duration-500 ${
                  done || active ? 'bg-leaf-600' : 'bg-bark-900/8'
                }`}
              />
              <span
                className={`mt-2 block truncate text-[0.7rem] font-semibold uppercase tracking-wider sm:text-xs ${
                  active ? 'text-leaf-700' : done ? 'text-bark-700' : 'text-bark-500/70'
                }`}
              >
                {i + 1}. {name}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl leading-snug md:text-[1.75rem]">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-bark-500 md:text-base">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  )
}

function StepBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 place-items-center rounded-full border border-bark-900/12 bg-white text-xl font-semibold text-bark-700 transition hover:border-leaf-600 active:scale-95"
    >
      {children}
    </button>
  )
}

function SlotBadge({ status }: { status: SlotStatus }) {
  if (status === 'available') return <Badge tone="green"><Icon name="check" className="size-3.5" /> Disponible</Badge>
  if (status === 'pending') return <Badge tone="amber">Consultado</Badge>
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
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 transition ${
        active ? 'border-leaf-700 bg-leaf-50/60' : 'border-bark-900/8 bg-white'
      }`}
    >
      <button
        type="button"
        onClick={() => onChange(active ? 0 : 1)}
        aria-label={active ? `Quitar ${addon.name}` : `Agregar ${addon.name}`}
        aria-pressed={active}
        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full transition ${
          active ? 'bg-leaf-700 text-white' : 'bg-cream-200 text-bark-700 hover:bg-cream-300'
        }`}
      >
        <Icon name={active ? 'check' : 'plus'} className="size-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{addon.name}</p>
        {addon.description && <p className="mt-0.5 text-xs leading-snug text-bark-500">{addon.description}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-leaf-700">
            {money(addon.price)}
            <span className="font-normal text-bark-500"> / {addon.unit}</span>
          </span>
          {active && !addon.per_guest && (addon.unit === 'unidad' || addon.unit === 'hora') && (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => onChange(quantity - 1)} className="size-6 rounded-full bg-cream-200 text-sm text-bark-700" aria-label="Menos">−</button>
              <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
              <button type="button" disabled={addon.max_quantity != null && quantity >= addon.max_quantity} onClick={() => onChange(quantity + 1)} className="size-6 disabled:opacity-40 rounded-full bg-cream-200 text-sm text-bark-700" aria-label="Más">+</button>
            </div>
          )}
          {active && addon.per_guest && <span className="text-xs text-bark-500">× {guests}</span>}
        </div>
      </div>
    </div>
  )
}

function QuoteSummary(props: {
  eventName?: string
  pkgName?: string
  pkgPrice?: number
  weekend?: boolean
  lines?: { label: string; value: number }[]
  date: string | null
  slot: string | null
  guests: number
  addons: { name: string; subtotal: number }[]
  total: number
  deposit: number
  depositPct: number
}) {
  const empty = !props.pkgName
  return (
    <div className="overflow-hidden rounded-3xl border border-bark-900/8 bg-white shadow-soft">
      <div className="flex items-center gap-2 border-b border-bark-900/8 bg-leaf-900 px-5 py-3.5 text-cream-50">
        <Icon name="clipboard" className="size-4 text-sun-400" />
        <p className="text-sm font-semibold">Tu cotización</p>
      </div>
      {empty ? (
        <p className="px-5 py-6 text-sm text-bark-500">Elige un paquete y aquí verás el detalle y el total al instante.</p>
      ) : (
        <>
          <dl className="space-y-2.5 px-5 py-4 text-sm">
            {props.eventName && <SumRow label="Evento" value={props.eventName} />}
            <SumRow label={props.pkgName!} value={money(props.pkgPrice)} strong />
            {props.weekend && <p className="-mt-1.5 text-xs text-sun-600">Tarifa de fin de semana</p>}
            {props.lines?.map((l) => <SumRow key={l.label} label={`+ ${l.label}`} value={money(l.value)} />)}
            <SumRow label="Fecha" value={props.date ? longDate(props.date) : 'Por elegir'} muted={!props.date} />
            <SumRow label="Horario" value={props.slot ?? 'Por elegir'} muted={!props.slot} />
            <SumRow label="Invitados" value={`${props.guests}`} />
            {props.addons.map((a) => (
              <SumRow key={a.name} label={`+ ${a.name}`} value={money(a.subtotal)} />
            ))}
          </dl>
          <div className="border-t border-dashed border-bark-900/12 bg-cream-50 px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-bark-500">Total estimado</span>
              <span className="font-display text-2xl font-semibold text-leaf-700">{money(props.total)}</span>
            </div>
            <p className="mt-1 text-xs text-bark-500">
              Abono para reservar ({props.depositPct}%): <strong className="text-bark-900">{money(props.deposit)}</strong>
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function SumRow({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={`min-w-0 ${strong ? 'font-semibold text-bark-900' : 'text-bark-500'}`}>{label}</dt>
      <dd className={`shrink-0 text-right first-letter:uppercase ${muted ? 'text-bark-500/60' : 'font-medium'} max-w-[60%]`}>{value}</dd>
    </div>
  )
}

function groupByCategory(list: Addon[]): [string, Addon[]][] {
  const map = new Map<string, Addon[]>()
  for (const a of list) {
    const key = a.category && a.category !== 'Otros' ? a.category : 'Otros'
    map.set(key, [...(map.get(key) ?? []), a])
  }
  // Si todo cae en una sola categoría no se muestra el título.
  if (map.size === 1) return [['', list]]
  return [...map.entries()]
}
