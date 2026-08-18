import { useState } from 'react'
import { useSiteData } from '../../hooks/useSiteData'
import { Icon } from '../ui/Icon'
import { Section } from '../ui/Primitives'

export function Faq() {
  const { faqs } = useSiteData()
  const [open, setOpen] = useState<string | null>(null)
  if (!faqs.length) return null

  return (
    <Section id="preguntas" eyebrow="Preguntas frecuentes" title="Antes de reservar">
      <div className="mx-auto max-w-3xl divide-y divide-bark-900/8 overflow-hidden rounded-2xl border border-bark-900/8 bg-white shadow-soft">
        {faqs.map((f) => {
          const isOpen = open === f.id
          return (
            <div key={f.id}>
              <button
                onClick={() => setOpen(isOpen ? null : f.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-cream-50"
              >
                <span className="font-semibold">{f.question}</span>
                <Icon
                  name="chevronDown"
                  className={`size-4.5 shrink-0 text-bark-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-5 text-sm leading-relaxed text-bark-500">{f.answer}</p>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}
