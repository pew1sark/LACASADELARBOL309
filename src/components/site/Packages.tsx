import { useNavigate } from 'react-router-dom'
import { useSiteData } from '../../hooks/useSiteData'
import { asset } from '../../lib/asset'
import { money } from '../../lib/format'
import { track } from '../../lib/analytics'
import { openWhatsApp, packageMessage } from '../../lib/whatsapp'
import { Icon, WhatsAppIcon } from '../ui/Icon'
import { Badge, Button, Section } from '../ui/Primitives'

export function Packages() {
  const { packages, settings } = useSiteData()
  const navigate = useNavigate()
  if (!packages.length) return null

  return (
    <Section
      id="paquetes"
      eyebrow="Paquetes"
      title="Todo listo, sin sorpresas"
      subtitle="Cada paquete incluye el uso exclusivo del espacio. Puedes sumar servicios adicionales al reservar."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {packages.map((pkg) => (
          <article
            key={pkg.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-bark-900/8 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="relative aspect-[10/7] overflow-hidden">
              <img
                src={asset(pkg.image_url)}
                alt={pkg.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {pkg.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-sun-400 px-3 py-1 text-xs font-bold text-bark-900 shadow-soft">
                  {pkg.badge}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-xl leading-snug">{pkg.name}</h3>
              {pkg.subtitle && <p className="mt-1 text-sm text-bark-500">{pkg.subtitle}</p>}

              <p className="mt-4 flex items-baseline gap-1.5">
                {pkg.price_is_from && <span className="text-xs font-semibold uppercase text-bark-500">desde</span>}
                <span className="font-display text-3xl font-semibold text-leaf-700">{money(pkg.price)}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="cream">
                  <Icon name="clock" className="size-3.5" /> {pkg.duration_hours} h
                </Badge>
                <Badge tone="cream">
                  <Icon name="users" className="size-3.5" /> hasta {pkg.max_guests}
                </Badge>
              </div>

              <ul className="mt-5 flex-1 space-y-2">
                {(pkg.package_services ?? []).slice(0, 6).map((s) => (
                  <li key={s.id} className="flex items-start gap-2 text-sm text-bark-700">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-leaf-600" />
                    {s.name}
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2">
                <Button
                  full
                  onClick={() => {
                    track('view_package', { package: pkg.slug })
                    navigate(`/reservar?paquete=${pkg.slug}`)
                  }}
                >
                  Reservar este pack
                </Button>
                <Button
                  full
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openWhatsApp(
                      settings?.whatsapp,
                      packageMessage(settings?.business_name ?? '', pkg.name, pkg.price),
                      `package:${pkg.slug}`,
                    )
                  }
                >
                  <WhatsAppIcon className="size-4" /> Preguntar por este pack
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-bark-500">
        Los valores son referenciales y pueden variar según la cantidad de invitados y los servicios adicionales.
      </p>
    </Section>
  )
}
