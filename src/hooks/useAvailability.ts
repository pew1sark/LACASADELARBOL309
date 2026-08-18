import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toISO } from '../lib/format'
import type { AvailabilityRow, SlotStatus } from '../lib/types'

export interface DayAvailability {
  date: string
  slots: { id: string; name: string; start: string; end: string; status: SlotStatus }[]
  status: SlotStatus
}

const PRIORITY: SlotStatus[] = ['available', 'pending', 'reserved', 'blocked', 'closed', 'too_soon']

function rollup(slots: DayAvailability['slots']): SlotStatus {
  for (const s of PRIORITY) if (slots.some((x) => x.status === s)) return s
  return 'closed'
}

/** Carga la disponibilidad del mes visible desde la función get_availability. */
export function useAvailability(month: Date) {
  const [days, setDays] = useState<Record<string, DayAvailability>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const from = toISO(new Date(month.getFullYear(), month.getMonth(), 1))
  const to = toISO(new Date(month.getFullYear(), month.getMonth() + 1, 0))

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_availability', { p_from: from, p_to: to })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const map: Record<string, DayAvailability> = {}
    for (const row of (data ?? []) as AvailabilityRow[]) {
      const key = row.day
      map[key] ??= { date: key, slots: [], status: 'closed' }
      map[key].slots.push({
        id: row.slot_id,
        name: row.slot_name,
        start: row.start_time.slice(0, 5),
        end: row.end_time.slice(0, 5),
        status: row.status,
      })
    }
    Object.values(map).forEach((d) => {
      d.status = rollup(d.slots)
    })
    setDays(map)
    setError(null)
    setLoading(false)
  }, [from, to])

  useEffect(() => {
    void load()
  }, [load])

  return { days, loading, error, reload: load }
}
