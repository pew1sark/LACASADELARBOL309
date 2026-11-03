/** Misma fórmula que public.package_quote en la base de datos. El navegador
 *  la usa para mostrar el total en vivo; el valor definitivo lo calcula el
 *  servidor al registrar la solicitud. */
import { parseDate } from './format'
import type { Package, TimeSlot } from './types'

export interface PackageQuote {
  weekend: boolean
  base: number
  extraGuests: number
  extraGuestPrice: number
  extraGuestsTotal: number
  slotSurcharge: number
  total: number
}

export const DEFAULT_WEEKEND_DAYS = [5, 6]

export function quotePackage(
  pkg: Package | null,
  opts: { date?: string | null; guests: number; slot?: Pick<TimeSlot, 'surcharge'> | null; weekendDays?: number[] },
): PackageQuote {
  const weekendDays = opts.weekendDays ?? DEFAULT_WEEKEND_DAYS
  const weekend = opts.date ? weekendDays.includes(parseDate(opts.date).getDay()) : false
  if (!pkg) {
    return { weekend, base: 0, extraGuests: 0, extraGuestPrice: 0, extraGuestsTotal: 0, slotSurcharge: 0, total: 0 }
  }
  const base = Number(weekend && pkg.weekend_price != null ? pkg.weekend_price : pkg.price)
  const included = pkg.included_guests ?? opts.guests
  const extraGuests = Math.max(opts.guests - included, 0)
  const extraGuestPrice = Number(pkg.extra_guest_price ?? 0)
  const extraGuestsTotal = extraGuests * extraGuestPrice
  const slotSurcharge = Number(opts.slot?.surcharge ?? 0)
  return {
    weekend,
    base,
    extraGuests,
    extraGuestPrice,
    extraGuestsTotal,
    slotSurcharge,
    total: base + extraGuestsTotal + slotSurcharge,
  }
}

export const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
