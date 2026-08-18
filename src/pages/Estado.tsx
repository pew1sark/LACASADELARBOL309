import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon, WhatsAppIcon } from '../components/ui/Icon'
import { Badge, Button, Card, Field } from '../components/ui/Primitives'
import { useSiteData } from '../hooks/useSiteData'
import { track } from '../lib/analytics'
import { longDate, money } from '../lib/format'
import { supabase } from '../lib/supabase'
import { STATUS_LABEL, STATUS_TONE, type PublicReservation } from '../lib/types'
import { openWhatsApp } from '../lib/whatsapp'

const NEXT_STEP: Record<string, string> = {
  PENDING: 'Estamos revisando la disponibilidad de tu fecha. Te avisaremos por WhatsApp muy pronto.',
  AWAITING_PAYMENT: '¡Tu fecha está disponible! Realiza el abono con los datos de más abajo y envíanos el comprobante para confirmar.',
  CONFIRMED: '¡Tu evento está confirmado! La fecha quedó bloqueada solo para ti.',
  COMPLETED: 'Este evento ya se realizó. ¡Gracias por celebrar con nosotros!',
  CANCELLED: 'Esta reserva fue cancelada. Si fue un error, escríbenos por WhatsApp.',
  REJECTED: 'Lamentablemente no pudimos tomar esta fecha. Escríbenos y buscamos una alternativa.',
}

export default function Estado() {
  const { settings } = useSiteData()
  const [params, setParams] = useSearchParams()
  const [code, setCode] = useState(params.get('codigo') ?? '')
  const [data, setData] = useState<PublicReservation | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const search = async (value: string) => {
    if (!value.trim()) return
    setLoading(true)
    setNotFound(false)
    const { data: res } = await supabase.rpc('get_reservation_public', { p_code: value.trim() })
    setLoading(false)
    track('status_checked')
    if (!res) {
      setData(null)
      setNotFound(true)
      return
    }
    setData(res as PublicReservation)
    setParams({ codigo: value.trim().toUpperCase() }, { replace: true })
  }

  useEffect(() => {
    const initial = params.get('codigo')
    if (initial) void search(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deposit = data ? Math.round((data.total_amount * data.deposit_percent) / 100) : 0

  return (
    <div className="container-x py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl md:text-4xl">Estado de tu reserva</h1>
        <p className="mt-3 text-bark-500">
          Ingresa el código que te entregamos al enviar la solicitud (por ejemplo CA-K3F9TR).
        </p>

        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            void search(code)
          }}
        >
          <div className="flex-1">
            <Field
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CA-XXXXXX"
              aria-label="Código de reserva"
              className="uppercase"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Buscando…' : 'Consultar'}
            {!loading && <Icon name="search" className="size-4" />}
          </Button>
        </form>

        {notFound && (
          <Card className="mt-6 flex items-start gap-3 p-5">
            <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-sun-600" />
            <div>
              <p className="font-semibold">No encontramos ese código</p>
              <p className="mt-1 text-sm text-bark-500">
                Revisa que esté escrito completo. Si no lo tienes a mano, escríbenos por WhatsApp y lo buscamos por ti.
              </p>
            </div>
          </Card>
        )}

        {data && (
          <div className="mt-8 fade-up">
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bark-900/8 bg-cream-100 px-5 py-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-bark-500">Reserva</span>
                  <strong className="font-display text-xl">{data.code}</strong>
                </div>
                <Badge tone={STATUS_TONE[data.status]}>{STATUS_LABEL[data.status]}</Badge>
              </div>

              <p className="border-b border-bark-900/8 px-5 py-4 text-sm leading-relaxed text-bark-700">
                Hola {data.first_name}. {NEXT_STEP[data.status]}
              </p>

              <dl className="divide-y divide-bark-900/8">
                {data.event_type && <Row label="Evento" value={data.event_type} />}
                {data.package_name && <Row label="Paquete" value={data.package_name} />}
                <Row label="Fecha" value={longDate(data.event_date)} />
                {data.slot_name && <Row label="Horario" value={`${data.slot_name} · ${data.start_time} — ${data.end_time}`} />}
                <Row label="Invitados" value={`${data.guests} personas`} />
                {data.addons.length > 0 && (
                  <Row label="Adicionales" value={data.addons.map((a) => a.name).join(', ')} />
                )}
                <Row label="Total" value={money(data.total_amount)} />
                {data.paid_amount > 0 && <Row label="Abonado" value={money(data.paid_amount)} />}
              </dl>

              {data.payment && data.status === 'AWAITING_PAYMENT' && (
                <div className="border-t border-bark-900/8 bg-leaf-50 px-5 py-5">
                  <h2 className="flex items-center gap-2 text-lg">
                    <Icon name="money" className="size-5 text-leaf-700" /> Datos para el abono
                  </h2>
                  <p className="mt-2 text-sm text-bark-700">{data.payment.instructions}</p>
                  <div className="mt-4 rounded-xl bg-white p-4 text-sm">
                    <p className="mb-2 flex justify-between gap-4">
                      <span className="text-bark-500">Abono ({data.deposit_percent}%)</span>
                      <strong className="text-leaf-700">{money(deposit)}</strong>
                    </p>
                    <div className="space-y-1 border-t border-bark-900/8 pt-2">
                      <PayRow label="Banco" value={data.payment.bank_name} />
                      <PayRow label="Tipo de cuenta" value={data.payment.account_type} />
                      <PayRow label="N° de cuenta" value={data.payment.account_number} />
                      <PayRow label="Titular" value={data.payment.account_holder} />
                      <PayRow label="RUT" value={data.payment.account_rut} />
                      <PayRow label="Email" value={data.payment.email} />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Button
              full
              size="lg"
              variant="whatsapp"
              className="mt-5"
              onClick={() =>
                openWhatsApp(
                  settings?.whatsapp,
                  `Hola ${settings?.business_name ?? ''} 👋 Consulto por mi reserva ${data.code}.`,
                  'status_page',
                )
              }
            >
              <WhatsAppIcon /> Escribir por WhatsApp
            </Button>
          </div>
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

function PayRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <p className="flex justify-between gap-4">
      <span className="text-bark-500">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
  )
}
