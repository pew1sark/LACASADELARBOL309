/** Catálogo de respaldo.
 *
 *  El landing recibe tráfico pagado desde Meta Ads: no puede quedar en blanco
 *  si la base de datos tarda o no responde. Estos valores son los mismos con
 *  los que se cargó Supabase y se usan solo cuando la consulta falla o viene
 *  vacía. Lo que se edite en el panel siempre tiene prioridad. */
import type { Addon, EventType, Faq, GalleryImage, Package, Settings, TimeSlot } from './types'

/** WhatsApp que recibe las cotizaciones. Se puede sobrescribir con
 *  VITE_WHATSAPP_NUMBER sin tocar el código. */
export const WHATSAPP_NUMBER: string =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.replace(/\D/g, '') || '56954737249'

export const INSTAGRAM_HANDLE = 'lacasadelarbol309'
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`

/** Números de ejemplo que trae la semilla: si siguen en la base, se ignoran. */
const PLACEHOLDER_NUMBERS = ['56900000000', '']

/** Fotos reales (sacadas del reel) que reemplazan a las ilustraciones de
 *  ejemplo de la semilla. Una foto subida desde el panel siempre manda. */
const REAL_PHOTOS: Record<string, string> = {
  'images/hero.svg': 'images/fotos/salon-principal.webp',
  'images/evento-infantil.svg': 'images/fotos/bloques-gigantes.webp',
  'images/evento-cumpleanos.svg': 'images/fotos/mesa-globos.webp',
  'images/evento-particular.svg': 'images/fotos/salon-principal.webp',
  'images/pack-infantil.svg': 'images/fotos/mesa-tematica.webp',
  'images/pack-teen.svg': 'images/fotos/taca-taca.webp',
  'images/pack-adultos.svg': 'images/fotos/salon-mesas.webp',
  'images/pack-particular.svg': 'images/fotos/fiesta-estilo.webp',
  'images/galeria-01.svg': 'images/fotos/salon-principal.webp',
  'images/galeria-02.svg': 'images/fotos/juegos-inflable.webp',
  'images/galeria-03.svg': 'images/fotos/patio-pingpong.webp',
  'images/galeria-04.svg': 'images/fotos/mesa-dulce.webp',
  'images/galeria-05.svg': 'images/fotos/cocina.webp',
  'images/galeria-06.svg': 'images/fotos/fachada.webp',
}

/** Pack 1 (nov. 2026): las mismas fotos, editadas con Higgsfield (luz, color,
 *  nitidez y encuadre; sin agregar ni quitar nada del espacio). Si una ruta
 *  guardada apunta a la foto original, se sirve la versión mejorada. */
const PACK = 'images/pack/pack-1/'
const MEJORADAS: Record<string, string> = {
  'images/fotos/fachada.webp': `${PACK}01-fachada.webp`,
  'images/fotos/salon-principal.webp': `${PACK}02-salon-principal.webp`,
  'images/fotos/salon-mesas.webp': `${PACK}03-salon-celebracion.webp`,
  'images/fotos/mesa-globos.webp': `${PACK}04-mesa-celebracion.webp`,
  'images/fotos/mesa-tematica.webp': `${PACK}05-mesa-tematica.webp`,
  'images/fotos/mesa-dulce.webp': `${PACK}06-mesa-dulces.webp`,
  'images/fotos/juegos-inflable.webp': `${PACK}07-galpon-inflable.webp`,
  'images/fotos/juegos-madera.webp': `${PACK}08-juegos-madera.webp`,
  'images/fotos/bloques-gigantes.webp': `${PACK}09-bloques-gigantes.webp`,
  'images/fotos/taca-taca.webp': `${PACK}10-taca-taca.webp`,
  'images/fotos/air-hockey.webp': `${PACK}11-air-hockey.webp`,
  'images/fotos/patio-pingpong.webp': `${PACK}12-patio.webp`,
  'images/fotos/patio-basquetbol.webp': `${PACK}13-basquetbol.webp`,
  'images/fotos/cocina.webp': `${PACK}14-cocina.webp`,
  'images/fotos/sala-multiuso.webp': `${PACK}15-sala-multiuso.webp`,
  'images/fotos/banos.webp': `${PACK}16-banos.webp`,
  'images/fotos/fiesta-estilo.webp': `${PACK}17-decoracion.webp`,
}

export const realPhoto = <T extends string | null | undefined>(url: T): T | string => {
  if (!url) return url
  const limpia = url.replace(/^\//, '')
  const real = REAL_PHOTOS[limpia] ?? limpia
  return MEJORADAS[real] ?? (real === limpia ? url : real)
}

/** Versión liviana (800 px) de una foto del pack, para miniaturas. */
export const miniatura = (url: string): string =>
  url.startsWith('images/pack/') ? url.replace(/\.webp$/, '-sm.webp') : url

export function resolveWhatsApp(fromDb?: string | null): string {
  const clean = (fromDb ?? '').replace(/\D/g, '')
  return PLACEHOLDER_NUMBERS.includes(clean) ? WHATSAPP_NUMBER : clean
}

export const FALLBACK_SETTINGS: Settings = {
  id: 1,
  business_name: 'La Casa del Árbol 309',
  tagline: 'El lugar perfecto para celebrar momentos inolvidables',
  about:
    'Una casa de eventos pensada para celebrar en familia y entre amigos. Un espacio cálido, limpio y seguro, con áreas para niños y adultos, listo para que solo te preocupes de disfrutar.',
  address: 'Los Castaños',
  city: 'Chiguayante',
  region: 'Biobío',
  country: 'Chile',
  phone: '+56 9 5473 7249',
  whatsapp: WHATSAPP_NUMBER,
  email: null,
  instagram_url: INSTAGRAM_URL,
  facebook_url: null,
  tiktok_url: null,
  google_maps_url: null,
  opening_hours: 'Lunes a domingo, 10:00 a 22:00',
  min_guests: 10,
  max_capacity: 60,
  standard_duration_hours: 3.5,
  lead_time_days: 3,
  max_advance_days: 365,
  deposit_percent: 30,
  currency: 'CLP',
  cancellation_policy:
    'Las reservas se confirman con un abono del 30%. Cambios de fecha sin costo hasta 15 días antes del evento. Cancelaciones con menos de 7 días de anticipación no tienen devolución del abono.',
  hero_image_url: 'images/pack/pack-1/02-salon-principal.webp',
  setup_steps: [],
}

export const FALLBACK_EVENT_TYPES: EventType[] = [
  {
    id: 'et-infantil', slug: 'cumpleanos-infantiles', name: 'Cumpleaños infantiles',
    short_description: 'Espacio preparado para niños, juegos y celebraciones seguras.',
    long_description: null, image_url: 'images/evento-infantil.svg', icon: 'cake', sort_order: 1, active: true,
  },
  {
    id: 'et-cumple', slug: 'cumpleanos', name: 'Cumpleaños',
    short_description: 'Celebraciones familiares y cumpleaños de todas las edades.',
    long_description: null, image_url: 'images/evento-cumpleanos.svg', icon: 'party', sort_order: 2, active: true,
  },
  {
    id: 'et-particular', slug: 'eventos-particulares', name: 'Eventos particulares',
    short_description: 'Baby showers, bautizos, aniversarios y reuniones privadas.',
    long_description: null, image_url: 'images/evento-particular.svg', icon: 'heart', sort_order: 3, active: true,
  },
]

const services = (pkgId: string, extra: string[]) =>
  [...RENTAL_INCLUDES, ...extra].map((name, i) => ({ id: `${pkgId}-s${i}`, package_id: pkgId, name, sort_order: i + 1 }))

/** Lo que incluye el arriendo: la casa completa (áreas del recorrido). */
export const RENTAL_INCLUDES = [
  'Uso exclusivo de toda la casa',
  'Salón principal con mesas y sillas',
  'Galpón de juegos: inflable y cama elástica',
  'Taca-taca y air hockey',
  'Bloques gigantes y juegos de madera',
  'Patio con ping pong y básquetbol',
  'Cocina equipada',
  'Baños',
  'Sala multiuso',
]

export const RENTAL_PRICE = 140000

export const FALLBACK_PACKAGES: Package[] = [
  {
    id: 'pk-arriendo', slug: 'arriendo-espacio', name: 'Arriendo del espacio', subtitle: 'La casa completa, solo para tu evento',
    description: null, event_type_id: null, price: RENTAL_PRICE, price_is_from: false, duration_hours: 3.5,
    max_guests: 60, image_url: 'images/pack/pack-1/02-salon-principal.webp', badge: null, sort_order: 0, active: true,
    weekend_price: null, included_guests: null, extra_guest_price: 0,
    package_services: services('pk-arriendo', []),
  },
]


/** Sin servicios extra por ahora: se activan desde el panel cuando existan. */
export const FALLBACK_ADDONS: Addon[] = []

export const FALLBACK_SLOTS: TimeSlot[] = [
  { id: 'sl-manana', name: 'Mañana', start_time: '11:00', end_time: '14:30', weekdays: [0, 1, 2, 3, 4, 5, 6], sort_order: 1, active: true },
  { id: 'sl-tarde', name: 'Tarde', start_time: '16:00', end_time: '19:30', weekdays: [0, 1, 2, 3, 4, 5, 6], sort_order: 2, active: true },
  { id: 'sl-noche', name: 'Noche', start_time: '20:30', end_time: '00:30', weekdays: [4, 5, 6], sort_order: 3, active: true },
]

export const FALLBACK_GALLERY: GalleryImage[] = [
  ['Salón principal', 'Salón principal decorado para un cumpleaños'],
  ['Zona de juegos', 'Galpón de juegos con inflable'],
  ['Patio', 'Patio con mesa de ping pong'],
  ['Mesa dulce', 'Mesa dulce y decoración'],
  ['Cocina de apoyo', 'Cocina de apoyo equipada'],
  ['Fachada', 'Fachada de la casa de eventos'],
].map(([caption, alt], i) => ({
  id: `g${i}`, url: realPhoto(`images/galeria-0${i + 1}.svg`) as string, alt, caption, sort_order: i + 1, active: true,
}))

export const FALLBACK_FAQS: Faq[] = [
  ['¿Cómo reservo una fecha?', 'Elige la fecha y el horario en el calendario, cuéntanos de tu evento y la solicitud te llega lista a WhatsApp. Confirmamos la disponibilidad y tu fecha queda reservada al recibir el abono.'],
  ['¿Cuánto debo abonar para confirmar?', 'El abono es del 30% del valor total. El saldo se paga el día del evento.'],
  ['¿Puedo llevar mi propia comida y torta?', 'Sí. Puedes traer tu propia comida, torta y decoración. La cocina equipada está incluida en el arriendo.'],
  ['¿Cuántas personas caben?', 'La capacidad máxima es de 60 personas.'],
  ['¿Qué pasa si necesito cambiar la fecha?', 'Puedes cambiar la fecha sin costo hasta 15 días antes del evento, sujeto a disponibilidad.'],
  ['¿El lugar es seguro para niños?', 'Sí. La zona de juegos está acondicionada para niños y el recinto es cerrado y privado durante todo tu evento.'],
].map(([question, answer], i) => ({ id: `f${i}`, question, answer, sort_order: i + 1, active: true }))
