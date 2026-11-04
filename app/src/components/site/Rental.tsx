import { useSiteData } from '../../hooks/useSiteData'
import { RENTAL_INCLUDES, RENTAL_PRICE } from '../../lib/fallback'
import { money } from '../../lib/format'
import { serviceIcon } from '../../lib/icons'
import { startQuote } from '../../lib/quote'
import { genericMessage, openWhatsApp } from '../../lib/whatsapp'
import { Icon, WhatsAppIcon } from '../ui/Icon'

/** Precio único: arriendo de la casa completa. Los paquetes y extras se
 *  mostrarán aquí cuando se activen desde el panel. */
export function Rental() {
  const { packages, settings, slots } = useSiteData()
  const rental = packages[0]
  const price = rental?.price ?? RENTAL_PRICE
  const includes = rental?.package_services?.length ? rental.package_services.map((s) => s.name) : RENTAL_INCLUDES
  const deposit = Math.round((price * (settings?.deposit_percent ?? 30)) / 100)

  return (
    <section id="precio" className="scroll-mt-20 bg-cream-50 py-16 md:py-24">
      <div className="container-x">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-leaf-600">Precio</p>
          <h2 className="text-3xl leading-tight md:text-4xl">Un solo precio, toda la casa</h2>
          <p className="mt-4 text-bark-500">Sin paquetes ni letra chica: arriendas la casa completa para tu evento.</p>
        </header>

        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-lift md:grid-cols-[1fr_1.2fr]">
          <div className="relative flex flex-col justify-between gap-8 overflow-hidden bg-leaf-900 p-7 text-cream-50 md:p-10">
            <div className="pointer-events-none absolute -bottom-16 -right-16 size-56 rounded-full bg-leaf-700/60" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Arriendo del espacio</p>
              <p className="mt-4 font-display text-6xl font-semibold leading-none md:text-7xl">{money(price)}</p>
              <p className="mt-3 text-cream-200">por evento · casa completa y exclusiva</p>
              <ul className="mt-6 space-y-2 text-sm text-cream-100">
                <li className="flex items-center gap-2"><Icon name="users" className="size-4 text-lime-300" /> Hasta {rental?.max_guests ?? settings?.max_capacity ?? 60} personas</li>
                {slots.length > 0 && (
                  <li className="flex items-center gap-2">
                    <Icon name="clock" className="size-4 text-lime-300" /> Bloques de {slots.map((s) => s.name.toLowerCase()).join(', ')}
                  </li>
                )}
                <li className="flex items-center gap-2"><Icon name="money" className="size-4 text-lime-300" /> Abono para reservar: {money(deposit)}</li>
              </ul>
            </div>
            <div className="relative flex flex-col gap-2.5 sm:flex-row md:flex-col lg:flex-row">
              <button
                type="button"
                onClick={() => startQuote({}, 'rental')}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-lime-300 px-6 font-bold text-leaf-900 transition hover:bg-lime-400"
              >
                Ver fechas libres <Icon name="arrowRight" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => openWhatsApp(settings?.whatsapp, genericMessage(settings?.business_name ?? 'La Casa del Árbol'), 'rental')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-cream-50/25 px-5 font-semibold transition hover:bg-cream-50/10"
              >
                <WhatsAppIcon className="size-4.5" /> Consultar
              </button>
            </div>
          </div>

          <div className="p-7 md:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-bark-500">Incluye</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {includes.map((name) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-leaf-50 text-leaf-700">
                    <Icon name={serviceIcon(name)} className="size-4.5" />
                  </span>
                  <span className="text-sm font-medium text-bark-700">{name}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-cream-100 p-4 text-sm text-bark-500">
              Puedes traer tu propia comida, torta y decoración. No pagas nada para solicitar tu fecha.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
