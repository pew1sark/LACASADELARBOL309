import { useState, type FormEvent } from 'react'
import { LogoMark } from '../../components/brand/Logo'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, Field } from '../../components/ui/Primitives'
import { useAuth } from '../../hooks/useAuth'
import { friendlyError } from '../../lib/errors'

export default function AdminLogin() {
  const { session, isAdmin, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-leaf-900 p-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-cream-50">
          <LogoMark className="mx-auto size-16 shadow-lift" />
          <h1 className="mt-4 text-2xl">La Casa del Árbol</h1>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Los Castaños</p>
          <p className="mt-1 text-sm text-cream-200">Panel de administración</p>
        </div>

        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Field
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <p className="text-sm font-medium text-terra-500">{error}</p>}
            <Button full type="submit" disabled={busy}>
              {busy ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-cream-200/70">
          Acceso exclusivo del equipo de {'La Casa del Árbol 309'}.
        </p>
      </div>
    </div>
  )
}
