import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon, WhatsAppIcon } from '../components/ui/Icon'
import { Badge, Button, Card, Field } from '../components/ui/Primitives'
import { useSiteData } from '../hooks/useSiteData'
import { track } from '../lib/analytics'
import { asset } from '../lib/asset'
import { longDate, money } from '../lib/format'
import { supabase } from '../lib/supabase'
import { animaActivo, irAPagar, reservaAnima, verificarPagoAnima, type ResultadoPago } from '../lib/anima'
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
    // ANIMA primero, aunque el catálogo todavía no haya cargado (p. ej. al volver
    // de Mercado Pago); la base anterior solo si ANIMA no conoce el código.
    let { data: res } = await reservaAnima(value.trim())
    if (!res && !animaActivo()) res = (await supabase.rpc('get_reservation_public', { p_code: value.trim() })).data
    setLoading(false)
    track('status_checked')
    if (!res) {
      setData(null)
      setNotFound(true)
      return
    }
    setData(res as unknown as PublicReservation)
    setParams({ codigo: value.trim().toUpperCase() }, { replace: true })
  }

  // ---- Pago en línea (Mercado Pago) ----
  const [pago, setPago] = useState<ResultadoPago | null>(null)
  const [verificando, setVerificando] = useState(false)
  const [pagando, setPagando] = useState<'abono' | 'total' | null>(null)
  const [errorPago, setErrorPago] = useState<string | null>(null)

  const pagar = async (tipo: 'abono' | 'total') => {
    if (!data) return
    setPagando(tipo)
    setErrorPago(null)
    track('reservation_started', { source: 'mercadopago', tipo })
    const e = await irAPagar(data.code, tipo)
    if (e) {
      setErrorPago(e)
      setPagando(null)
    }
  }

  /** Vuelta desde Mercado Pago: se verifica contra ANIMA (que pregunta a Mercado Pago). */
  const verificar = async (codigo: string) => {
    setVerificando(true)
    let r: ResultadoPago | null = null
    for (let i = 0; i < 5; i++) {
      r = (await verificarPagoAnima(codigo)).data
      if (r && r.estado !== 'creada' && r.estado !== 'pendiente') break
      await new Promise((ok) => setTimeout(ok, 3000))
    }
    setPago(r)
    setVerificando(false)
    if (r?.estado === 'aprobada' && r.event_id) {
      // Venta a Meta desde el navegador con el mismo id que la del servidor: Meta la cuenta una vez.
      const clave = `lca309-compra-${r.event_id}`
      let ya = false
      try { ya = !!localStorage.getItem(clave); localStorage.setItem(clave, '1') } catch { /* sin almacenamiento */ }
      if (!ya) {
        window.fbq?.('track', 'Purchase', { value: r.monto, currency: 'CLP', content_name: `Reserva ${codigo}` }, { eventID: r.event_id })
        track('reservation_confirmed', { value: r.monto, currency: 'CLP' })
      }
    }
    await search(codigo)
  }

  useEffect(() => {
    const initial = params.get('codigo')
    if (initial && params.get('pago')) void verificar(initial)
    else if (initial) void search(initial)
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

        {(verificando || pago) && (
          <ResultadoDePago pago={pago} verificando={verificando} codigo={data?.code ?? params.get('codigo') ?? ''}
                           whatsapp={settings?.whatsapp} negocio={settings?.business_name ?? 'La Casa del Árbol 309'} />
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

              {data.pago_online && ['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED'].includes(data.status) && (data.deposit_due ?? 0) + (data.balance_due ?? 0) > 0 && (
                <div className="border-t border-bark-900/8 bg-leaf-50 px-5 py-5">
                  <h2 className="flex items-center gap-2 text-lg">
                    <Icon name="lock" className="size-5 text-leaf-700" />
                    {(data.deposit_due ?? 0) > 0 ? 'Paga el abono y tu fecha queda reservada' : 'Paga el saldo en línea'}
                  </h2>
                  <p className="mt-1 text-sm text-bark-700">
                    {(data.deposit_due ?? 0) > 0
                      ? 'Con tarjeta de crédito, débito o saldo de Mercado Pago. Apenas se aprueba, tu reserva queda confirmada al instante.'
                      : 'Puedes pagar lo que falta ahora o el día del evento.'}
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {(data.deposit_due ?? 0) > 0 && (
                      <Button size="lg" onClick={() => void pagar('abono')} disabled={!!pagando}>
                        {pagando === 'abono' ? 'Abriendo Mercado Pago…' : `Pagar abono ${money(data.deposit_due ?? 0)}`}
                      </Button>
                    )}
                    {(data.balance_due ?? 0) > 0 && (data.balance_due ?? 0) !== (data.deposit_due ?? 0) && (
                      <Button size="lg" variant={(data.deposit_due ?? 0) > 0 ? 'outline' : 'primary'} onClick={() => void pagar('total')} disabled={!!pagando}>
                        {pagando === 'total' ? 'Abriendo Mercado Pago…' : `Pagar el total ${money(data.balance_due ?? 0)}`}
                      </Button>
                    )}
                  </div>
                  {errorPago && <p className="mt-3 text-sm font-semibold text-terra-500" role="alert">{errorPago}</p>}
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-bark-500"><Icon name="shield" className="size-3.5" /> Pago seguro procesado por Mercado Pago. No guardamos los datos de tu tarjeta.</p>
                </div>
              )}

              {data.payment && data.status === 'AWAITING_PAYMENT' && !data.pago_online && (
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

            {data.status === 'CONFIRMED' && <PreparaTuEvento />}
            {data.status === 'COMPLETED' && <Gracias instagram={settings?.instagram_url} />}

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

/** Post-venta: lo que el cliente necesita saber antes del día. Solo reglas
 *  públicas que ya están en la web (preguntas frecuentes). */
function PreparaTuEvento() {
  const items = [
    'Puedes traer tu comida, torta y decoración. La cocina equipada está incluida.',
    'El saldo se paga el día del evento.',
    'Capacidad máxima: 60 personas.',
    '¿Necesitas cambiar la fecha? Sin costo hasta 15 días antes, sujeto a disponibilidad.',
  ]
  return (
    <Card className="mt-5 p-5">
      <h2 className="flex items-center gap-2 text-lg">
        <Icon name="clipboard" className="size-5 text-leaf-700" /> Prepara tu evento
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-bark-700">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <Icon name="check" className="mt-0.5 size-4 shrink-0 text-leaf-600" /> {t}
          </li>
        ))}
      </ul>
      <a
        href={asset('catalogo/la-casa-del-arbol-309-catalogo.pdf')}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700 underline-offset-4 hover:underline"
      >
        Ver el catálogo de la casa (PDF) <Icon name="arrowRight" className="size-4" />
      </a>
    </Card>
  )
}

function Gracias({ instagram }: { instagram?: string | null }) {
  return (
    <Card className="mt-5 p-5 text-center">
      <h2 className="text-lg">¡Gracias por celebrar con nosotros!</h2>
      <p className="mt-2 text-sm text-bark-700">
        Si tienes fotos de tu fiesta, etiquétanos en Instagram. Y cuando quieras volver a celebrar, tu próxima fecha está a un clic.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {instagram && (
          <a href={instagram} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 rounded-full border-2 border-leaf-700 px-4 py-2 text-sm font-bold text-leaf-700">
            <Icon name="instagram" className="size-4" /> Instagram
          </a>
        )}
        <a href={`${import.meta.env.BASE_URL}#agendar`} className="inline-flex items-center gap-1.5 rounded-full bg-leaf-700 px-4 py-2 text-sm font-bold text-white">
          <Icon name="calendar" className="size-4" /> Reservar otra fecha
        </a>
      </div>
    </Card>
  )
}

/** Lo que pasó con el pago en Mercado Pago, en palabras de la persona. */
function ResultadoDePago({ pago, verificando, codigo, whatsapp, negocio }: {
  pago: ResultadoPago | null; verificando: boolean; codigo: string; whatsapp?: string | null; negocio: string
}) {
  if (verificando) {
    return (
      <Card className="mt-6 flex items-center gap-3 p-5" aria-live="polite">
        <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-leaf-600 border-t-transparent" />
        <p className="text-sm font-semibold">Confirmando tu pago con Mercado Pago…</p>
      </Card>
    )
  }
  if (!pago) return null
  if (pago.estado === 'aprobada') {
    const texto = pago.sin_cupo
      ? `Hola ${negocio} 👋 Pagué ${money(pago.monto)} con Mercado Pago por la reserva ${codigo}, pero la página dice que el horario ya se había tomado. ¿Me ayudan con otra fecha?`
      : `Hola ${negocio} 👋 Acabo de pagar ${pago.tipo === 'abono' ? 'el abono' : 'mi reserva'} con Mercado Pago (${money(pago.monto)}). Mi código es ${codigo}. ¡Nos vemos en la fiesta! 🎉`
    return (
      <Card className={`mt-6 p-5 ${pago.sin_cupo ? 'border-sun-400' : 'border-leaf-500'}`} aria-live="polite">
        <div className="flex items-start gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-full ${pago.sin_cupo ? 'bg-sun-100 text-sun-600' : 'bg-leaf-100 text-leaf-700'}`}>
            <Icon name={pago.sin_cupo ? 'alert' : 'check'} className="size-5" />
          </span>
          <div>
            <p className="font-display text-xl">{pago.sin_cupo ? 'Recibimos tu pago' : '¡Pago aprobado! Tu fecha está reservada 🎉'}</p>
            <p className="mt-1 text-sm text-bark-500">
              {pago.sin_cupo
                ? 'Justo antes otra persona tomó ese horario. Tu pago está registrado: escríbenos y te ofrecemos otra fecha o te lo devolvemos.'
                : `Recibimos ${money(pago.monto)}. Te enviamos el comprobante de Mercado Pago a tu correo.`}
            </p>
          </div>
        </div>
        <Button full size="lg" variant="whatsapp" className="mt-4" onClick={() => openWhatsApp(whatsapp, texto, 'pago_aprobado')}>
          <WhatsAppIcon /> {pago.sin_cupo ? 'Escribir por WhatsApp' : 'Avisar por WhatsApp que pagué'}
        </Button>
      </Card>
    )
  }
  return (
    <Card className="mt-6 flex items-start gap-3 p-5" aria-live="polite">
      <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-sun-600" />
      <div>
        <p className="font-semibold">{pago.estado === 'rechazada' ? 'El pago no se aprobó' : 'Tu pago todavía no se confirma'}</p>
        <p className="mt-1 text-sm text-bark-500">
          {pago.estado === 'rechazada'
            ? 'No se hizo ningún cargo. Puedes intentarlo otra vez con otro medio de pago.'
            : 'Si ya pagaste, en unos minutos esta página lo mostrará. No es necesario pagar de nuevo.'}
        </p>
      </div>
    </Card>
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
