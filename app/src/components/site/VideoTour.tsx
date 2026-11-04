import { useEffect, useRef } from 'react'
import { asset } from '../../lib/asset'
import { startQuote } from '../../lib/quote'
import { Icon } from '../ui/Icon'

const POINTS = [
  { icon: 'smile' as const, text: 'Inflable, cama elástica, taca-taca y air hockey' },
  { icon: 'star' as const, text: 'Bloques gigantes y juegos de madera' },
  { icon: 'tree' as const, text: 'Patio con ping pong y básquetbol' },
  { icon: 'kitchen' as const, text: 'Cocina equipada, baños y sala multiuso' },
]

/** Recorrido en video (el mismo reel de los anuncios), en marco de celular.
 *  Se reproduce sin sonido solo cuando está en pantalla para no gastar datos. */
export function VideoTour() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? void v.play().catch(() => {}) : v.pause()),
      { threshold: 0.35 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])

  return (
    <section className="overflow-hidden bg-sky-50 py-16 md:py-24">
      <div className="container-x grid items-center gap-10 md:grid-cols-[1fr_auto] lg:gap-16">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-leaf-600">Recorre la casa</p>
          <h2 className="text-3xl leading-tight md:text-4xl">Un mundo de diversión. Tu fiesta, a tu manera.</h2>
          <p className="mt-4 max-w-lg text-bark-500">
            Mira en 15 segundos lo que encontrarán tus invitados. Todo esto es para tu evento, sin compartir con nadie.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-leaf-700 text-lime-300">
                  <Icon name={p.icon} className="size-4.5" />
                </span>
                <span className="font-medium">{p.text}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => startQuote({}, 'video_tour')}
            className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-leaf-700 px-7 font-bold text-white shadow-soft transition hover:bg-leaf-900"
          >
            Agenda tu fecha <Icon name="arrowRight" className="size-4.5" />
          </button>
        </div>

        <div className="relative mx-auto w-[15.5rem] sm:w-[17rem]">
          <div className="absolute -inset-8 -z-0 rounded-full bg-lime-300/40 blur-3xl" />
          <div className="relative rounded-[2.6rem] bg-leaf-950 p-2.5 shadow-lift">
            <div className="absolute left-1/2 top-4 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-leaf-950" />
            <video
              ref={ref}
              src={asset('video/recorrido.mp4')}
              poster={asset('video/recorrido-poster.webp')}
              muted
              loop
              playsInline
              preload="none"
              aria-label="Recorrido en video por La Casa del Árbol"
              className="aspect-[9/16] w-full rounded-[2.1rem] bg-leaf-900 object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
