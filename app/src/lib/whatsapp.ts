import { longDate, shortMoney } from './format'
import { track } from './analytics'
import { resolveWhatsApp } from './fallback'

export function waLink(phone: string | null | undefined, message: string): string {
  const number = resolveWhatsApp(phone)
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(
  phone: string | null | undefined,
  message: string,
  source: string,
): void {
  track('whatsapp_clicked', { source })
  const win = window.open(waLink(phone, message), '_blank', 'noopener,noreferrer')
  // Algunos navegadores internos (Instagram, Facebook) bloquean pestañas nuevas.
  if (!win) window.location.href = waLink(phone, message)
}

/** Envía al cliente a WhatsApp en la misma pestaña. Se usa después de una
 *  operación asíncrona, cuando los navegadores bloquean window.open. */
export function goToWhatsApp(phone: string | null | undefined, message: string, source: string): void {
  track('whatsapp_clicked', { source })
  window.location.href = waLink(phone, message)
}

export const genericMessage = (business: string) =>
  `Hola ${business} 👋 Quiero consultar disponibilidad para una celebración.`

export const packageMessage = (business: string, pkg: string, price: number) =>
  `Hola ${business} 👋 Me interesa el ${pkg} (desde ${shortMoney(price)}). ¿Qué fechas tienen disponibles?`

export const dateMessage = (business: string, dateISO: string, guests?: number) =>
  `Hola ${business} 👋 Quiero consultar disponibilidad para el ${longDate(dateISO)}` +
  (guests ? ` para ${guests} personas.` : '.')

/** Mensaje contextual que se genera al terminar la solicitud: el administrador
 *  recibe todo lo necesario para responder sin pedir más datos. */
export function requestMessage(input: {
  business: string
  code: string
  name: string
  eventType?: string | null
  packageName?: string | null
  dateISO: string
  slotName?: string | null
  start?: string | null
  end?: string | null
  guests: number
  total: number
  addons?: { name: string; quantity: number; subtotal: number }[] | string[]
  packagePrice?: number
  priceLines?: { label: string; value: number }[]
  deposit?: number
  phone?: string
  notes?: string
  source?: string | null
}): string {
  const lines = [
    `Hola ${input.business} 👋 Quiero agendar mi evento. Esta es mi cotización:`,
    '',
    `*Código:* ${input.code}`,
    `*Nombre:* ${input.name}`,
  ]
  if (input.phone) lines.push(`*Teléfono:* ${input.phone}`)
  if (input.eventType) lines.push(`*Evento:* ${input.eventType}`)
  if (input.packageName)
    lines.push(`*Paquete:* ${input.packageName}${input.packagePrice ? ` (${shortMoney(input.packagePrice)})` : ''}`)
  for (const l of input.priceLines ?? []) lines.push(`  + ${l.label}: ${shortMoney(l.value)}`)
  lines.push(`*Fecha:* ${longDate(input.dateISO)}`)
  if (input.slotName) lines.push(`*Horario:* ${input.slotName} (${input.start} — ${input.end})`)
  lines.push(`*Invitados:* ${input.guests}`)
  if (input.addons?.length) {
    if (typeof input.addons[0] === 'string') {
      lines.push(`*Adicionales:* ${(input.addons as string[]).join(', ')}`)
    } else {
      lines.push('*Adicionales:*')
      for (const a of input.addons as { name: string; quantity: number; subtotal: number }[])
        lines.push(`  • ${a.name}${a.quantity > 1 ? ` ×${a.quantity}` : ''} — ${shortMoney(a.subtotal)}`)
    }
  }
  lines.push(`*Total estimado:* ${shortMoney(input.total)}`)
  if (input.deposit) lines.push(`*Abono para reservar:* ${shortMoney(input.deposit)}`)
  if (input.notes) lines.push(`*Comentarios:* ${input.notes}`)
  if (input.source) lines.push(`_Vengo desde: ${input.source}_`)
  lines.push('', '¿Me confirman la disponibilidad? 🙌')
  return lines.join('\n')
}

/** Mensaje que el administrador envía al cliente desde el panel. */
export function adminReplyMessage(input: {
  business: string
  customerName: string
  code: string
  dateISO: string
  slotName?: string | null
  total: number
  deposit: number
  kind: 'confirm_availability' | 'payment_received' | 'reminder' | 'rejected'
  bank?: string
}): string {
  const head = `Hola ${input.customerName} 👋 Te escribimos de ${input.business} por tu reserva ${input.code}.`
  switch (input.kind) {
    case 'confirm_availability':
      return [
        head,
        '',
        `✅ *Tenemos disponible* el ${longDate(input.dateISO)}${input.slotName ? ` en el horario ${input.slotName}` : ''}.`,
        `Total del evento: ${shortMoney(input.total)}`,
        `Para dejar la fecha reservada necesitamos un abono de ${shortMoney(input.deposit)}.`,
        input.bank ? `\n${input.bank}` : '',
        '',
        'Al recibir el comprobante confirmamos tu evento 🎉',
      ]
        .filter(Boolean)
        .join('\n')
    case 'payment_received':
      return [
        head,
        '',
        '🎉 *¡Tu evento está confirmado!*',
        `Fecha: ${longDate(input.dateISO)}${input.slotName ? ` · ${input.slotName}` : ''}`,
        'Ya bloqueamos la fecha para ti. Cualquier detalle nos escribes por aquí.',
      ].join('\n')
    case 'reminder':
      return [
        head,
        '',
        `Te recordamos tu evento del ${longDate(input.dateISO)}${input.slotName ? ` · ${input.slotName}` : ''}.`,
        'Si necesitas coordinar algo, respóndenos por aquí.',
      ].join('\n')
    case 'rejected':
      return [
        head,
        '',
        `Lamentablemente esa fecha ya no está disponible 😔`,
        '¿Te acomoda que revisemos otras fechas cercanas?',
      ].join('\n')
  }
}
