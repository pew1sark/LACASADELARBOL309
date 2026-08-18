/** Capa de analítica agnóstica: funciona con Google Analytics, Google Tag
 *  Manager y Meta Pixel, y no rompe nada si ninguno está configurado. */
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export type TrackEvent =
  | 'view_package'
  | 'calendar_open'
  | 'date_selected'
  | 'reservation_started'
  | 'reservation_step'
  | 'reservation_submitted'
  | 'whatsapp_clicked'
  | 'reservation_confirmed'
  | 'status_checked'

export function track(event: TrackEvent, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return
  window.dataLayer?.push({ event, ...params })
  window.gtag?.('event', event, params)
  if (event === 'reservation_submitted') window.fbq?.('track', 'Lead', params)
  if (event === 'whatsapp_clicked') window.fbq?.('track', 'Contact', params)
  if (import.meta.env.DEV) console.debug('[track]', event, params)
}

let loaded = false

/** Carga los scripts de medición solo si hay IDs configurados. */
export function initAnalytics(): void {
  if (loaded || typeof document === 'undefined') return
  loaded = true

  const ga = import.meta.env.VITE_GA_ID
  const gtm = import.meta.env.VITE_GTM_ID
  const pixel = import.meta.env.VITE_META_PIXEL_ID

  if (gtm) {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtm.js?id=${gtm}`
    document.head.appendChild(s)
    window.dataLayer?.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  }

  if (ga) {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`
    document.head.appendChild(s)
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', ga)
  }

  if (pixel) {
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
    const queue: unknown[][] = []
    window.fbq = (...args: unknown[]) => queue.push(args)
    s.onload = () => {
      const fbq = window.fbq
      if (!fbq) return
      fbq('init', pixel)
      fbq('track', 'PageView')
      queue.forEach((args) => fbq(...args))
    }
  }
}
