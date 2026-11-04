import { track } from './analytics'
import { supabase } from './supabase'

export type PayKind = 'deposit' | 'full' | 'balance'

const MESSAGES: Record<string, string> = {
  PAGOS_NO_CONFIGURADOS: 'El pago en línea aún no está disponible. Escríbenos por WhatsApp y te ayudamos.',
  PAGOS_DESACTIVADOS: 'El pago en línea está desactivado por ahora. Escríbenos por WhatsApp.',
  HORARIO_NO_DISPONIBLE: 'Ese horario se acaba de ocupar. Escríbenos por WhatsApp y buscamos otra fecha.',
  NADA_POR_PAGAR: 'Esta reserva ya no tiene montos pendientes.',
  RESERVA_NO_PAGABLE: 'Esta reserva ya no admite pagos en línea.',
  RESERVA_NO_EXISTE: 'No encontramos la reserva.',
}

/** Pide al servidor el link de pago de Mercado Pago y lleva al cliente ahí.
 *  El monto lo calcula la Edge Function a partir de la reserva. */
export async function startOnlinePayment(code: string, kind: PayKind): Promise<void> {
  track('payment_started', { code, kind })
  const { data, error } = await supabase.functions.invoke('mp-checkout', { body: { code, kind } })
  let key = (data as { error?: string } | null)?.error
  if (error && !key) {
    // supabase-js entrega el cuerpo del error en error.context
    try {
      const body = await (error as { context?: Response }).context?.json()
      key = body?.error
    } catch {
      /* sin cuerpo */
    }
  }
  const url = (data as { url?: string } | null)?.url
  if (!url) throw new Error(MESSAGES[key ?? ''] ?? 'No pudimos abrir Mercado Pago. Inténtalo otra vez o escríbenos por WhatsApp.')
  window.location.href = url
}

export function payableAmounts(total: number, paid: number, depositPercent: number) {
  const deposit = Math.max(Math.round((total * depositPercent) / 100) - paid, 0)
  const full = Math.max(total - paid, 0)
  return { deposit, full }
}
