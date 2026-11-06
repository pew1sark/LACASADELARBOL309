import type { IconName } from '../components/ui/Icon'

/** Espacios reales de la casa (fotos del recorrido, editadas en el pack 1:
 *  solo luz, color y nitidez; nada agregado ni quitado). */
export interface Space {
  title: string
  kicker: string
  text: string
  image: string
  icon: IconName
  tags: string[]
}

export const SPACES: Space[] = [
  {
    kicker: 'La casa',
    title: 'Toda la casa, solo para tu evento',
    text: 'Una casa privada en Chiguayante con acceso propio. Llegas, decoras y celebras sin compartir el espacio con nadie.',
    image: 'images/pack/pack-2/01-fachada.webp',
    icon: 'mapPin',
    tags: ['Privada', 'Hasta 60 invitados'],
  },
  {
    kicker: 'Salón principal',
    title: 'Un espacio para celebrar',
    text: 'Cielo de madera, pasto sintético y luz natural. Mesas y sillas para todos tus invitados.',
    image: 'images/pack/pack-1/02-salon-principal.webp',
    icon: 'home',
    tags: ['Mesas y sillas', 'Climatizado', 'Pasto sintético'],
  },
  {
    kicker: 'Juegos y entretención',
    title: 'Diversión en grande',
    text: 'Galpón de juegos techado y luminoso con inflable y cama elástica con malla: los niños juegan aunque llueva.',
    image: 'images/pack/pack-2/05-galpon-juegos.webp',
    icon: 'smile',
    tags: ['Inflable', 'Cama elástica'],
  },
  {
    kicker: 'Montaje',
    title: 'Listo para la celebración',
    text: 'Mesas y sillas para tus invitados: armas el salón a tu manera, con tu decoración y tu torta.',
    image: 'images/pack/pack-1/03-salon-celebracion.webp',
    icon: 'users',
    tags: ['Mesas y sillas', 'A tu estilo'],
  },
  {
    kicker: 'Para compartir',
    title: '¡Que empiece el juego!',
    text: 'Taca-taca y air hockey para grandes y chicos.',
    image: 'images/pack/pack-2/11-taca-taca.webp',
    icon: 'party',
    tags: ['Taca-taca', 'Air hockey'],
  },
  {
    kicker: 'Zona de trepar',
    title: 'Pequeñas grandes aventuras',
    text: 'Estructuras de madera con tobogán, columpio, malla y muro de escalada, más bloques gigantes para construir.',
    image: 'images/pack/pack-2/07-estructura-tobogan.webp',
    icon: 'star',
    tags: ['Tobogán', 'Muro de escalada', 'Bloques gigantes'],
  },
  {
    kicker: 'Patio',
    title: 'Más espacio para jugar',
    text: 'Mesa de ping pong y aro de básquetbol al aire libre.',
    image: 'images/pack/pack-2/13-patio-ping-pong.webp',
    icon: 'tree',
    tags: ['Ping pong', 'Básquetbol'],
  },
  {
    kicker: 'Áreas de apoyo',
    title: 'Cocina equipada',
    text: 'Refrigerador, cocina, horno y mesón para tu catering, torta o colaciones.',
    image: 'images/pack/pack-2/17-cocina-meson.webp',
    icon: 'kitchen',
    tags: ['Refrigerador', 'Cocina'],
  },
  {
    kicker: 'Versatilidad',
    title: 'Sala multiuso',
    text: 'Un espacio extra para los regalos, la torta o un rincón tranquilo para los adultos.',
    image: 'images/pack/pack-2/15-sala-multiuso.webp',
    icon: 'sparkles',
    tags: ['Regalos', 'Rincón adultos'],
  },
  {
    kicker: 'Comodidad',
    title: 'Baños funcionales',
    text: 'Baños limpios y listos para tus invitados durante todo el evento.',
    image: 'images/pack/pack-2/18-bano.webp',
    icon: 'check',
    tags: ['Siempre limpios'],
  },
]

export const IDEAS = [
  { title: 'Arco de globos', text: 'Colores a tu estilo', image: 'images/pack/pack-1/04-mesa-celebracion.webp' },
  { title: 'Mesa dulce', text: 'Donas, cupcakes y más', image: 'images/pack/pack-1/06-mesa-dulces.webp' },
  { title: 'Mesa temática', text: 'Inspiración bosque', image: 'images/pack/pack-1/05-mesa-tematica.webp' },
]

/** Catálogo fotográfico completo (pack 2 + celebraciones del pack 1), en el orden en que se recorre la casa.
 *  Se usa en la web, en el PDF y en las fichas de WhatsApp Business. */
export const CATALOGO: { title: string; text: string; image: string }[] = [
  { title: 'La casa', text: 'Casa privada en Chiguayante, solo para tu evento.', image: 'images/pack/pack-2/01-fachada.webp' },
  { title: 'Entrada', text: 'Acceso propio bajo el alero de madera.', image: 'images/pack/pack-2/19-entrada.webp' },
  { title: 'Salón principal', text: 'Cielo de madera, pasto sintético y luz natural.', image: 'images/pack/pack-2/02-salon.webp' },
  { title: 'Rincón con sillones', text: 'Para los adultos, con aire acondicionado.', image: 'images/pack/pack-2/03-sala-estar.webp' },
  { title: 'Salón de celebración', text: 'Mesas y sillas para tus invitados.', image: 'images/pack/pack-1/03-salon-celebracion.webp' },
  { title: 'Acceso al galpón', text: 'Puertas de vidrio del salón a los juegos.', image: 'images/pack/pack-2/04-puertas-galpon.webp' },
  { title: 'Galpón de juegos', text: 'Techado y luminoso, con inflable.', image: 'images/pack/pack-2/05-galpon-juegos.webp' },
  { title: 'Cama elástica', text: 'Con malla de seguridad.', image: 'images/pack/pack-2/06-cama-elastica.webp' },
  { title: 'Estructura con tobogán', text: 'Escaleras, columpio y tobogán.', image: 'images/pack/pack-2/07-estructura-tobogan.webp' },
  { title: 'Malla y escaleras', text: 'Para trepar y explorar.', image: 'images/pack/pack-2/08-estructura-trepar.webp' },
  { title: 'Muro de escalada', text: 'Agarres de colores para los peques.', image: 'images/pack/pack-2/09-muro-escalada.webp' },
  { title: 'Bloques gigantes', text: 'Para construir en grande.', image: 'images/pack/pack-2/10-bloques-gigantes.webp' },
  { title: 'Taca-taca', text: 'Para grandes y chicos.', image: 'images/pack/pack-2/11-taca-taca.webp' },
  { title: 'Air hockey', text: 'Partidas rápidas entre amigos.', image: 'images/pack/pack-2/12-air-hockey.webp' },
  { title: 'Patio', text: 'Mesa de ping pong al aire libre.', image: 'images/pack/pack-2/13-patio-ping-pong.webp' },
  { title: 'Básquetbol', text: 'Aro en el patio.', image: 'images/pack/pack-2/14-basquetbol.webp' },
  { title: 'Sala multiuso', text: 'Para regalos, torta o un rincón para adultos.', image: 'images/pack/pack-2/15-sala-multiuso.webp' },
  { title: 'Cocina', text: 'Refrigerador, cocina, horno y mesón.', image: 'images/pack/pack-2/17-cocina-meson.webp' },
  { title: 'Mesón de apoyo', text: 'Para tu catering y la torta.', image: 'images/pack/pack-2/16-cocina.webp' },
  { title: 'Baño', text: 'Limpio y listo para tus invitados.', image: 'images/pack/pack-2/18-bano.webp' },
  { title: 'Mesa de celebración', text: 'Globos y decoración a tu estilo.', image: 'images/pack/pack-1/04-mesa-celebracion.webp' },
  { title: 'Mesa temática', text: 'Una ambientación hecha en la casa.', image: 'images/pack/pack-1/05-mesa-tematica.webp' },
  { title: 'Mesa dulce', text: 'Donas, cupcakes y más.', image: 'images/pack/pack-1/06-mesa-dulces.webp' },
  { title: 'Decoración', text: 'Así se ve una fiesta en la casa.', image: 'images/pack/pack-1/17-decoracion.webp' },
]
