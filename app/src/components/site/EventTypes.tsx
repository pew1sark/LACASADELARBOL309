import { useSiteData } from '../../hooks/useSiteData'
import { asset } from '../../lib/asset'
import { money } from '../../lib/format'
import { startQuote } from '../../lib/quote'
import { Icon } from '../ui/Icon'
import { Section } from '../ui/Primitives'

export function EventTypes() {
  const { eventTypes, packages } = useSiteData()
  if (!eventTypes.length) return null

  return (
    <Section
      id="eventos"
      eyebrow="Qué celebramos"
      title="Un espacio para cada celebración"
      subtitle="Elige tu celebración y te mostramos al instante los paquetes, precios y fechas libres."
      tone="white"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {eventTypes.map((et) => {
          const prices = packages.filter((p) => p.event_type_id === et.id).map((p) => p.price)
          return (
          <button
            key={et.id}
            type="button"
            onClick={() => startQuote({ eventSlug: et.slug }, `event:${et.slug}`)}
            className="group overflow-hidden rounded-3xl text-left border border-bark-900/8 bg-cream-50 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={asset(et.image_url)}
                alt={et.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {prices.length > 0 && (
                <span className="absolute bottom-3 left-3 rounded-full bg-cream-50/95 px-3 py-1 text-xs font-bold text-bark-900 shadow-soft">
                  desde {money(Math.min(...prices))}
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="text-xl">{et.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bark-500">{et.short_description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700">
                Cotizar este evento
                <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </button>
          )
        })}
      </div>
    </Section>
  )
}
