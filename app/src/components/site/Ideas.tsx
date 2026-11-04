import { asset } from '../../lib/asset'
import { IDEAS } from '../../lib/spaces'
import { startQuote } from '../../lib/quote'

/** "Imagina su cumpleaños": ambientaciones reales hechas en la casa. */
export function Ideas() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container-x">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-leaf-600">Ideas de ambientación</p>
          <h2 className="text-3xl leading-tight md:text-4xl">Imagina su cumpleaños</h2>
          <p className="mt-4 text-bark-500">Una fiesta a su estilo. Suma decoración, mesa dulce o temática al cotizar.</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-3">
          {IDEAS.map((idea) => (
            <button
              key={idea.title}
              type="button"
              onClick={() => startQuote({}, `idea:${idea.title}`)}
              className="group relative overflow-hidden rounded-3xl text-left shadow-soft"
            >
              <img src={asset(idea.image)} alt={idea.title} loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-leaf-950/85 via-transparent to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-5 text-cream-50">
                <span className="block font-display text-2xl">{idea.title}</span>
                <span className="text-sm text-lime-200">{idea.text}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
