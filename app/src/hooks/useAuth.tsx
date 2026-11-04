import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  session: Session | null
  isAdmin: boolean
  /** 'anima' = ANIMA COMPANY (consola /anima); 'admin' = dueño del negocio. */
  role: 'admin' | 'anima' | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [role, setRole] = useState<'admin' | 'anima' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    const resolve = async (s: Session | null) => {
      if (!alive) return
      setSession(s)
      if (!s) {
        setIsAdmin(false)
        setRole(null)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('admin_users')
        .select('user_id, role')
        .eq('user_id', s.user.id)
        .maybeSingle()
      if (!alive) return
      setIsAdmin(Boolean(data))
      setRole(((data as { role?: 'admin' | 'anima' } | null)?.role) ?? null)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      void resolve(s)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      isAdmin,
      role,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, isAdmin, role, loading],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
