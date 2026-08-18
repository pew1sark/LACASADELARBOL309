import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '../../components/ui/Icon'
import { Button, LoadingBlock } from '../../components/ui/Primitives'
import { useAuth } from '../../hooks/useAuth'
import { relativeTime } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import type { NotificationRow } from '../../lib/types'

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/admin', label: 'Inicio', icon: 'chart', end: true },
  { to: '/admin/reservas', label: 'Reservas', icon: 'list' },
  { to: '/admin/calendario', label: 'Calendario', icon: 'calendar' },
  { to: '/admin/clientes', label: 'Clientes', icon: 'users' },
  { to: '/admin/paquetes', label: 'Paquetes', icon: 'gift' },
  { to: '/admin/configuracion', label: 'Ajustes', icon: 'settings' },
]

export default function AdminLayout() {
  const { session, isAdmin, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingBlock label="Verificando acceso…" />
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  if (!isAdmin) {
    return (
      <div className="grid min-h-svh place-items-center p-6 text-center">
        <div className="max-w-sm">
          <Icon name="lock" className="mx-auto size-10 text-terra-500" />
          <h1 className="mt-4 text-2xl">Sin permisos</h1>
          <p className="mt-2 text-bark-500">
            Esta cuenta no está autorizada para administrar la casa de eventos.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-cream-100">
      <div className="mx-auto flex max-w-7xl">
        {/* Barra lateral en escritorio */}
        <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-bark-900/8 bg-white px-3 py-5 lg:flex">
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <span className="grid size-9 place-items-center rounded-xl bg-leaf-700 text-white">
              <Icon name="home" className="size-4.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold">Casa del Árbol 309</span>
              <span className="block text-[0.68rem] uppercase tracking-wider text-bark-500">Administración</span>
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-leaf-700 text-white' : 'text-bark-700 hover:bg-cream-100'
                  }`
                }
              >
                <Icon name={n.icon} className="size-4.5" />
                {n.label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => void signOut()}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-bark-500 transition hover:bg-cream-100"
          >
            <Icon name="logout" className="size-4.5" /> Cerrar sesión
          </button>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <header className="sticky top-0 z-30 flex h-15 items-center justify-between gap-3 border-b border-bark-900/8 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
            <p className="font-display text-lg font-semibold lg:hidden">Casa del Árbol 309</p>
            <div className="hidden lg:block" />
            <NotificationsBell />
          </header>

          <main className="px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Barra inferior en móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-bark-900/10 bg-white/97 backdrop-blur lg:hidden">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.65rem] font-semibold transition ${
                isActive ? 'text-leaf-700' : 'text-bark-500'
              }`
            }
          >
            <Icon name={n.icon} className="size-5" />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function NotificationsBell() {
  const [items, setItems] = useState<NotificationRow[]>([])
  const [open, setOpen] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setItems((data as NotificationRow[]) ?? [])
  }

  useEffect(() => {
    void load()
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        void load()
      })
      .subscribe()
    const timer = setInterval(() => void load(), 60000)
    return () => {
      void supabase.removeChannel(channel)
      clearInterval(timer)
    }
  }, [])

  const unread = items.filter((n) => !n.read_at).length

  const markAll = async () => {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
    void load()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`}
        className="relative rounded-xl p-2.5 text-bark-700 transition hover:bg-cream-100"
      >
        <Icon name="bell" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-terra-500 text-[0.6rem] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} role="presentation" />
          <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-bark-900/10 bg-white shadow-lift">
            <div className="sticky top-0 flex items-center justify-between border-b border-bark-900/8 bg-white px-4 py-3">
              <p className="text-sm font-semibold">Notificaciones</p>
              {unread > 0 && (
                <button onClick={() => void markAll()} className="text-xs font-semibold text-leaf-700">
                  Marcar leídas
                </button>
              )}
            </div>
            {items.length === 0 && <p className="p-4 text-sm text-bark-500">Sin notificaciones todavía.</p>}
            {items.map((n) => (
              <div
                key={n.id}
                className={`border-b border-bark-900/5 px-4 py-3 last:border-0 ${n.read_at ? '' : 'bg-leaf-50'}`}
              >
                <p className="text-sm font-semibold leading-snug">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-bark-500">{n.body}</p>}
                <p className="mt-1 text-[0.68rem] text-bark-500/70">{relativeTime(n.created_at)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
