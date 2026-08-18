import { Link } from 'react-router-dom'
import { useSiteData } from '../../hooks/useSiteData'
import { asset } from '../../lib/asset'
import { Icon } from '../ui/Icon'
import { Section } from '../ui/Primitives'

export function EventTypes() {
  const { eventTypes } = useSiteData()
  if (!eventTypes.length) return null

  return (
    <Section
      id="eventos"
      eyebrow="Qué celebramos"
      title="Un espacio para cada celebración"
      subtitle="Elige el tipo de evento y te mostramos los paquetes y las fechas disponibles."
      tone="white"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {eventTypes.map((et) => (
          <Link
            key={et.id}
            to={`/reservar?evento=${et.slug}`}
            className="group overflow-hidden rounded-2xl border border-bark-900/8 bg-cream-50 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={asset(et.image_url)}
                alt={et.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <h3 className="text-xl">{et.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-bark-500">{et.short_description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700">
                Ver paquetes
                <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  )
}
