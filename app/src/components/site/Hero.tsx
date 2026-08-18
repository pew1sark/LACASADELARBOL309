import { useSiteData } from '../../hooks/useSiteData'
import { asset } from '../../lib/asset'
import { genericMessage, openWhatsApp } from '../../lib/whatsapp'
import { Icon, WhatsAppIcon } from '../ui/Icon'
import { Button, LinkButton } from '../ui/Primitives'

export function Hero() {
  const { settings } = useSiteData()
  const name = settings?.business_name ?? 'La Casa del Árbol 309'

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={asset(settings?.hero_image_url ?? 'images/hero.svg')}
          alt=""
          className="size-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bark-900/45 via-bark-900/55 to-bark-900/80" />
      </div>

      <div className="container-x relative flex min-h-[88svh] flex-col justify-center py-20 text-cream-50 md:min-h-[86svh]">
        <div className="max-w-2xl fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-cream-50/25 bg-cream-50/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] backdrop-blur">
            <Icon name="sparkles" className="size-3.5" />
            {settings?.city ? `Casa de eventos · ${settings.city}` : 'Casa de eventos'}
          </span>

          <h1 className="mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl md:text-[4.2rem]">
            {settings?.tagline ?? 'El lugar perfecto para celebrar momentos inolvidables'}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-200">
            Cumpleaños, celebraciones familiares y eventos privados en un espacio cálido,
            seguro y preparado para que solo te preocupes de disfrutar.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <LinkButton to="/reservar" size="lg" className="sm:min-w-64">
              Consultar disponibilidad
              <Icon name="arrowRight" className="size-4.5" />
            </LinkButton>
            <Button
              variant="whatsapp"
              size="lg"
              onClick={() => openWhatsApp(settings?.whatsapp, genericMessage(name), 'hero')}
            >
              <WhatsAppIcon /> Hablar por WhatsApp
            </Button>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-cream-200">
            {[
              ['users', `Hasta ${settings?.max_capacity ?? 60} personas`],
              ['shield', 'Espacio privado y seguro'],
              ['check', 'Reserva sin costo inicial'],
            ].map(([icon, label]) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon name={icon as 'users'} className="size-4 text-sun-400" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
