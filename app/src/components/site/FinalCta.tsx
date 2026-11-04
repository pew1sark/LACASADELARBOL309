import { useSiteData } from '../../hooks/useSiteData'
import { startQuote } from '../../lib/quote'
import { genericMessage, openWhatsApp } from '../../lib/whatsapp'
import { LogoMark } from '../brand/Logo'
import { Icon, WhatsAppIcon } from '../ui/Icon'

/** Cierre con el mismo lenguaje que el final del reel: logo, "Agenda tu
 *  fecha" y el WhatsApp en una píldora lima. */
export function FinalCta() {
  const { settings } = useSiteData()
  const phone = settings?.whatsapp ?? ''
  const pretty = phone.replace(/^(\d{2})(\d)(\d{4})(\d{4})$/, '+$1 $2 $3 $4')
  return (
    <section className="bg-cream-50 py-16 md:py-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] bg-leaf-900 px-6 py-14 text-center text-cream-50 shadow-lift md:px-12 md:py-20">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-leaf-700/60" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-leaf-700/50" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Hagamos un día inolvidable</p>
            <LogoMark className="mx-auto mt-6 size-28 md:size-32" />
            <h2 className="mt-6 text-3xl leading-tight md:text-5xl">¡Agenda tu próximo cumpleaños!</h2>
            <p className="mx-auto mt-4 max-w-lg text-cream-200">
              Elige tu fecha en un minuto y recibe la solicitud lista en WhatsApp. Te respondemos el mismo día y no pagas nada
              hasta confirmar.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => startQuote({}, 'final_cta')}
                className="inline-flex h-13 items-center gap-2 rounded-full bg-lime-300 px-7 font-bold text-leaf-900 shadow-soft transition hover:bg-lime-400"
              >
                Ver fechas libres <Icon name="arrowRight" className="size-4.5" />
              </button>
              <button
                type="button"
                onClick={() => openWhatsApp(phone, genericMessage(settings?.business_name ?? 'La Casa del Árbol'), 'final_cta')}
                className="inline-flex h-13 items-center gap-2 rounded-full border border-cream-50/25 px-6 font-semibold text-cream-50 transition hover:bg-cream-50/10"
              >
                <WhatsAppIcon /> {pretty || 'WhatsApp'}
              </button>
            </div>
            <p className="mt-6 text-sm text-cream-200/70">Atiende Julio Cuevas · {settings?.city ?? 'Chiguayante'}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
