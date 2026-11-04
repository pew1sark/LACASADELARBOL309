import { useState } from 'react'
import { useSiteData } from '../../hooks/useSiteData'
import { asset } from '../../lib/asset'
import { INSTAGRAM_HANDLE } from '../../lib/fallback'
import { money } from '../../lib/format'
import { startQuote } from '../../lib/quote'
import { Icon } from '../ui/Icon'

export function Hero() {
  const { settings, eventTypes, packages } = useSiteData()
  const [eventSlug, setEventSlug] = useState<string | null>(null)
  const [guests, setGuests] = useState(25)

  const minPrice = packages.length ? Math.min(...packages.map((p) => p.price)) : null
  const fromPrice = (slug: string) => {
    const et = eventTypes.find((e) => e.slug === slug)
    const list = packages.filter((p) => p.event_type_id === et?.id)
    return list.length ? Math.min(...list.map((p) => p.price)) : null
  }
  const selectedFrom = eventSlug ? fromPrice(eventSlug) : minPrice
  const max = settings?.max_capacity ?? 60

  return (
    <section className="relative overflow-hidden bg-leaf-900">
      <div className="absolute inset-0">
        <img
          src={asset(settings?.hero_image_url ?? 'images/hero.svg')}
          alt=""
          className="size-full object-cover object-[70%_75%]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-leaf-950/95 via-leaf-900/80 to-leaf-900/40" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-leaf-950/60 to-transparent" />
      </div>

      <div className="container-x relative grid items-center gap-7 py-8 sm:py-12 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:py-24">
        <div className="text-cream-50 fade-up">
          <a
            href={settings?.instagram_url ?? '#'}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full border border-cream-50/20 bg-cream-50/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-cream-50/15"
          >
            <Icon name="instagram" className="size-3.5" /> @{INSTAGRAM_HANDLE}
            <span className="text-cream-50/50">·</span>
            <Icon name="mapPin" className="size-3.5 text-lime-300" />
            {settings?.city ?? 'Chiguayante'}
          </a>

          <h1 className="mt-5 text-[2.3rem] leading-[1.04] sm:text-6xl lg:text-[4rem]">
            Celebra en una casa{' '}
            <span className="relative whitespace-nowrap text-lime-300">
              solo para ti
              <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 w-full text-lime-300/60" aria-hidden>
                <path d="M2 9c40-6 120-8 196-3" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-cream-200 sm:text-lg">
            Salón, galpón de juegos con inflable y cama elástica, taca-taca, patio y cocina: todo para tu
            cumpleaños o evento. Cotiza en 1 minuto y recibe tu cotización directo en WhatsApp.
          </p>

          <ul className="mt-8 hidden max-w-lg grid-cols-2 gap-3 sm:grid text-sm font-medium text-cream-100">
            {[
              ['users', `Hasta ${max} invitados`],
              ['shield', 'Espacio privado y seguro'],
              ['money', 'Sin pago para cotizar'],
              ['clock', 'Respuesta el mismo día'],
            ].map(([icon, label]) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-cream-50/10 text-lime-300">
                  <Icon name={icon as 'users'} className="size-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Cotizador rápido: lo primero que ve quien llega desde un anuncio. */}
        <div className="fade-up rounded-3xl bg-cream-50 p-5 text-bark-900 shadow-lift sm:p-7" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf-600">Cotiza tu evento</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-2.5 py-1 text-[0.7rem] font-semibold text-leaf-900">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf-500 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-leaf-500" />
              </span>
              Agenda abierta
            </span>
          </div>

          <p className="mt-4 text-sm font-semibold">¿Qué celebras?</p>
          <div className="mt-2 grid gap-2">
            {!eventTypes.length &&
              [0, 1, 2].map((i) => <div key={i} className="h-[52px] animate-pulse rounded-2xl bg-cream-200/70" />)}
            {eventTypes.map((et) => {
              const active = eventSlug === et.slug
              const from = fromPrice(et.slug)
              return (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => setEventSlug(et.slug)}
                  aria-pressed={active}
                  className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
                    active ? 'border-leaf-700 bg-leaf-50' : 'border-bark-900/8 bg-white hover:border-leaf-300'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid size-5 place-items-center rounded-full border-2 ${
                        active ? 'border-leaf-700 bg-leaf-700' : 'border-bark-900/20'
                      }`}
                    >
                      {active && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="font-semibold">{et.name}</span>
                  </span>
                  {from && <span className="text-xs text-bark-500">desde {money(from)}</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="hero-guests" className="text-sm font-semibold">Invitados</label>
              <span className="font-display text-xl font-semibold text-leaf-700">{guests}</span>
            </div>
            <input
              id="hero-guests"
              type="range"
              min={10}
              max={max}
              step={5}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="mt-2 w-full accent-leaf-700"
            />
          </div>

          <button
            type="button"
            onClick={() => startQuote({ eventSlug: eventSlug ?? undefined, guests }, 'hero')}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-leaf-700 text-base font-bold text-white shadow-soft transition hover:bg-leaf-900 active:scale-[0.99]"
          >
            Ver precios y fechas libres <Icon name="arrowRight" className="size-5" />
          </button>
          {selectedFrom && (
            <p className="mt-3 text-center text-xs text-bark-500">
              Paquetes desde <strong className="text-bark-900">{money(selectedFrom)}</strong> · sin compromiso
            </p>
          )}
          <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-bark-900/8 pt-4 text-xs font-medium text-bark-700 sm:hidden">
            <li className="flex items-center gap-1"><Icon name="check" className="size-3.5 text-leaf-600" /> Hasta {max} invitados</li>
            <li className="flex items-center gap-1"><Icon name="check" className="size-3.5 text-leaf-600" /> Sin pago para cotizar</li>
            <li className="flex items-center gap-1"><Icon name="check" className="size-3.5 text-leaf-600" /> Respuesta el mismo día</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
