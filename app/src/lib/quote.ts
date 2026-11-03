import { track } from './analytics'

/** Evento que precarga la agenda del landing (cotizador del hero, paquetes…). */
export const PREFILL_EVENT = 'lca309:prefill'
export interface PrefillDetail {
  eventSlug?: string
  packageSlug?: string
  guests?: number
}

/** Lleva al cliente a la agenda integrada en el landing, con lo que ya eligió
 *  precargado. Si la página no tiene agenda, abre /reservar. */
export function startQuote(detail: PrefillDetail = {}, source = 'cta', navigate?: (to: string) => void): void {
  track('quote_cta_clicked', { source, ...detail })
  const el = document.getElementById('agendar')
  if (!el) {
    const qs = new URLSearchParams()
    if (detail.eventSlug) qs.set('evento', detail.eventSlug)
    if (detail.packageSlug) qs.set('paquete', detail.packageSlug)
    if (detail.guests) qs.set('invitados', String(detail.guests))
    const to = `/reservar${qs.toString() ? `?${qs}` : ''}`
    if (navigate) navigate(to)
    else window.location.assign(`${import.meta.env.BASE_URL}${to.slice(1)}`)
    return
  }
  window.dispatchEvent(new CustomEvent(PREFILL_EVENT, { detail }))
  const y = el.getBoundingClientRect().top + window.scrollY - 72
  window.scrollTo({ top: y, behavior: 'smooth' })
}
