import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, WhatsAppIcon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { longDate, money } from '../../lib/format'
import { goToWhatsApp, requestMessage, waLink } from '../../lib/whatsapp'
import { irAPagar, reservaAnima } from '../../lib/anima'
import { track } from '../../lib/analytics'

export interface SubmittedReservation {
  code: string
  event_date: string
  slot_name: string | null
  start_time: string | null
  end_time: string | null
  guests: number
  package_name: string | null
  package_price: number
  price_lines?: { label: string; value: number }[]
  weekend?: boolean
  total_amount: number
  deposit: number
  addons: { name: string; quantity: number; subtotal: number }[]
  customerName: string
  phone: string
  notes: string
  source: string | null
  eventTypeName: string | null
  /** true si quedó registrada en el sistema de reservas (tiene seguimiento en /estado). */
  registered: boolean
}

const AUTO_SECONDS = 4

const TIMELINE = [
  { title: 'Solicitud lista', text: 'Ya tienes la fecha, el horario y el valor del arriendo.' },
  { title: 'La envías por WhatsApp', text: 'Nos llega completa: no tienes que explicar nada.' },
  { title: 'Confirmamos tu fecha', text: 'Revisamos la agenda y te respondemos el mismo día.' },
  { title: 'Abonas y queda reservado', text: 'Con el abono bloqueamos la fecha solo para ti. 🎉' },
]

export function BookingSuccess({ reservation: r, embedded = false }: { reservation: SubmittedReservation; embedded?: boolean }) {
  const { settings } = useSiteData()
  const { push } = useToast()
  const [seconds, setSeconds] = useState(AUTO_SECONDS)
  const [cancelled, setCancelled] = useState(false)
  const [sent, setSent] = useState(false)
  // Pago en línea: si ANIMA lo ofrece para esta reserva, es el camino principal
  // (la fecha queda tomada al instante) y WhatsApp pasa a ser la alternativa.
  const [online, setOnline] = useState<{ abono: number } | null>(null)
  const [pagando, setPagando] = useState(false)
  const [errorPago, setErrorPago] = useState<string | null>(null)
  useEffect(() => {
    if (!r.registered) return
    void reservaAnima(r.code).then(({ data }) => {
      const d = data as { pago_online?: boolean; deposit_due?: number } | null
      if (d?.pago_online && (d.deposit_due ?? 0) > 0) { setOnline({ abono: d.deposit_due! }); setCancelled(true) }
    })
  }, [r.code, r.registered])
  const pagar = async () => {
    setPagando(true); setErrorPago(null)
    track('reservation_started', { source: 'mercadopago', tipo: 'abono' })
    const e = await irAPagar(r.code, 'abono')
    if (e) { setErrorPago(e); setPagando(false) }
  }

  const message = useMemo(
    () =>
      requestMessage({
        business: settings?.business_name ?? 'La Casa del Árbol 309',
        code: r.code,
        name: r.customerName,
        phone: r.phone,
        eventType: r.eventTypeName,
        packageName: r.package_name,
        packagePrice: r.package_price,
        priceLines: r.price_lines,
        dateISO: r.event_date,
        slotName: r.slot_name,
        start: r.start_time,
        end: r.end_time,
        guests: r.guests,
        total: r.total_amount,
        deposit: r.deposit,
        addons: r.addons,
        notes: r.notes,
        source: r.source,
      }),
    [r, settings?.business_name],
  )

  const send = () => {
    setSent(true)
    setCancelled(true)
    goToWhatsApp(settings?.whatsapp, message, 'booking_success')
  }

  // Abre WhatsApp solo tras una cuenta regresiva visible, que se puede detener.
  useEffect(() => {
    if (cancelled || sent) return
    if (seconds <= 0) {
      send()
      return
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, cancelled, sent])

  return (
    <div className={embedded ? '' : 'container-x py-10 md:py-16'}>
      <div className="mx-auto max-w-2xl">
        <div className="text-center fade-up">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-leaf-100 text-leaf-700">
            <Icon name="check" className="size-8" />
          </span>
          <h2 className="mt-5 text-3xl leading-tight md:text-4xl">¡Tu solicitud está lista, {r.customerName.split(' ')[0]}!</h2>
          <p className="mt-3 text-bark-500">
            Envíala por WhatsApp y te confirmamos la disponibilidad de tu fecha.
          </p>
        </div>

        <div className="mt-7 overflow-hidden rounded-3xl border border-bark-900/8 bg-white shadow-lift">
          <div className="flex items-center justify-between gap-3 bg-leaf-900 px-5 py-4 text-cream-50">
            <div>
              <p className="text-xs uppercase tracking-wider text-cream-200">Código</p>
              <p className="font-display text-2xl tracking-wide">{r.code}</p>
            </div>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(r.code)
                push('Código copiado', 'success')
              }}
              className="rounded-full bg-cream-50/10 p-2.5 transition hover:bg-cream-50/20"
              aria-label="Copiar código"
            >
              <Icon name="clipboard" className="size-4" />
            </button>
          </div>
          <dl className="divide-y divide-bark-900/8 text-sm">
            {r.eventTypeName && <Row label="Evento" value={r.eventTypeName} />}
            {r.package_name && (
              <Row label={r.weekend ? 'Arriendo (fin de semana)' : 'Arriendo'} value={`${r.package_name} · ${money(r.package_price)}`} />
            )}
            {r.price_lines?.map((l) => <Row key={l.label} label={`+ ${l.label}`} value={money(l.value)} />)}
            <Row label="Fecha" value={longDate(r.event_date)} />
            {r.slot_name && <Row label="Horario" value={`${r.slot_name} · ${r.start_time} — ${r.end_time}`} />}
            <Row label="Invitados" value={`${r.guests} personas`} />
            {r.addons.map((a) => (
              <Row key={a.name} label={`+ ${a.name}${a.quantity > 1 ? ` ×${a.quantity}` : ''}`} value={money(a.subtotal)} />
            ))}
          </dl>
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-bark-900/12 bg-cream-50 px-5 py-4">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-bark-500">Total estimado</span>
              <strong className="font-display text-3xl text-leaf-700">{money(r.total_amount)}</strong>
              <span className="block text-xs text-bark-500">Abono para reservar: {money(r.deposit)}</span>
            </div>
            <Badge tone="amber"><Icon name="clock" className="size-3.5" /> Por confirmar</Badge>
          </div>
        </div>

        {online && (
          <div className="mt-6 rounded-3xl border-2 border-leaf-600 bg-leaf-50 p-5">
            <p className="font-display text-xl">Asegura tu fecha ahora</p>
            <p className="mt-1 text-sm text-bark-700">Paga el abono con Mercado Pago (tarjeta, débito o saldo) y tu reserva queda <strong>confirmada al instante</strong>, sin esperar respuesta.</p>
            <button
              onClick={() => void pagar()}
              disabled={pagando}
              className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-leaf-700 text-base font-bold text-white shadow-lift transition hover:bg-leaf-900 disabled:opacity-60"
            >
              <Icon name="lock" className="size-5" /> {pagando ? 'Abriendo Mercado Pago…' : `Pagar abono ${money(online.abono)}`}
            </button>
            {errorPago && <p className="mt-2 text-sm font-semibold text-terra-500" role="alert">{errorPago}</p>}
            <p className="mt-2 text-center text-xs text-bark-500">Pago seguro procesado por Mercado Pago.</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {online && <p className="text-center text-sm font-semibold text-bark-500">¿Prefieres coordinar primero?</p>}
          <button
            onClick={send}
            className="relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-[#25D366] text-base font-bold text-white shadow-lift transition hover:bg-[#1EBE5B] active:scale-[0.99]"
          >
            {!cancelled && (
              <span
                className="absolute inset-y-0 left-0 bg-white/20"
                style={{ width: `${((AUTO_SECONDS - seconds) / AUTO_SECONDS) * 100}%`, transition: 'width 1s linear' }}
              />
            )}
            <span className="relative flex items-center gap-2.5">
              <WhatsAppIcon className="size-6" />
              {sent ? 'Abrir WhatsApp otra vez' : 'Enviar solicitud por WhatsApp'}
            </span>
          </button>
          {!cancelled ? (
            <p className="text-center text-sm text-bark-500">
              Abriendo WhatsApp en {seconds} s…{' '}
              <button onClick={() => setCancelled(true)} className="font-semibold text-bark-700 underline underline-offset-2">
                Esperar
              </button>
            </p>
          ) : (
            <p className="text-center text-sm text-bark-500">
              Solo presiona <strong>Enviar</strong> en WhatsApp: el mensaje ya va escrito.{' '}
              <a href={waLink(settings?.whatsapp, message)} className="font-semibold text-leaf-700 underline underline-offset-2">
                Enlace directo
              </a>
            </p>
          )}
        </div>

        <div className="mt-10">
          <h3 className="mb-5 text-xl">¿Qué pasa ahora?</h3>
          <ol className="space-y-4">
            {TIMELINE.map((t, i) => {
              const done = i === 0 || (i === 1 && sent)
              return (
                <li key={t.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        done ? 'bg-leaf-700 text-white' : 'bg-cream-200 text-bark-500'
                      }`}
                    >
                      {done ? <Icon name="check" className="size-4" /> : i + 1}
                    </span>
                    {i < TIMELINE.length - 1 && <span className="my-1 w-px flex-1 bg-bark-900/10" />}
                  </div>
                  <div className="pb-2">
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-sm text-bark-500">{t.text}</p>
                  </div>
                </li>
              )
            })}
          </ol>

          {r.registered && (
            <Link
              to={`/estado?codigo=${r.code}`}
              className="mt-6 block rounded-full border border-bark-900/12 bg-white px-4 py-3 text-center text-sm font-semibold transition hover:border-leaf-600"
            >
              Ver el estado de mi solicitud
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3">
      <dt className="text-bark-500">{label}</dt>
      <dd className="text-right font-medium first-letter:uppercase">{value}</dd>
    </div>
  )
}
