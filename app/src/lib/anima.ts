/** Puerta pública de ANIMA COMPANY (módulo Eventos).
 *
 *  La Casa del Árbol administra sus reservas en ANIMA COMPANY. La web habla con
 *  la Edge Function `eventos-publico` de COMPANY; la clave que se manda es la
 *  publishable de COMPANY (pública por diseño: no ejecuta nada por sí sola).
 *
 *  Corte sin riesgo: al cargar, la web pide el catálogo a COMPANY. Si responde,
 *  TODO (catálogo, disponibilidad, solicitudes y estado) va a COMPANY durante esa
 *  visita. Si no responde —por ejemplo, mientras la web pública está apagada en
 *  COMPANY— la web sigue usando su base anterior, como hasta hoy. */
import type { AvailabilityRow } from './types'

const URL =
  (import.meta.env.VITE_ANIMA_EVENTOS_URL as string | undefined) ||
  'https://sraphjbllkxhuuzydfkb.supabase.co/functions/v1/eventos-publico'
const KEY =
  (import.meta.env.VITE_ANIMA_PUBLISHABLE_KEY as string | undefined) || 'sb_publishable_x6IwGXVffsLQlv4akYmQ6Q_AwbgzZAZ'
const EMPRESA = (import.meta.env.VITE_ANIMA_EMPRESA as string | undefined) || 'casa-del-arbol'
/** VITE_ANIMA_DESACTIVADO=1 obliga a usar la base anterior (para volver atrás sin tocar código). */
const DESACTIVADO = (import.meta.env.VITE_ANIMA_DESACTIVADO as string | undefined) === '1'

let activo = false
/** true cuando esta visita está usando ANIMA COMPANY. */
export const animaActivo = () => activo

export interface Resultado<T> {
  data: T | null
  error: { message: string } | null
}

async function llamar<T>(cuerpo: Record<string, unknown>, ms = 6000): Promise<Resultado<T>> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: KEY },
      body: JSON.stringify({ empresa: EMPRESA, ...cuerpo }),
      signal: ctrl.signal,
    })
    const j = (await r.json().catch(() => null)) as { ok?: boolean; data?: T; error?: string } | null
    if (j?.ok) return { data: (j.data ?? null) as T | null, error: null }
    return { data: null, error: { message: String(j?.error ?? `HTTP ${r.status}`) } }
  } catch (e) {
    return { data: null, error: { message: (e as Error).message || 'sin respuesta' } }
  } finally {
    clearTimeout(t)
  }
}

export interface CatalogoAnima {
  settings: Record<string, unknown>
  event_types: Record<string, unknown>[]
  time_slots: Record<string, unknown>[]
  packages: (Record<string, unknown> & { package_services: Record<string, unknown>[] })[]
  addons: Record<string, unknown>[]
  faqs: Record<string, unknown>[]
}

/** Pide el catálogo y, si llega, deja esta visita en modo ANIMA. */
export async function catalogoAnima(): Promise<CatalogoAnima | null> {
  if (DESACTIVADO) return null
  const r = await llamar<CatalogoAnima>({ accion: 'catalogo' }, 3500)
  activo = !!(r.data && r.data.packages?.length && r.data.time_slots?.length)
  return activo ? r.data : null
}

export const disponibilidadAnima = (desde: string, hasta: string) =>
  llamar<AvailabilityRow[]>({ accion: 'disponibilidad', desde, hasta }, 4000)

export const solicitarAnima = (payload: Record<string, unknown>) => llamar<Record<string, unknown>>({ accion: 'solicitar', payload }, 8000)

export const reservaAnima = (codigo: string) => llamar<Record<string, unknown> | null>({ accion: 'reserva', codigo })
