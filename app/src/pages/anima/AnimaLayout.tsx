import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '../../components/ui/Icon'
import { LoadingBlock } from '../../components/ui/Primitives'
import { useAuth } from '../../hooks/useAuth'
import { AnimaDataProvider, useAnima } from './data'
import { AnimaMark } from './ui'

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/anima', label: 'Resumen', icon: 'chart', end: true },
  { to: '/anima/reservas', label: 'Reservas', icon: 'calendar' },
  { to: '/anima/pagos', label: 'Pagos', icon: 'money' },
  { to: '/anima/clientes', label: 'Clientes', icon: 'users' },
  { to: '/anima/actividad', label: 'Actividad', icon: 'bell' },
  { to: '/anima/accesos', label: 'Accesos', icon: 'lock' },
  { to: '/anima/integraciones', label: 'Integraciones', icon: 'settings' },
]

/** Consola ANIMA COMPANY: monitoreo y control total del negocio.
 *  Solo para cuentas con rol "anima" (lo valida también la base: RLS). */
export default function AnimaLayout() {
  const { session, role, loading, signOut } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  if (loading) return <LoadingBlock label="Verificando acceso…" />
  if (!session) return <Navigate to="/anima/login" replace state={{ from: location.pathname }} />
  if (role !== 'anima') {
    return (
      <div className="grid min-h-svh place-items-center bg-anima-bg p-6 text-center font-sans">
        <div className="max-w-sm">
          <AnimaMark className="mx-auto size-12" />
          <h1 className="mt-4 font-sans text-2xl font-bold text-anima-ink">Acceso restringido</h1>
          <p className="mt-2 text-sm text-anima-muted">Esta consola es exclusiva del equipo de ANIMA COMPANY.</p>
          <div className="mt-6 flex justify-center gap-2">
            {role === 'admin' && (
              <Link to="/admin" className="rounded-xl bg-anima-ink px-4 py-2 text-sm font-semibold text-white">Ir al panel del negocio</Link>
            )}
            <button onClick={() => void signOut()} className="rounded-xl border border-anima-line bg-white px-4 py-2 text-sm font-semibold">Cerrar sesión</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AnimaDataProvider>
      <div className="min-h-svh bg-anima-bg font-sans text-anima-ink">
        <div className="mx-auto flex max-w-[90rem]">
          <aside className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex-col bg-anima-ink px-3 py-5 text-white transition-transform lg:sticky lg:top-0 lg:flex lg:h-svh lg:translate-x-0 ${open ? 'flex translate-x-0' : 'hidden -translate-x-full lg:flex'}`}>
            <div className="mb-7 flex items-center gap-2.5 px-2">
              <AnimaMark className="size-9 ring-1 ring-white/15 rounded-[11px]" />
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-[0.14em]">ANIMA <span className="text-anima-gold">COMPANY</span></p>
                <p className="text-[0.68rem] text-white/50">La Casa del Árbol · Los Castaños</p>
              </div>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-white/10 text-anima-gold' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon name={n.icon} className="size-4.5" /> {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="space-y-1 border-t border-white/10 pt-3">
              <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
                <Icon name="settings" className="size-4.5" /> Panel del negocio
              </Link>
              <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
                <Icon name="home" className="size-4.5" /> Ver sitio público
              </Link>
              <button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
                <Icon name="logout" className="size-4.5" /> Cerrar sesión
              </button>
            </div>
          </aside>
          {open && <button aria-label="Cerrar menú" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

          <main className="min-w-0 flex-1">
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-anima-line bg-anima-bg/90 px-4 py-3 backdrop-blur lg:hidden">
              <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="rounded-lg p-2"><Icon name="menu" /></button>
              <p className="text-sm font-bold tracking-[0.14em]">ANIMA <span className="text-anima-gold-deep">COMPANY</span></p>
              <span className="w-9" />
            </div>
            <div className="px-4 py-6 md:px-8 md:py-8">
              <Status />
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AnimaDataProvider>
  )
}

function Status() {
  const { error, loading } = useAnima()
  if (loading) return <p className="mb-4 text-xs text-anima-muted">Actualizando datos…</p>
  if (error) return <p className="mb-4 rounded-xl bg-[#f6e1e1] px-4 py-2 text-sm text-anima-danger">Error al cargar datos: {error}</p>
  return null
}
