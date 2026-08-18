import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Addon, EventType, Faq, GalleryImage, Package, Settings, TimeSlot } from '../lib/types'

interface SiteData {
  settings: Settings | null
  eventTypes: EventType[]
  packages: Package[]
  addons: Addon[]
  gallery: GalleryImage[]
  faqs: Faq[]
  slots: TimeSlot[]
  loading: boolean
  error: string | null
  reload: () => void
}

const Ctx = createContext<SiteData | null>(null)

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<SiteData, 'reload'>>({
    settings: null,
    eventTypes: [],
    packages: [],
    addons: [],
    gallery: [],
    faqs: [],
    slots: [],
    loading: true,
    error: null,
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setState((s) => ({ ...s, loading: true }))
      const [settings, eventTypes, packages, addons, gallery, faqs, slots] = await Promise.all([
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('event_types').select('*').order('sort_order'),
        supabase
          .from('packages')
          .select('*, package_services(*)')
          .order('sort_order'),
        supabase.from('addons').select('*').order('sort_order'),
        supabase.from('gallery_images').select('*').order('sort_order'),
        supabase.from('faqs').select('*').order('sort_order'),
        supabase.from('time_slots').select('*').order('sort_order'),
      ])
      if (!alive) return
      const firstError =
        settings.error ?? eventTypes.error ?? packages.error ?? addons.error ?? slots.error
      setState({
        settings: (settings.data as Settings) ?? null,
        eventTypes: (eventTypes.data as EventType[]) ?? [],
        packages: ((packages.data as Package[]) ?? []).map((p) => ({
          ...p,
          package_services: (p.package_services ?? []).sort((a, b) => a.sort_order - b.sort_order),
        })),
        addons: (addons.data as Addon[]) ?? [],
        gallery: (gallery.data as GalleryImage[]) ?? [],
        faqs: (faqs.data as Faq[]) ?? [],
        slots: (slots.data as TimeSlot[]) ?? [],
        loading: false,
        error: firstError ? firstError.message : null,
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
