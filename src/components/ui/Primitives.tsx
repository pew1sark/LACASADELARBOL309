import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

/* ---------------------------------- Button --------------------------------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'whatsapp' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-leaf-700 text-white hover:bg-leaf-900 active:bg-leaf-900 shadow-soft disabled:bg-leaf-300',
  secondary:
    'bg-sun-400 text-bark-900 hover:bg-sun-600 hover:text-white shadow-soft disabled:opacity-50',
  outline:
    'border border-bark-900/15 bg-white text-bark-900 hover:border-leaf-700 hover:text-leaf-700',
  ghost: 'text-bark-900 hover:bg-bark-900/5',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1EBE5B] shadow-soft',
  danger: 'bg-terra-500 text-white hover:bg-terra-400',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
}

const base =
  'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
}

export function Button({ variant = 'primary', size = 'md', full, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`${base} ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  )
}

interface LinkButtonProps {
  to: string
  variant?: Variant
  size?: Size
  full?: boolean
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function LinkButton({ to, variant = 'primary', size = 'md', full, className = '', children, onClick }: LinkButtonProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${base} ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </Link>
  )
}

/* ---------------------------------- Badge ---------------------------------- */
type Tone = 'green' | 'amber' | 'blue' | 'red' | 'gray' | 'cream'

const TONES: Record<Tone, string> = {
  green: 'bg-leaf-100 text-leaf-900',
  amber: 'bg-sun-100 text-sun-600',
  blue: 'bg-sky-100 text-sky-800',
  red: 'bg-terra-500/15 text-terra-500',
  gray: 'bg-bark-900/8 text-bark-500',
  cream: 'bg-cream-200 text-bark-700',
}

export function Badge({ tone = 'gray', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}

/* ----------------------------------- Card ---------------------------------- */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-bark-900/8 bg-white shadow-soft ${className}`}>
      {children}
    </div>
  )
}

/* --------------------------------- Section --------------------------------- */
export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
  tone = 'cream',
}: {
  id?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  tone?: 'cream' | 'white' | 'leaf'
}) {
  const bg =
    tone === 'white' ? 'bg-white' : tone === 'leaf' ? 'bg-leaf-900 text-cream-50' : 'bg-cream-50'
  return (
    <section id={id} className={`scroll-mt-20 py-16 md:py-24 ${bg} ${className}`}>
      <div className="container-x">
        {(eyebrow || title) && (
          <header className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            {eyebrow && (
              <p className={`mb-3 text-xs font-bold uppercase tracking-[0.18em] ${tone === 'leaf' ? 'text-sun-400' : 'text-leaf-600'}`}>
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-3xl leading-tight md:text-4xl">{title}</h2>}
            {subtitle && (
              <p className={`mt-4 text-base leading-relaxed ${tone === 'leaf' ? 'text-cream-200' : 'text-bark-500'}`}>
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}

/* ---------------------------------- Fields --------------------------------- */
const fieldBase =
  'w-full rounded-xl border border-bark-900/15 bg-white px-4 py-3 text-[0.95rem] text-bark-900 placeholder:text-bark-500/50 transition focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 disabled:bg-cream-100'

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-sm font-semibold text-bark-900">{children}</span>
      {hint && <span className="text-xs text-bark-500">{hint}</span>}
    </span>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string | null
}

export function Field({ label, hint, error, className = '', ...rest }: FieldProps) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <input className={`${fieldBase} ${error ? 'border-terra-500' : ''} ${className}`} {...rest} />
      {error && <span className="mt-1 block text-xs font-medium text-terra-500">{error}</span>}
    </label>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function TextArea({ label, hint, className = '', ...rest }: TextAreaProps) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <textarea className={`${fieldBase} min-h-24 resize-y ${className}`} {...rest} />
    </label>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

export function Select({ label, hint, className = '', children, ...rest }: SelectProps) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <select className={`${fieldBase} appearance-none bg-[length:1rem] pr-10 ${className}`} {...rest}>
        {children}
      </select>
    </label>
  )
}

/* --------------------------------- Spinner --------------------------------- */
export function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-label="Cargando">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function LoadingBlock({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-bark-500">
      <Spinner /> <span className="text-sm">{label}</span>
    </div>
  )
}

/* ---------------------------------- Modal ---------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-bark-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-cream-50 shadow-lift sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-bark-900/8 bg-cream-50/95 px-5 py-4 backdrop-blur">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-2 text-bark-500 transition hover:bg-bark-900/5"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
