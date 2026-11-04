import { asset } from '../../lib/asset'

/** Identidad de La Casa del Árbol · Los Castaños (Chiguayante).
 *
 *  Logo oficial: el follaje con "LA CASA DEL ÁRBOL · LOS CASTAÑOS" sobre una
 *  placa celeste (tomado del reel de la marca, app/public/brand/logo.webp).
 *  Paleta: verde bosque #17422F, verde hoja #2F6B45, lima #E0F890,
 *  celeste #DAF6FA, crema #FDFAF5 y dorado #E8A33D.
 *  Tipografías: Fraunces (títulos) e Inter (texto). */

export function LogoMark({ className = 'size-10' }: { className?: string }) {
  return (
    <img
      src={asset('brand/logo-256.webp')}
      alt="La Casa del Árbol · Los Castaños"
      width={256}
      height={256}
      className={`shrink-0 rounded-[22%] object-cover shadow-soft ${className}`}
    />
  )
}

export function Logo({
  tone = 'dark',
  subtitle = 'Los Castaños · Chiguayante',
  className = '',
  compact = false,
}: {
  tone?: 'dark' | 'light'
  subtitle?: string | null
  className?: string
  compact?: boolean
}) {
  const main = tone === 'light' ? 'text-cream-50' : 'text-leaf-900'
  const sub = tone === 'light' ? 'text-lime-300/80' : 'text-leaf-600'
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={compact ? 'size-11' : 'size-12'} />
      <span className="leading-none">
        <span className={`block font-display text-[1.08rem] font-semibold tracking-tight ${main}`}>La Casa del Árbol</span>
        {subtitle && (
          <span className={`mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.18em] ${sub}`}>{subtitle}</span>
        )}
      </span>
    </span>
  )
}
