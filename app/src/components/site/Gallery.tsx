import { useState } from 'react'
import { useSiteData } from '../../hooks/useSiteData'
import { asset } from '../../lib/asset'
import { Icon } from '../ui/Icon'
import { Section } from '../ui/Primitives'

export function Gallery() {
  const { gallery, settings } = useSiteData()
  const [active, setActive] = useState<number | null>(null)
  if (!gallery.length) return null

  return (
    <Section
      id="galeria"
      eyebrow="El lugar"
      title="Conoce la casa"
      subtitle={settings?.about ?? undefined}
      tone="white"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {gallery.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2 md:col-span-2' : ''}`}
          >
            <img
              src={asset(img.url)}
              alt={img.alt ?? ''}
              loading="lazy"
              className="aspect-square size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {img.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bark-900/70 to-transparent p-3 text-left text-sm font-semibold text-cream-50">
                {img.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-bark-900/90 p-4"
          onClick={() => setActive(null)}
          role="presentation"
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-cream-50/10 p-2.5 text-cream-50"
            aria-label="Cerrar"
            onClick={() => setActive(null)}
          >
            <Icon name="x" />
          </button>
          <img
            src={asset(gallery[active].url)}
            alt={gallery[active].alt ?? ''}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </Section>
  )
}
