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
import { getAttribution } from './attribution'

const ENDPOINT =
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
    const r = await fetch(ENDPOINT, {
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

/* ------------------------------------------------------------------ medición
   Lo que la pestaña «Web» de ANIMA COMPANY muestra: visitas, el embudo de
   reserva y los errores de JavaScript. SIN datos personales: un id de sesión
   aleatorio (vive solo en esta pestaña), la página, la fuente/campaña (utm) y
   el tipo de dispositivo. Se envía en lotes y nunca bloquea la página. */

const SESION_KEY = 'lca309-anima-sesion'
const cola: Record<string, string | undefined>[] = []
let temporizador: ReturnType<typeof setTimeout> | null = null
let errores = 0

function sesion(): string {
  try {
    let s = sessionStorage.getItem(SESION_KEY)
    if (!s) {
      s = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20)
      sessionStorage.setItem(SESION_KEY, s)
    }
    return s
  } catch {
    return 'sinalmacen' + Math.random().toString(36).slice(2, 12)
  }
}
function dispositivo(): 'mobile' | 'tablet' | 'desktop' {
  const w = Math.min(window.innerWidth || 1024, screen?.width || 1024)
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'
}
function fuente(): string | undefined {
  const a = getAttribution()
  if (a.utm_source) return a.utm_source
  if (a.fbclid) return 'facebook'
  if (a.gclid) return 'google'
  const r = a.referrer || document.referrer
  if (!r) return undefined
  try { return new URL(r).hostname.replace(/^www\./, '').replace(/^l\.|^lm\.|^m\./, '') } catch { return undefined }
}

function enviar() {
  temporizador = null
  if (DESACTIVADO || !cola.length) return
  const eventos = cola.splice(0, 30)
  void fetch(ENDPOINT, {
    method: 'POST',
    keepalive: true,
    headers: { 'content-type': 'application/json', apikey: KEY },
    body: JSON.stringify({ empresa: EMPRESA, accion: 'eventos', eventos }),
  }).catch(() => { /* la medición nunca rompe la web */ })
  if (cola.length) temporizador = setTimeout(enviar, 500)
}

/** Agrega un evento a la cola; se envía en ~2 s o al ocultar la página. */
export function medir(event: string, extra: { detail?: string } = {}): void {
  if (typeof window === 'undefined' || DESACTIVADO) return
  if (location.pathname.includes('/admin')) return // el panel antiguo no se mide
  const a = getAttribution()
  cola.push({
    session_id: sesion(), event, path: location.pathname.slice(0, 200),
    source: fuente()?.toLowerCase().slice(0, 60), campaign: a.utm_campaign?.slice(0, 120),
    device: dispositivo(), detail: extra.detail?.slice(0, 300),
  })
  if (cola.length >= 20) enviar()
  else if (!temporizador) temporizador = setTimeout(enviar, 2000)
}

/** Errores de JavaScript (máximo 5 por visita, solo el mensaje). */
export function iniciarMedicionAnima(): void {
  if (typeof window === 'undefined' || DESACTIVADO) return
  const registrar = (msg: string) => { if (errores++ < 5) medir('js_error', { detail: msg }) }
  window.addEventListener('error', (e) => registrar(String(e.message || 'Error')))
  window.addEventListener('unhandledrejection', (e) => registrar(String((e.reason as Error)?.message ?? e.reason ?? 'Promesa rechazada')))
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') enviar() })
}
