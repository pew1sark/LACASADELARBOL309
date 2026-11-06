import { useEffect, useState } from 'react'
import { track } from '../../lib/analytics'
import { asset } from '../../lib/asset'
import { miniatura } from '../../lib/fallback'
import { CATALOGO } from '../../lib/spaces'
import { Icon } from '../ui/Icon'

/** Catálogo fotográfico completo del espacio (pack 2 + celebraciones del pack 1) con visor y descarga
 *  del catálogo en PDF. Fotos reales editadas: nada agregado ni quitado. */
export function Catalogo() {
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
      if (e.key === 'ArrowRight') setActive((i) => (i === null ? i : (i + 1) % CATALOGO.length))
      if (e.key === 'ArrowLeft') setActive((i) => (i === null ? i : (i - 1 + CATALOGO.length) % CATALOGO.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const foto = active === null ? null : CATALOGO[active]

  return (
    <section id="catalogo" className="scroll-mt-20 bg-white py-16 md:py-24">
      <div className="container-x">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-leaf-600">Catálogo del espacio</p>
          <h2 className="text-3xl leading-tight md:text-4xl">Así es la casa, rincón por rincón</h2>
          <p className="mt-4 text-bark-500">
            Fotos reales de la casa. Lo que ves es lo que arriendas: el espacio completo, solo para tu evento.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {CATALOGO.map((f, i) => (
            <button
              key={f.image}
              type="button"
              onClick={() => {
                setActive(i)
                track('view_package', { source: 'catalogo', foto: f.title })
              }}
              className={`group relative overflow-hidden rounded-2xl bg-cream-100 text-left ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
              <img
                src={asset(i === 0 ? f.image : miniatura(f.image))}
                alt={f.title}
                loading="lazy"
                className="aspect-[3/4] size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-leaf-950/80 to-transparent p-3 pt-10 text-sm font-semibold text-cream-50">
                {f.title}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={asset('catalogo/la-casa-del-arbol-309-catalogo.pdf')}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => track('quote_cta_clicked', { source: 'catalogo-pdf' })}
            className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-leaf-700 px-6 font-bold text-leaf-700 transition hover:bg-leaf-50"
          >
            <Icon name="clipboard" className="size-5" /> Descargar catálogo (PDF)
          </a>
        </div>
      </div>

      {foto && (
        <div
          className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-bark-900/95 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={foto.title}
        >
          <button className="absolute right-4 top-4 rounded-full bg-cream-50/10 p-2.5 text-cream-50" aria-label="Cerrar" onClick={() => setActive(null)}>
            <Icon name="x" />
          </button>
          <img src={asset(foto.image)} alt={foto.title} className="max-h-[78vh] max-w-full rounded-2xl object-contain" />
          <p className="mt-4 text-center text-cream-50">
            <strong className="font-display text-xl">{foto.title}</strong>
            <span className="block text-sm text-cream-200">{foto.text}</span>
          </p>
          <div className="mt-3 flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button className="rounded-full bg-cream-50/10 p-2.5 text-cream-50" aria-label="Anterior" onClick={() => setActive(((active ?? 0) - 1 + CATALOGO.length) % CATALOGO.length)}>
              <Icon name="chevronLeft" />
            </button>
            <button className="rounded-full bg-cream-50/10 p-2.5 text-cream-50" aria-label="Siguiente" onClick={() => setActive(((active ?? 0) + 1) % CATALOGO.length)}>
              <Icon name="chevronRight" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
