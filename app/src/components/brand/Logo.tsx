/** Identidad de La Casa del Árbol 309.
 *
 *  Isotipo: una copa de árbol de tres círculos que abraza una casita con techo
 *  dorado. Colores: verde hoja (#2F6B45 / #4E9E68), crema (#FDFAF5), madera
 *  (#5A3E2B) y sol (#E8A33D). Tipografías: Fraunces (títulos) e Inter (texto).
 *  Se usa igual en el sitio, el panel, el favicon y la imagen para redes. */

export function LogoMark({ className = 'size-10', mono = false }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="La Casa del Árbol 309">
      <rect width="64" height="64" rx="16" fill={mono ? 'currentColor' : '#2F6B45'} />
      <g fill={mono ? '#fff' : undefined} opacity={mono ? 0.9 : 1}>
        <circle cx="32" cy="22" r="13" fill={mono ? undefined : '#4E9E68'} />
        <circle cx="20.5" cy="28" r="9.5" fill={mono ? undefined : '#3F8556'} />
        <circle cx="43.5" cy="28" r="9.5" fill={mono ? undefined : '#3F8556'} />
      </g>
      <rect x="29.5" y="36" width="5" height="18" rx="2.5" fill={mono ? '#fff' : '#8A6A52'} />
      <path d="M21 37.5 32 29.5l11 8Z" fill={mono ? '#fff' : '#E8A33D'} />
      <rect x="23" y="37" width="18" height="11" rx="2" fill={mono ? '#fff' : '#FDFAF5'} />
      <rect x="29.6" y="41" width="4.8" height="7" rx="1.2" fill={mono ? 'currentColor' : '#5A3E2B'} />
      <circle cx="26.3" cy="41.3" r="1.4" fill={mono ? 'currentColor' : '#E8A33D'} />
    </svg>
  )
}

export function Logo({
  tone = 'dark',
  subtitle = 'Casa de eventos',
  className = '',
  compact = false,
}: {
  tone?: 'dark' | 'light'
  subtitle?: string | null
  className?: string
  compact?: boolean
}) {
  const main = tone === 'light' ? 'text-cream-50' : 'text-bark-900'
  const sub = tone === 'light' ? 'text-cream-200/70' : 'text-bark-500'
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={compact ? 'size-9' : 'size-10'} />
      <span className="leading-none">
        <span className={`block font-display text-[1.02rem] font-semibold tracking-tight ${main}`}>
          La Casa del Árbol <span className="text-sun-400">309</span>
        </span>
        {subtitle && (
          <span className={`mt-1 block text-[0.64rem] font-semibold uppercase tracking-[0.2em] ${sub}`}>{subtitle}</span>
        )}
      </span>
    </span>
  )
}
