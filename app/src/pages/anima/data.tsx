import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import type { AdminUser, Customer, NotificationRow, PaymentIntent, Reservation } from '../../lib/types'

export interface StatusChange {
  id: string
  reservation_id: string
  from_status: string | null
  to_status: string
  created_at: string
  reservations?: { code: string } | null
}

interface AnimaData {
  reservations: Reservation[]
  customers: Customer[]
  intents: PaymentIntent[]
  notifications: NotificationRow[]
  history: StatusChange[]
  admins: AdminUser[]
  loading: boolean
  error: string | null
  reload: () => void
}

const Ctx = createContext<AnimaData | null>(null)

/** Carga todo el negocio una vez para la consola (volúmenes de una casa de
 *  eventos: cientos de filas, no millones). */
export function AnimaDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AnimaData, 'reload'>>({
    reservations: [], customers: [], intents: [], notifications: [], history: [], admins: [], loading: true, error: null,
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    const [res, cus, pi, no, hi, ad] = await Promise.all([
      supabase
        .from('reservations')
        .select('*, customers(*), packages(id, name, slug), time_slots(id, name, start_time, end_time), event_types(id, name, slug), payments(*)')
        .order('created_at', { ascending: false })
        .limit(2000),
      supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(5000),
      supabase
        .from('payment_intents')
        .select('*, reservations(code, event_date, customers(first_name, last_name))')
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200),
      supabase
        .from('reservation_status_history')
        .select('id, reservation_id, from_status, to_status, created_at, reservations(code)')
        .order('created_at', { ascending: false })
        .limit(300),
      supabase.from('admin_users').select('*').order('created_at'),
    ])
    const err = res.error ?? cus.error ?? pi.error ?? no.error ?? hi.error ?? ad.error
    setState({
      reservations: (res.data as Reservation[]) ?? [],
      customers: (cus.data as Customer[]) ?? [],
      intents: (pi.data as PaymentIntent[]) ?? [],
      notifications: (no.data as NotificationRow[]) ?? [],
      history: (hi.data as unknown as StatusChange[]) ?? [],
      admins: (ad.data as AdminUser[]) ?? [],
      loading: false,
      error: err ? err.message : null,
    })
  }, [])

  useEffect(() => {
    void load()
    // Pagos y reservas nuevas aparecen solos.
    const ch = supabase
      .channel('anima-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_intents' }, () => void load())
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [load])

  return <Ctx.Provider value={{ ...state, reload: load }}>{children}</Ctx.Provider>
}

export function useAnima(): AnimaData {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAnima fuera de AnimaDataProvider')
  return ctx
}

/** Origen del cliente: la web lo guarda en las notas como "Origen: Meta Ads · campaña". */
export function originOf(r: Reservation): string {
  const m = /Origen:\s*([^\n]+)/i.exec(r.customer_notes ?? '')
  if (m) return m[1].split('·')[0].trim()
  return r.source === 'web' ? 'Directo / orgánico' : r.source
}

export function campaignOf(r: Reservation): string | null {
  const m = /Origen:\s*[^·\n]+·\s*([^\n]+)/i.exec(r.customer_notes ?? '')
  return m ? m[1].trim() : null
}

export const ACTIVE = ['AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED']
