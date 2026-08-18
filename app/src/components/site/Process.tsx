import { Icon, type IconName } from '../ui/Icon'
import { Section } from '../ui/Primitives'

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'calendar', title: 'Elige fecha y horario', text: 'Revisa el calendario en línea y selecciona el bloque que más te acomode.' },
  { icon: 'clipboard', title: 'Envía tu solicitud', text: 'Completa tus datos en dos minutos. No pagas nada en este paso.' },
  { icon: 'check', title: 'Confirmamos disponibilidad', text: 'Te escribimos por WhatsApp para confirmar tu fecha y horario.' },
  { icon: 'money', title: 'Abonas y queda reservado', text: 'Con el abono bloqueamos la fecha solo para ti. Listo para celebrar.' },
]

export function Process() {
  return (
    <Section
      eyebrow="Cómo funciona"
      title="Reservar es simple"
      subtitle="Cuatro pasos, sin llamadas eternas ni formularios interminables."
      tone="leaf"
    >
      <ol className="grid gap-6 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl border border-cream-50/12 bg-cream-50/5 p-6">
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-sun-400 text-bark-900">
              <Icon name={s.icon} />
            </span>
            <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-sun-400">
              Paso {i + 1}
            </span>
            <h3 className="text-lg text-cream-50">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-cream-200">{s.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
