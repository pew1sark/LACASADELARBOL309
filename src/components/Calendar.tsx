import { useMemo, useState } from 'react'
import { useAvailability, type DayAvailability } from '../hooks/useAvailability'
import { monthName, toISO } from '../lib/format'
import { Icon } from './ui/Icon'
import { Spinner } from './ui/Primitives'
import type { SlotStatus } from '../lib/types'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const DOT: Record<SlotStatus, string> = {
  available: 'bg-leaf-500',
  pending: 'bg-sun-400',
  reserved: 'bg-terra-500',
  blocked: 'bg-bark-500',
  closed: 'bg-transparent',
  too_soon: 'bg-transparent',
}

const CELL: Record<SlotStatus, string> = {
  available: 'text-bark-900 hover:border-leaf-600 hover:bg-leaf-50 cursor-pointer border-bark-900/10 bg-white',
  pending: 'text-bark-900 hover:border-sun-400 hover:bg-sun-100/60 cursor-pointer border-bark-900/10 bg-white',
  reserved: 'text-bark-500/60 border-transparent bg-cream-100 cursor-not-allowed',
  blocked: 'text-bark-500/60 border-transparent bg-cream-100 cursor-not-allowed',
  closed: 'text-bark-500/35 border-transparent bg-transparent cursor-not-allowed',
  too_soon: 'text-bark-500/35 border-transparent bg-transparent cursor-not-allowed',
}

export const isSelectable = (s?: SlotStatus) => s === 'available' || s === 'pending'

interface Props {
  value: string | null
  onSelect: (date: string, day: DayAvailability) => void
  /** El panel de administración puede seleccionar cualquier día. */
  adminMode?: boolean
  onMonthChange?: (month: Date) => void
}

export function Calendar({ value, onSelect, adminMode = false, onMonthChange }: Props) {
  const today = new Date()
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const { days, loading } = useAvailability(month)

  const move = (delta: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
    setMonth(next)
    onMonthChange?.(next)
  }

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const offset = (first.getDay() + 6) % 7 // semana que parte en lunes
    const out: (string | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= total; d++) {
      out.push(toISO(new Date(month.getFullYear(), month.getMonth(), d)))
    }
    return out
  }, [month])

  const atStart = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()

  return (
    <div className="rounded-2xl border border-bark-900/8 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => move(-1)}
          disabled={atStart}
          aria-label="Mes anterior"
          className="rounded-full p-2 text-bark-700 transition hover:bg-cream-100 disabled:opacity-25"
        >
          <Icon name="chevronLeft" />
        </button>
        <p className="flex items-center gap-2 text-base font-semibold capitalize">
          {monthName(month.getMonth())} {month.getFullYear()}
          {loading && <Spinner className="size-4 text-leaf-600" />}
        </p>
        <button
          onClick={() => move(1)}
          aria-label="Mes siguiente"
          className="rounded-full p-2 text-bark-700 transition hover:bg-cream-100"
        >
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="py-1 text-center text-[0.7rem] font-bold uppercase tracking-wide text-bark-500">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`e${i}`} />
          const day = days[iso]
          const past = iso < toISO(today)
          const status: SlotStatus = day?.status ?? (past ? 'too_soon' : 'closed')
          const enabled = adminMode ? true : isSelectable(status)
          const selected = value === iso
          const dayNum = Number(iso.slice(-2))
          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => day && onSelect(iso, day)}
              aria-label={`${dayNum} — ${past ? 'fecha pasada' : LABEL[status]}`}
              aria-pressed={selected}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
                selected
                  ? 'border-leaf-700 bg-leaf-700 text-white shadow-soft'
                  : CELL[status]
              }`}
            >
              {dayNum}
              {!selected && (
                <span className={`mt-1 block size-1.5 rounded-full ${DOT[status]}`} />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-bark-900/8 pt-4 text-xs text-bark-500">
        <Legend color="bg-leaf-500" label="Disponible" />
        <Legend color="bg-sun-400" label="Con solicitud" />
        <Legend color="bg-terra-500" label="Reservado" />
        <Legend color="bg-bark-500" label="No disponible" />
      </div>
    </div>
  )
}

const LABEL: Record<SlotStatus, string> = {
  available: 'disponible',
  pending: 'con solicitud pendiente',
  reserved: 'reservado',
  blocked: 'bloqueado',
  closed: 'cerrado',
  too_soon: 'fuera de plazo',
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} /> {label}
    </span>
  )
}
