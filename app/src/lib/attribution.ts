/** Guarda de dónde viene la visita (anuncio de Meta, Instagram, Google…)
 *  para que la cotización que llega a WhatsApp diga qué campaña la trajo. */

const KEY = 'lca309-attribution'
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const

export type Attribution = Partial<Record<(typeof PARAMS)[number] | 'landing' | 'referrer', string>>

export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    const found: Attribution = {}
    for (const p of PARAMS) {
      const v = url.searchParams.get(p)
      if (v) found[p] = v.slice(0, 120)
    }
    // Solo se pisa la atribución guardada si esta visita trae parámetros nuevos.
    if (Object.keys(found).length || !localStorage.getItem(KEY)) {
      found.landing = url.pathname
      if (document.referrer) found.referrer = document.referrer.slice(0, 120)
      localStorage.setItem(KEY, JSON.stringify({ ...found, at: Date.now() }))
    }
  } catch {
    /* almacenamiento bloqueado: no es crítico */
  }
}

export function getAttribution(): Attribution {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Attribution) : {}
  } catch {
    return {}
  }
}

/** Texto corto y legible: "Meta Ads · campaña cumple-nov". */
export function sourceLabel(a: Attribution = getAttribution()): string | null {
  const src = (a.utm_source ?? '').toLowerCase()
  let label: string | null = null
  if (a.fbclid || ['facebook', 'fb', 'instagram', 'ig', 'meta'].some((s) => src.includes(s))) label = 'Meta Ads'
  else if (a.gclid || src.includes('google')) label = 'Google'
  else if (a.utm_source) label = a.utm_source
  else if (a.referrer?.includes('instagram')) label = 'Instagram'
  else if (a.referrer?.includes('facebook')) label = 'Facebook'
  if (!label) return null
  return a.utm_campaign ? `${label} · ${a.utm_campaign}` : label
}
