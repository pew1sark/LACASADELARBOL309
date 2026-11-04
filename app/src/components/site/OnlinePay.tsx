import { useState } from 'react'
import { money } from '../../lib/format'
import { payableAmounts, startOnlinePayment, type PayKind } from '../../lib/payments'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Primitives'

/** Botones para pagar la reserva con Mercado Pago (abono y/o total). */
export function OnlinePay({
  code,
  total,
  paid,
  depositPercent,
  mode = 'both',
  confirmed = false,
}: {
  code: string
  total: number
  paid: number
  depositPercent: number
  mode?: 'deposit' | 'full' | 'both'
  confirmed?: boolean
}) {
  const [busy, setBusy] = useState<PayKind | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { deposit, full } = payableAmounts(total, paid, depositPercent)

  const options: { kind: PayKind; label: string; amount: number; hint: string }[] = []
  if (confirmed) {
    if (full > 0) options.push({ kind: 'balance', label: 'Pagar el saldo', amount: full, hint: 'Deja tu evento pagado por completo.' })
  } else {
    if (mode !== 'full' && deposit > 0)
      options.push({ kind: 'deposit', label: `Pagar abono (${depositPercent}%)`, amount: deposit, hint: 'Confirma y bloquea tu fecha al instante.' })
    if (mode !== 'deposit' && full > 0)
      options.push({ kind: 'full', label: 'Pagar el total', amount: full, hint: 'Queda todo listo, sin pagos el día del evento.' })
  }
  if (!options.length) return null

  const pay = async (kind: PayKind) => {
    setBusy(kind)
    setError(null)
    try {
      await startOnlinePayment(code, kind)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos abrir Mercado Pago.')
      setBusy(null)
    }
  }

  return (
    <div className="rounded-3xl border border-leaf-600/20 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Icon name="lock" className="size-4.5 text-leaf-700" /> Paga en línea y asegura tu fecha
        </p>
        <span className="rounded-md bg-[#009ee3] px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white">Mercado Pago</span>
      </div>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {options.map((o, i) => (
          <button
            key={o.kind}
            type="button"
            onClick={() => void pay(o.kind)}
            disabled={busy !== null}
            className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition disabled:opacity-60 ${
              i === 0 ? 'border-leaf-700 bg-leaf-700 text-white hover:bg-leaf-900' : 'border-bark-900/10 bg-cream-50 hover:border-leaf-600'
            } ${options.length === 1 ? 'sm:col-span-2' : ''}`}
          >
            <span className="flex w-full items-center justify-between gap-2 text-sm font-semibold">
              {o.label}
              {busy === o.kind ? <Spinner className="size-4" /> : <Icon name="arrowRight" className="size-4" />}
            </span>
            <span className="mt-1 font-display text-2xl font-semibold">{money(o.amount)}</span>
            <span className={`mt-1 text-xs ${i === 0 ? 'text-cream-200' : 'text-bark-500'}`}>{o.hint}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-bark-500">
        Tarjetas de crédito, débito y otros medios. Pago seguro procesado por Mercado Pago.
      </p>
      {error && <p className="mt-3 rounded-xl bg-terra-500/10 px-3 py-2 text-sm text-terra-500">{error}</p>}
    </div>
  )
}
