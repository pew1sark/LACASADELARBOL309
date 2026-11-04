import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { friendlyError } from '../../lib/errors'
import { AnimaMark } from './ui'

export default function AnimaLogin() {
  const { session, role, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session && role === 'anima') return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/anima'} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      navigate('/anima', { replace: true })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full rounded-xl border border-anima-line bg-white px-4 py-3 text-sm focus:border-anima-gold focus:outline-none'
  return (
    <div className="grid min-h-svh place-items-center bg-anima-ink p-6 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-white">
          <AnimaMark className="mx-auto size-14 rounded-[14px] ring-1 ring-white/15" />
          <p className="mt-4 text-lg font-bold tracking-[0.2em]">ANIMA <span className="text-anima-gold">COMPANY</span></p>
          <p className="mt-1 text-sm text-white/60">Consola de control · La Casa del Árbol</p>
        </div>
        <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-6">
          <label className="block text-sm font-semibold text-anima-ink">Correo<input className={`${input} mt-1.5`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="block text-sm font-semibold text-anima-ink">Contraseña<input className={`${input} mt-1.5`} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <p className="rounded-lg bg-[#f6e1e1] px-3 py-2 text-sm text-anima-danger">{error}</p>}
          {session && role !== 'anima' && !error && (
            <p className="rounded-lg bg-anima-bg px-3 py-2 text-xs text-anima-muted">Tu cuenta no tiene acceso a la consola ANIMA.</p>
          )}
          <button disabled={busy} className="h-11 w-full rounded-xl bg-anima-ink font-semibold text-white transition hover:bg-anima-ink2 disabled:opacity-60">
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-white/40">Acceso exclusivo del equipo ANIMA COMPANY.</p>
      </div>
    </div>
  )
}
