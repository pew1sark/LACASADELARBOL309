import { useState } from 'react'
import { asset } from '../../lib/asset'
import { SPACES } from '../../lib/spaces'
import { Icon } from '../ui/Icon'

/** Recorrido por los espacios reales de la casa (fotos del reel). */
export function Spaces() {
  const [active, setActive] = useState(0)
  const s = SPACES[active]

  return (
    <section id="espacios" className="scroll-mt-20 bg-leaf-900 py-16 text-cream-50 md:py-24">
      <div className="container-x">
        <header className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Ven a conocer</p>
          <h2 className="text-3xl leading-tight md:text-4xl">Aquí empieza su gran día</h2>
          <p className="mt-4 text-cream-200">
            Salón, galpón de juegos techado, patio, cocina y baños. Todo en una sola casa, solo para tu evento.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-3xl bg-leaf-950 shadow-lift">
            <img
              key={s.image}
              src={asset(s.image)}
              alt={s.title}
              loading="lazy"
              className="fade-up aspect-[4/3] size-full object-cover lg:aspect-auto lg:min-h-[28rem]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-leaf-950/95 via-leaf-950/60 to-transparent p-5 pt-16 md:p-7 md:pt-24">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-300">{s.kicker}</p>
              <h3 className="mt-1 text-2xl md:text-3xl">{s.title}</h3>
              <p className="mt-2 max-w-md text-sm text-cream-200 md:text-base">{s.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.tags.map((t) => (
                  <span key={t} className="rounded-full bg-cream-50/12 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
            {SPACES.map((sp, i) => (
              <li key={sp.title}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={`group relative flex h-full w-full items-end overflow-hidden rounded-2xl text-left transition ${
                    i === active ? 'ring-2 ring-lime-300 ring-offset-2 ring-offset-leaf-900' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={asset(sp.image)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-leaf-950/90 via-leaf-950/30 to-transparent" />
                  <span className="relative flex min-h-24 w-full items-center gap-2 p-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-lime-300 text-leaf-900">
                      <Icon name={sp.icon} className="size-4" />
                    </span>
                    <span className="text-sm font-semibold leading-tight">{sp.kicker}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
