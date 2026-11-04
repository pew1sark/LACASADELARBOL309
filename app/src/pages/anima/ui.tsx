import type { ReactNode } from 'react'

/** Piezas visuales de la consola ANIMA COMPANY (tinta negra + dorado). */

export function AnimaMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-label="ANIMA">
      <rect width="40" height="40" rx="11" fill="#111111" />
      <path d="M20 9 30.5 31h-4.2l-2.2-4.9h-8.2L13.7 31H9.5L20 9Zm0 8.6-2.8 6.2h5.6L20 17.6Z" fill="#d0aa63" />
    </svg>
  )
}

export function Page({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-anima-ink md:text-[1.75rem]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-anima-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  )
}

export function Panel({ title, children, className = '', right }: { title?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-anima-line bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-anima-line px-5 py-3.5">
          <h2 className="font-sans text-sm font-bold uppercase tracking-[0.12em] text-anima-ink2">{title}</h2>
          {right}
        </div>
      )}
      <div className={title ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function Kpi({ label, value, hint, tone = 'ink' }: { label: string; value: string; hint?: string; tone?: 'ink' | 'gold' | 'ok' | 'danger' }) {
  const color = { ink: 'text-anima-ink', gold: 'text-anima-gold-deep', ok: 'text-anima-ok', danger: 'text-anima-danger' }[tone]
  return (
    <div className="rounded-2xl border border-anima-line bg-white p-4">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-anima-muted">{label}</p>
      <p className={`mt-1.5 font-sans text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-anima-muted">{hint}</p>}
    </div>
  )
}

export function Btn({ children, onClick, variant = 'ink', disabled, type = 'button' }: {
  children: ReactNode
  onClick?: () => void
  variant?: 'ink' | 'gold' | 'line'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const v = {
    ink: 'bg-anima-ink text-white hover:bg-anima-ink2',
    gold: 'bg-anima-gold text-anima-ink hover:brightness-95',
    line: 'border border-anima-line bg-white text-anima-ink hover:border-anima-gold',
  }[variant]
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition disabled:opacity-50 ${v}`}>
      {children}
    </button>
  )
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'ok' | 'gold' | 'danger' | 'ink' }) {
  const t = {
    muted: 'bg-anima-bg text-anima-muted',
    ok: 'bg-[#e4f1e9] text-anima-ok',
    gold: 'bg-[#f6ecd8] text-anima-gold-deep',
    danger: 'bg-[#f6e1e1] text-anima-danger',
    ink: 'bg-anima-ink text-white',
  }[tone]
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t}`}>{children}</span>
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-anima-line bg-white">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <thead className="border-b border-anima-line bg-anima-bg text-[0.7rem] uppercase tracking-[0.1em] text-anima-muted">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-anima-line">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-center text-sm text-anima-muted">Sin registros todavía.</p>}
    </div>
  )
}

export function Bars({ data }: { data: { label: string; value: number; display?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex h-44 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[0.65rem] font-semibold text-anima-ink2">{d.display ?? d.value}</span>
          <div className="w-full rounded-t-md bg-anima-ink" style={{ height: `${Math.max(3, (d.value / max) * 130)}px` }} />
          <span className="text-[0.65rem] uppercase text-anima-muted">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Share({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-anima-ink">{d.label}</span>
            <span className="text-anima-muted">{d.value} · {Math.round((d.value / total) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-anima-bg">
            <div className="h-full rounded-full bg-anima-gold" style={{ width: `${(d.value / total) * 100}%` }} />
          </div>
        </li>
      ))}
      {!data.length && <li className="text-sm text-anima-muted">Sin datos en el período.</li>}
    </ul>
  )
}
