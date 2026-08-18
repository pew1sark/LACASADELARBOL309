import { longDate, shortMoney } from './format'
import { track } from './analytics'

const clean = (n?: string | null) => (n ?? '').replace(/[^0-9]/g, '')

export function waLink(phone: string | null | undefined, message: string): string {
  const number = clean(phone)
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function openWhatsApp(
  phone: string | null | undefined,
  message: string,
  source: string,
): void {
  track('whatsapp_clicked', { source })
  window.open(waLink(phone, message), '_blank', 'noopener,noreferrer')
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
  addons?: string[]
}): string {
  const lines = [
    `Hola ${input.business} 👋 Acabo de enviar una solicitud de reserva.`,
    '',
    `*Código:* ${input.code}`,
    `*Nombre:* ${input.name}`,
  ]
  if (input.eventType) lines.push(`*Evento:* ${input.eventType}`)
  if (input.packageName) lines.push(`*Paquete:* ${input.packageName}`)
  lines.push(`*Fecha:* ${longDate(input.dateISO)}`)
  if (input.slotName) lines.push(`*Horario:* ${input.slotName} (${input.start} — ${input.end})`)
  lines.push(`*Invitados:* ${input.guests}`)
  if (input.addons?.length) lines.push(`*Adicionales:* ${input.addons.join(', ')}`)
  lines.push(`*Total estimado:* ${shortMoney(input.total)}`)
  lines.push('', '¿Me confirman la disponibilidad?')
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
