import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toISO } from '../lib/format'
import type { AvailabilityRow, SlotStatus, TimeSlot } from '../lib/types'
import { useSiteData } from './useSiteData'

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

/** Disponibilidad estimada a partir de los horarios cuando la base no
 *  responde: la confirmación final siempre la da el equipo por WhatsApp. */
function localAvailability(from: string, to: string, slots: TimeSlot[], leadDays: number): AvailabilityRow[] {
  const out: AvailabilityRow[] = []
  const min = new Date()
  min.setHours(0, 0, 0, 0)
  min.setDate(min.getDate() + leadDays)
  const [fy, fm, fd] = from.split('-').map(Number)
  const end = to
  for (let d = new Date(fy, fm - 1, fd); toISO(d) <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISO(d)
    for (const s of slots) {
      if (s.active === false) continue
      const open = (s.weekdays ?? []).includes(d.getDay())
      out.push({
        day: iso,
        slot_id: s.id,
        slot_name: s.name,
        start_time: s.start_time,
        end_time: s.end_time,
        status: d < min ? 'too_soon' : open ? 'available' : 'closed',
      })
    }
  }
  return out
}

/** Carga la disponibilidad del mes visible desde la función get_availability. */
export function useAvailability(month: Date) {
  const [days, setDays] = useState<Record<string, DayAvailability>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { slots, settings, offline, loading: siteLoading } = useSiteData()

  const from = toISO(new Date(month.getFullYear(), month.getMonth(), 1))
  const to = toISO(new Date(month.getFullYear(), month.getMonth() + 1, 0))

  const load = useCallback(async () => {
    if (siteLoading) return
    setLoading(true)
    let data: AvailabilityRow[] | null = null
    if (!offline) {
      const res = await Promise.race([
        supabase.rpc('get_availability', { p_from: from, p_to: to }).then((r) => r, () => null),
        new Promise<null>((r) => setTimeout(() => r(null), 4000)),
      ])
      if (res && !res.error) data = (res.data ?? []) as AvailabilityRow[]
      else setError(res?.error?.message ?? 'timeout')
    }
    if (!data) data = localAvailability(from, to, slots, settings?.lead_time_days ?? 3)
    const map: Record<string, DayAvailability> = {}
    for (const row of data) {
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
  }, [from, to, siteLoading, offline, slots, settings?.lead_time_days])

  useEffect(() => {
    void load()
  }, [load])

  return { days, loading, error, reload: load }
}
