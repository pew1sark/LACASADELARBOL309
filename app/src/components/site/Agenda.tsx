import { BookingWizard } from '../../features/booking/BookingWizard'

/** La agenda vive dentro del landing: quien llega desde un anuncio cotiza,
 *  elige fecha y envía su solicitud sin cambiar de página. */
export function Agenda() {
  return (
    <section id="agendar" className="scroll-mt-16 bg-gradient-to-b from-cream-100 to-cream-50 py-16 md:py-24">
      <div className="container-x">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-leaf-600">Agenda tu fecha</p>
          <h2 className="text-3xl leading-tight md:text-4xl">Reserva tu fecha en 1 minuto</h2>
          <p className="mt-4 text-base leading-relaxed text-bark-500">
            Elige el día y el horario, cuéntanos de tu evento y la solicitud te llega lista a WhatsApp para confirmar.
          </p>
        </header>
        <div className="mx-auto max-w-6xl">
          <BookingWizard embedded />
        </div>
      </div>
    </section>
  )
}
