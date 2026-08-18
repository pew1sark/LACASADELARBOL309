const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export const money = (value: number | string | null | undefined): string =>
  clp.format(Number(value ?? 0))

export const shortMoney = (value: number | string | null | undefined): string =>
  `$${new Intl.NumberFormat('es-CL').format(Number(value ?? 0))}`

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const DAYS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']

/** Parsea 'YYYY-MM-DD' como fecha local (evita el corrimiento de zona horaria). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const toISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function longDate(iso: string): string {
  const d = parseDate(iso)
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}

export function mediumDate(iso: string): string {
  const d = parseDate(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

export const shortDate = (iso: string): string => {
  const d = parseDate(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export const hhmm = (t?: string | null): string => (t ? t.slice(0, 5) : '')

export const monthName = (m: number): string => MONTHS[m]
export const dayNames = DAYS

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ayer' : `hace ${d} días`
}
