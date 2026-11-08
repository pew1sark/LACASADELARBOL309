import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { catalogoAnima } from '../lib/anima'
import type { Addon, EventType, Faq, GalleryImage, Package, Settings, TimeSlot } from '../lib/types'
import {
  FALLBACK_ADDONS,
  FALLBACK_EVENT_TYPES,
  FALLBACK_FAQS,
  FALLBACK_GALLERY,
  FALLBACK_PACKAGES,
  FALLBACK_SETTINGS,
  FALLBACK_SLOTS,
  INSTAGRAM_URL,
  realPhoto,
  resolveWhatsApp,
} from '../lib/fallback'

/** Tiempo máximo que el landing espera a la base antes de usar el respaldo. */
const TIMEOUT_MS = 3500

function withTimeout<T>(p: PromiseLike<T>): Promise<T | null> {
  return Promise.race([
    Promise.resolve(p).catch(() => null),
    new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS)),
  ])
}

type Res<T> = { data: T | null; error: { message: string } | null } | null
const rows = <T,>(r: Res<T[]>): T[] => (r && !r.error && r.data ? r.data : [])

interface SiteData {
  settings: Settings | null
  eventTypes: EventType[]
  /** Lo que se ofrece en la web pública (hoy: solo el arriendo a precio fijo). */
  packages: Package[]
  addons: Addon[]
  /** Catálogo completo de la base, para el panel de administración. */
  allPackages: Package[]
  allAddons: Addon[]
  gallery: GalleryImage[]
  faqs: Faq[]
  slots: TimeSlot[]
  loading: boolean
  error: string | null
  /** true cuando la base no respondió y se muestra el catálogo de respaldo:
   *  las solicitudes se envían directamente por WhatsApp. */
  offline: boolean
  reload: () => void
}

const Ctx = createContext<SiteData | null>(null)

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<SiteData, 'reload'>>({
    settings: null,
    eventTypes: [],
    packages: [],
    addons: [],
    allPackages: [],
    allAddons: [],
    gallery: [],
    faqs: [],
    slots: [],
    loading: true,
    error: null,
    offline: false,
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setState((s) => ({ ...s, loading: true }))
      // ANIMA COMPANY primero: si responde, el catálogo, los textos, la portada, la
      // galería y las reservas salen de ahí (se editan en ANIMA → Web → Contenido).
      const [anima, galeria] = await Promise.all([
        catalogoAnima(),
        withTimeout(supabase.from('gallery_images').select('*').order('sort_order')),
      ])
      const q = anima
        ? [
            { data: { id: 1, ...anima.settings }, error: null },
            { data: anima.event_types.map((e) => ({ long_description: null, active: true, ...e })), error: null },
            { data: anima.packages.map((p) => ({ active: true, ...p })), error: null },
            { data: anima.addons.map((a) => ({ active: true, ...a })), error: null },
            // Galería: la que se sube en ANIMA (pestaña Web → Contenido). Mientras
            // esté vacía, la web sigue con su galería de siempre.
            anima.gallery?.length
              ? { data: anima.gallery.map((g) => ({ active: true, ...g })), error: null }
              : galeria,
            { data: anima.faqs.map((f) => ({ active: true, ...f })), error: null },
            { data: anima.time_slots.map((t) => ({ active: true, ...t })), error: null },
          ]
        : await Promise.all([
        withTimeout(supabase.from('settings').select('*').eq('id', 1).maybeSingle()),
        withTimeout(supabase.from('event_types').select('*').order('sort_order')),
        withTimeout(supabase.from('packages').select('*, package_services(*)').order('sort_order')),
        withTimeout(supabase.from('addons').select('*').order('sort_order')),
        withTimeout(supabase.from('gallery_images').select('*').order('sort_order')),
        withTimeout(supabase.from('faqs').select('*').order('sort_order')),
        withTimeout(supabase.from('time_slots').select('*').order('sort_order')),
          ])
      if (!alive) return
      const [settingsR, eventTypesR, packagesR, addonsR, galleryR, faqsR, slotsR] = q as unknown as [
        Res<Settings>, Res<EventType[]>, Res<Package[]>, Res<Addon[]>, Res<GalleryImage[]>, Res<Faq[]>, Res<TimeSlot[]>,
      ]

      let eventTypes = rows(eventTypesR)
      let packages = rows(packagesR)
      let slots = rows(slotsR)
      let addons = rows(addonsR)
      // El catálogo va junto: si falta una pieza, se usa el respaldo completo
      // para que los identificadores coincidan entre sí.
      const offline = !eventTypes.length || !packages.length || !slots.length
      if (offline) {
        eventTypes = FALLBACK_EVENT_TYPES
        packages = FALLBACK_PACKAGES
        slots = FALLBACK_SLOTS
        addons = FALLBACK_ADDONS
      }
      const gallery = rows(galleryR)
      const faqs = rows(faqsR)
      const dbSettings = settingsR && !settingsR.error ? settingsR.data : null
      const settings: Settings = {
        ...FALLBACK_SETTINGS,
        ...(dbSettings ?? {}),
      }
      settings.whatsapp = resolveWhatsApp(dbSettings?.whatsapp)
      settings.instagram_url ||= INSTAGRAM_URL
      settings.hero_image_url = realPhoto(settings.hero_image_url) as string
      // La semilla quedó con Santiago: la casa está en Chiguayante.
      if (!settings.city || settings.city === 'Santiago') {
        settings.city = 'Chiguayante'
        settings.region = 'Biobío'
      }
      eventTypes = eventTypes.map((e) => ({ ...e, image_url: realPhoto(e.image_url) as string | null }))

      const allPackages = packages.map((p) => ({
        ...p,
        image_url: realPhoto(p.image_url) as string | null,
        package_services: [...(p.package_services ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }))
      // Modelo actual: se arrienda la casa completa a precio fijo y sin extras.
      // Si la base todavía no tiene el arriendo (migración arriendo_unico sin
      // aplicar), la web muestra el arriendo de respaldo y oculta los paquetes
      // y extras antiguos. Una vez migrada, manda lo que diga el panel.
      const rental = allPackages.filter((p) => p.active && p.slug === 'arriendo-espacio')
      const legacy = !rental.length
      const publicPackages = legacy ? FALLBACK_PACKAGES : allPackages.filter((p) => p.active)

      setState({
        settings,
        eventTypes,
        packages: publicPackages,
        addons: legacy ? [] : addons.filter((a) => a.active),
        allPackages,
        allAddons: addons,
        gallery: gallery.length ? gallery.map((g) => ({ ...g, url: realPhoto(g.url) as string })) : FALLBACK_GALLERY,
        faqs: faqs.length ? faqs : FALLBACK_FAQS,
        slots,
        loading: false,
        error: offline ? 'Catálogo de respaldo' : null,
        offline,
      })
    })()
    return () => {
      alive = false
    }
  }, [nonce])

  const value = useMemo<SiteData>(
    () => ({ ...state, reload: () => setNonce((n) => n + 1) }),
    [state],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSiteData(): SiteData {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSiteData debe usarse dentro de <SiteDataProvider>')
  return ctx
}
