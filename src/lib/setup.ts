import type { GalleryImage, Package, Settings, SettingsPayment } from './types'

/** Valores exactos que dejó la carga inicial. Mientras sigan ahí, el dato
 *  es de ejemplo y no sirve para atender a un cliente real. */
const PLACEHOLDERS = {
  phone: '+56 9 0000 0000',
  whatsapp: '56900000000',
  email: 'hola@lacasadelarbol309.cl',
  address: 'Calle 309',
  bank_name: 'Banco (editar)',
  bank_account_number: '000000000',
  bank_account_rut: '00.000.000-0',
  bank_account_holder: 'La Casa del Árbol 309',
  bank_email: 'pagos@lacasadelarbol309.cl',
} as const

const isBlank = (v?: string | null) => !v || v.trim() === ''

/** Las imágenes generadas viven en /images y son SVG de marcador de posición. */
export const isPlaceholderImage = (url?: string | null) =>
  isBlank(url) || (!/^https?:\/\//.test(url!) && url!.endsWith('.svg'))

export type SectionId = 'identidad' | 'contacto' | 'reglas' | 'horarios' | 'precios' | 'pagos' | 'fotos'

export interface SetupSection {
  id: SectionId
  title: string
  summary: string
  critical: boolean
  /** Datos que siguen siendo de ejemplo. Si hay alguno, no se puede completar. */
  pending: string[]
  confirmed: boolean
  done: boolean
}

interface Input {
  settings: Settings | null
  payment: Partial<SettingsPayment> | null
  packages: Package[]
  gallery: GalleryImage[]
}

export function buildSections({ settings, payment, packages, gallery }: Input): SetupSection[] {
  const steps = settings?.setup_steps ?? []
  const confirmed = (id: SectionId) => steps.includes(id)

  const identidad: string[] = []
  if (isBlank(settings?.business_name)) identidad.push('el nombre del negocio')
  if (settings?.address === PLACEHOLDERS.address || isBlank(settings?.address))
    identidad.push('la dirección real')
  if (isBlank(settings?.about)) identidad.push('la descripción del lugar')

  const contacto: string[] = []
  if (settings?.whatsapp === PLACEHOLDERS.whatsapp || isBlank(settings?.whatsapp))
    contacto.push('el número de WhatsApp')
  if (settings?.phone === PLACEHOLDERS.phone || isBlank(settings?.phone))
    contacto.push('el teléfono')
  if (settings?.email === PLACEHOLDERS.email || isBlank(settings?.email))
    contacto.push('el correo de contacto')

  const pagos: string[] = []
  if (payment?.bank_name === PLACEHOLDERS.bank_name || isBlank(payment?.bank_name))
    pagos.push('el banco')
  if (payment?.bank_account_number === PLACEHOLDERS.bank_account_number || isBlank(payment?.bank_account_number))
    pagos.push('el número de cuenta')
  if (payment?.bank_account_rut === PLACEHOLDERS.bank_account_rut || isBlank(payment?.bank_account_rut))
    pagos.push('el RUT del titular')
  if (isBlank(payment?.bank_account_holder)) pagos.push('el titular de la cuenta')

  // Precios exactos con los que se cargó el catálogo por primera vez.
  const SEED_PRICES: Record<string, number> = {
    'pack-infantil': 180000,
    'pack-teen': 220000,
    'pack-adultos': 280000,
    'pack-particular': 200000,
  }
  const precios: string[] = []
  const sinTocar = packages.filter((p) => SEED_PRICES[p.slug] === Number(p.price))
  if (packages.length > 0 && sinTocar.length === packages.length)
    precios.push('los precios de ejemplo de todos los paquetes')

  const fotosPendientes = gallery.filter((g) => isPlaceholderImage(g.url)).length
  const fotos: string[] = []
  if (isPlaceholderImage(settings?.hero_image_url)) fotos.push('la foto principal')
  if (gallery.length > 0 && fotosPendientes > gallery.length - 3)
    fotos.push(`al menos 3 fotos de la galería (${gallery.length - fotosPendientes} de ${gallery.length} listas)`)

  const build = (
    id: SectionId,
    title: string,
    summary: string,
    critical: boolean,
    pending: string[],
  ): SetupSection => ({
    id,
    title,
    summary,
    critical,
    pending,
    confirmed: confirmed(id),
    done: confirmed(id) && pending.length === 0,
  })

  return [
    build('identidad', 'Identidad del negocio', 'Nombre, frase, dirección y descripción que ve el cliente.', false, identidad),
    build('contacto', 'Contacto y WhatsApp', 'Sin el WhatsApp real, ningún botón del sitio funciona.', true, contacto),
    build('reglas', 'Reglas de reserva', 'Capacidad, anticipación mínima, abono y política de cancelación.', false, []),
    build('horarios', 'Bloques horarios', 'Los horarios que el cliente puede elegir en el calendario.', false, []),
    build('precios', 'Precios de los paquetes', 'Los valores actuales son referenciales. Ajústalos a tu realidad.', true, precios),
    build('pagos', 'Datos para recibir pagos', 'Se le muestran al cliente cuando confirmas su fecha.', true, pagos),
    build('fotos', 'Fotografías del lugar', 'Hoy el sitio muestra ilustraciones de relleno.', false, fotos),
  ]
}

export const setupProgress = (sections: SetupSection[]) => ({
  done: sections.filter((s) => s.done).length,
  total: sections.length,
  percent: Math.round((sections.filter((s) => s.done).length / sections.length) * 100),
  blockers: sections.filter((s) => s.critical && !s.done),
})
