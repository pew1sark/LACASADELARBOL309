import { Link } from 'react-router-dom'
import { useSiteData } from '../../hooks/useSiteData'
import { Icon } from '../ui/Icon'

export function Footer() {
  const { settings } = useSiteData()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-bark-900 pb-28 pt-16 text-cream-200 md:pb-16">
      <div className="container-x">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl text-cream-50">{settings?.business_name}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed">{settings?.tagline}</p>
            <div className="mt-5 flex gap-3">
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer noopener" aria-label="Instagram"
                   className="rounded-xl bg-cream-50/8 p-2.5 transition hover:bg-cream-50/15">
                  <Icon name="instagram" className="size-4.5" />
                </a>
              )}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer noopener" aria-label="Facebook"
                   className="rounded-xl bg-cream-50/8 p-2.5 transition hover:bg-cream-50/15">
                  <Icon name="facebook" className="size-4.5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-sun-400">Contacto</p>
            <ul className="space-y-3 text-sm">
              {settings?.address && (
                <li className="flex items-start gap-2.5">
                  <Icon name="mapPin" className="mt-0.5 size-4 shrink-0 text-cream-50/50" />
                  <span>
                    {settings.address}
                    {settings.city ? `, ${settings.city}` : ''}
                  </span>
                </li>
              )}
              {settings?.phone && (
                <li className="flex items-center gap-2.5">
                  <Icon name="phone" className="size-4 shrink-0 text-cream-50/50" />
                  <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-2.5">
                  <Icon name="mail" className="size-4 shrink-0 text-cream-50/50" />
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              )}
              {settings?.opening_hours && (
                <li className="flex items-start gap-2.5">
                  <Icon name="clock" className="mt-0.5 size-4 shrink-0 text-cream-50/50" />
                  <span>{settings.opening_hours}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-sun-400">Reservas</p>
            <ul className="space-y-3 text-sm">
              <li><Link to="/reservar" className="transition hover:text-cream-50">Consultar disponibilidad</Link></li>
              <li><Link to="/estado" className="transition hover:text-cream-50">Ver estado de mi solicitud</Link></li>
              <li><a href="/#paquetes" className="transition hover:text-cream-50">Paquetes y precios</a></li>
              <li><a href="/#preguntas" className="transition hover:text-cream-50">Preguntas frecuentes</a></li>
            </ul>
          </div>
        </div>

        {settings?.cancellation_policy && (
          <p className="mt-12 border-t border-cream-50/10 pt-6 text-xs leading-relaxed text-cream-200/60">
            <strong className="text-cream-200">Política de reservas:</strong> {settings.cancellation_policy}
          </p>
        )}

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-cream-50/10 pt-6 text-xs text-cream-200/60 sm:flex-row">
          <p>© {year} {settings?.business_name}. Todos los derechos reservados.</p>
          <Link to="/admin" className="transition hover:text-cream-50">Acceso administración</Link>
        </div>
      </div>
    </footer>
  )
}
