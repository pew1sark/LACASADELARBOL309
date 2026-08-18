import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/site/Footer'
import { Header } from './components/site/Header'
import { WhatsAppFab } from './components/site/WhatsAppFab'
import { AuthProvider } from './hooks/useAuth'
import { SiteDataProvider } from './hooks/useSiteData'
import { ToastProvider } from './hooks/useToast'
import Estado from './pages/Estado'
import Home from './pages/Home'
import Reservar from './pages/Reservar'
import { LoadingBlock } from './components/ui/Primitives'

// El panel de administración se carga aparte: la landing pública no paga
// su peso, que es lo que importa en móvil.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminCalendario = lazy(() => import('./pages/admin/Calendario'))
const AdminClientes = lazy(() => import('./pages/admin/Clientes'))
const AdminConfiguracion = lazy(() => import('./pages/admin/Configuracion'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const AdminPaquetes = lazy(() => import('./pages/admin/Paquetes'))
const AdminPuestaEnMarcha = lazy(() => import('./pages/admin/PuestaEnMarcha'))
const AdminReservas = lazy(() => import('./pages/admin/Reservas'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!pathname.includes('#')) window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function SiteLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SiteDataProvider>
          <ScrollToTop />
          <Suspense fallback={<LoadingBlock />}>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/reservar" element={<Reservar />} />
              <Route path="/estado" element={<Estado />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="puesta-en-marcha" element={<AdminPuestaEnMarcha />} />
              <Route path="reservas" element={<AdminReservas />} />
              <Route path="calendario" element={<AdminCalendario />} />
              <Route path="clientes" element={<AdminClientes />} />
              <Route path="paquetes" element={<AdminPaquetes />} />
              <Route path="configuracion" element={<AdminConfiguracion />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </SiteDataProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
