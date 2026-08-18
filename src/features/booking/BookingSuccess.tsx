import { Link } from 'react-router-dom'
import { Icon, WhatsAppIcon } from '../../components/ui/Icon'
import { Badge, Button, Card } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { longDate, money } from '../../lib/format'
import { openWhatsApp, requestMessage } from '../../lib/whatsapp'

export interface SubmittedReservation {
  code: string
  event_date: string
  slot_name: string | null
  start_time: string | null
  end_time: string | null
  guests: number
  package_name: string | null
  total_amount: number
  addonNames: string[]
  customerName: string
  eventTypeName: string | null
}

const TIMELINE = [
  { title: 'Solicitud recibida', text: 'Ya tenemos tus datos. Este es el estado actual.', done: true },
  { title: 'Confirmamos disponibilidad', text: 'Revisamos la agenda y te avisamos por WhatsApp.', done: false },
  { title: 'Abono y pago', text: 'Te enviamos las instrucciones para reservar la fecha.', done: false },
  { title: 'Evento confirmado', text: 'La fecha queda bloqueada solo para ti. 🎉', done: false },
]

export function BookingSuccess({ reservation }: { reservation: SubmittedReservation }) {
  const { settings } = useSiteData()
  const { push } = useToast()

  const message = requestMessage({
    business: settings?.business_name ?? '',
    code: reservation.code,
    name: reservation.customerName,
    eventType: reservation.eventTypeName,
    packageName: reservation.package_name,
    dateISO: reservation.event_date,
    slotName: reservation.slot_name,
    start: reservation.start_time,
    end: reservation.end_time,
    guests: reservation.guests,
    total: reservation.total_amount,
    addons: reservation.addonNames,
  })

  return (
    <div className="container-x py-10 md:py-16">
      <div className="mx-auto max-w-2xl text-center fade-up">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-leaf-100 text-leaf-700">
          <Icon name="check" className="size-8" />
        </span>
        <h1 className="mt-6 text-3xl leading-tight md:text-4xl">¡Recibimos tu solicitud!</h1>
        <p className="mt-3 text-bark-500">
          Revisaremos la disponibilidad y te contactaremos por WhatsApp para confirmar tu fecha.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-dashed border-leaf-600/40 bg-leaf-50 px-5 py-3">
          <span className="text-sm text-bark-500">Tu código</span>
          <strong className="font-display text-2xl tracking-wide text-leaf-900">{reservation.code}</strong>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(reservation.code)
              push('Código copiado', 'success')
            }}
            className="rounded-lg p-1.5 text-bark-500 transition hover:bg-leaf-100"
            aria-label="Copiar código"
          >
            <Icon name="clipboard" className="size-4" />
          </button>
        </div>
      </div>

      <Card className="mx-auto mt-8 max-w-2xl overflow-hidden">
        <div className="divide-y divide-bark-900/8">
          {reservation.eventTypeName && <Row label="Evento" value={reservation.eventTypeName} />}
          {reservation.package_name && <Row label="Paquete" value={reservation.package_name} />}
          <Row label="Fecha" value={longDate(reservation.event_date)} />
          {reservation.slot_name && (
            <Row label="Horario" value={`${reservation.slot_name} · ${reservation.start_time} — ${reservation.end_time}`} />
          )}
          <Row label="Invitados" value={`${reservation.guests} personas`} />
          {reservation.addonNames.length > 0 && (
            <Row label="Adicionales" value={reservation.addonNames.join(', ')} />
          )}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-bark-900/8 bg-cream-100 px-5 py-4">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wide text-bark-500">Total estimado</span>
            <strong className="font-display text-2xl text-leaf-700">{money(reservation.total_amount)}</strong>
          </div>
          <Badge tone="amber"><Icon name="clock" className="size-3.5" /> Pendiente de confirmación</Badge>
        </div>
      </Card>

      <div className="mx-auto mt-6 max-w-2xl space-y-3">
        <Button
          full
          size="lg"
          variant="whatsapp"
          onClick={() => openWhatsApp(settings?.whatsapp, message, 'booking_success')}
        >
          <WhatsAppIcon /> Continuar por WhatsApp
        </Button>
        <p className="text-center text-sm text-bark-500">
          Nos llega tu solicitud completa y respondemos más rápido.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <h2 className="mb-5 text-xl">¿Qué pasa ahora?</h2>
        <ol className="space-y-4">
          {TIMELINE.map((t, i) => (
            <li key={t.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    t.done ? 'bg-leaf-700 text-white' : 'bg-cream-200 text-bark-500'
                  }`}
                >
                  {t.done ? <Icon name="check" className="size-4" /> : i + 1}
                </span>
                {i < TIMELINE.length - 1 && <span className="my-1 w-px flex-1 bg-bark-900/10" />}
              </div>
              <div className="pb-2">
                <p className="font-semibold">{t.title}</p>
                <p className="text-sm text-bark-500">{t.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/estado?codigo=${reservation.code}`}
            className="flex-1 rounded-xl border border-bark-900/12 bg-white px-4 py-3 text-center text-sm font-semibold transition hover:border-leaf-600"
          >
            Ver estado de mi solicitud
          </Link>
          <Link
            to="/"
            className="flex-1 rounded-xl border border-bark-900/12 bg-white px-4 py-3 text-center text-sm font-semibold transition hover:border-leaf-600"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
      <span className="text-sm text-bark-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
