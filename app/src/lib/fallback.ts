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

export const realPhoto = <T extends string | null | undefined>(url: T): T | string =>
  (url && REAL_PHOTOS[url.replace(/^\//, '')]) || url

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
  hero_image_url: 'images/fotos/salon-principal.webp',
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

const BASE_SERVICES = [
  'Uso exclusivo del espacio',
  'Mesas y sillas para todos los invitados',
  'Decoración básica del salón',
  'Equipo de sonido',
  'Estacionamiento',
  'Aseo y ordenamiento posterior',
]

const services = (pkgId: string, extra: string[]) =>
  [...BASE_SERVICES, ...extra].map((name, i) => ({ id: `${pkgId}-s${i}`, package_id: pkgId, name, sort_order: i + 1 }))

export const FALLBACK_PACKAGES: Package[] = [
  {
    id: 'pk-infantil', slug: 'pack-infantil', name: 'Pack Cumpleaños Infantil', subtitle: 'Para los más pequeños de la casa',
    description: null, event_type_id: 'et-infantil', price: 180000, price_is_from: true, duration_hours: 3.5,
    max_guests: 40, image_url: 'images/pack-infantil.svg', badge: 'El más pedido', sort_order: 1, active: true,
    package_services: services('pk-infantil', ['Zona de juegos habilitada', 'Mobiliario infantil']),
  },
  {
    id: 'pk-teen', slug: 'pack-teen', name: 'Pack Cumpleaños Teen', subtitle: 'Adolescentes, música y buena onda',
    description: null, event_type_id: 'et-cumple', price: 220000, price_is_from: true, duration_hours: 4,
    max_guests: 45, image_url: 'images/pack-teen.svg', badge: null, sort_order: 2, active: true,
    package_services: services('pk-teen', ['Iluminación ambiental']),
  },
  {
    id: 'pk-adultos', slug: 'pack-adultos', name: 'Pack Celebración Adultos', subtitle: 'Cumpleaños y celebraciones familiares',
    description: null, event_type_id: 'et-cumple', price: 280000, price_is_from: true, duration_hours: 4.5,
    max_guests: 60, image_url: 'images/pack-adultos.svg', badge: null, sort_order: 3, active: true,
    package_services: services('pk-adultos', ['Iluminación ambiental', 'Cocina de apoyo']),
  },
  {
    id: 'pk-particular', slug: 'pack-particular', name: 'Pack Evento Particular', subtitle: 'Baby showers, bautizos y reuniones',
    description: null, event_type_id: 'et-particular', price: 200000, price_is_from: true, duration_hours: 4,
    max_guests: 50, image_url: 'images/pack-particular.svg', badge: null, sort_order: 4, active: true,
    package_services: services('pk-particular', ['Cocina de apoyo']),
  },
]

const addon = (id: string, name: string, description: string, price: number, unit: string, per_guest = false, icon: string | null = null, category = 'Otros'): Addon => ({
  id, name, description, price, unit, per_guest, icon, category, sort_order: 0, active: true,
})

export const FALLBACK_ADDONS: Addon[] = [
  addon('ad-deco', 'Decoración temática', 'Ambientación completa según el tema que elijas.', 60000, 'servicio', false, 'sparkles', 'Decoración'),
  addon('ad-anim', 'Animador infantil', 'Animación con juegos y concursos durante 2 horas.', 90000, 'servicio', false, 'smile', 'Entretención'),
  addon('ad-dj', 'DJ', 'DJ profesional con equipo propio.', 120000, 'servicio', false, 'music', 'Entretención'),
  addon('ad-foto', 'Fotografía', 'Cobertura fotográfica del evento con entrega digital.', 80000, 'servicio', false, 'camera', 'Registro'),
  addon('ad-torta', 'Torta personalizada', 'Torta a pedido según porciones y diseño.', 45000, 'unidad', false, 'cake', 'Comida'),
  addon('ad-candy', 'Candy bar', 'Mesa dulce montada y decorada.', 70000, 'servicio', false, 'candy', 'Comida'),
  addon('ad-globos', 'Globos y ambientación', 'Arco de globos y decoración de entrada.', 35000, 'servicio', false, 'balloon', 'Decoración'),
  addon('ad-pinata', 'Piñata', 'Piñata cargada con dulces y sorpresas.', 25000, 'unidad', false, 'gift', 'Entretención'),
  addon('ad-catering', 'Catering por persona', 'Servicio de comida y bebida por invitado.', 6500, 'persona', true, 'utensils', 'Comida'),
  addon('ad-hora', 'Hora extra', 'Extiende tu celebración una hora más.', 40000, 'hora', false, 'clock', 'Tiempo'),
]

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
  ['¿Cómo reservo una fecha?', 'Arma tu cotización aquí mismo: eliges evento, paquete, fecha y horario. La solicitud te llega lista a WhatsApp y nosotros confirmamos la disponibilidad. Tu fecha queda reservada al recibir el abono.'],
  ['¿Cuánto debo abonar para confirmar?', 'El abono es del 30% del valor total. El saldo se paga el día del evento.'],
  ['¿Puedo llevar mi propia comida y torta?', 'Sí. Puedes traer tu propio catering y torta, o contratar los servicios adicionales que ofrecemos.'],
  ['¿Cuántas personas caben?', 'La capacidad máxima es de 60 personas. Cada paquete indica su capacidad recomendada.'],
  ['¿Qué pasa si necesito cambiar la fecha?', 'Puedes cambiar la fecha sin costo hasta 15 días antes del evento, sujeto a disponibilidad.'],
  ['¿El lugar es seguro para niños?', 'Sí. La zona de juegos está acondicionada para niños y el recinto es cerrado y privado durante todo tu evento.'],
].map(([question, answer], i) => ({ id: `f${i}`, question, answer, sort_order: i + 1, active: true }))
