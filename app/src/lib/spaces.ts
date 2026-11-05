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
    image: 'images/pack/pack-1/01-fachada.webp',
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
    text: 'Galpón de juegos techado con inflable y cama elástica: los niños juegan aunque llueva.',
    image: 'images/pack/pack-1/07-galpon-inflable.webp',
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
    image: 'images/pack/pack-1/10-taca-taca.webp',
    icon: 'party',
    tags: ['Taca-taca', 'Air hockey'],
  },
  {
    kicker: 'Explorar y crear',
    title: 'Pequeñas grandes aventuras',
    text: 'Bloques gigantes para construir y juegos de madera para trepar.',
    image: 'images/pack/pack-1/09-bloques-gigantes.webp',
    icon: 'star',
    tags: ['Bloques gigantes', 'Juegos de madera'],
  },
  {
    kicker: 'Patio',
    title: 'Más espacio para jugar',
    text: 'Mesa de ping pong y aro de básquetbol al aire libre.',
    image: 'images/pack/pack-1/12-patio.webp',
    icon: 'tree',
    tags: ['Ping pong', 'Básquetbol'],
  },
  {
    kicker: 'Áreas de apoyo',
    title: 'Cocina equipada',
    text: 'Refrigerador, cocina y mesón para tu catering, torta o colaciones.',
    image: 'images/pack/pack-1/14-cocina.webp',
    icon: 'kitchen',
    tags: ['Refrigerador', 'Cocina'],
  },
  {
    kicker: 'Versatilidad',
    title: 'Sala multiuso',
    text: 'Un espacio extra para los regalos, la torta o un rincón tranquilo para los adultos.',
    image: 'images/pack/pack-1/15-sala-multiuso.webp',
    icon: 'sparkles',
    tags: ['Regalos', 'Rincón adultos'],
  },
  {
    kicker: 'Comodidad',
    title: 'Baños funcionales',
    text: 'Baños limpios y listos para tus invitados durante todo el evento.',
    image: 'images/pack/pack-1/16-banos.webp',
    icon: 'check',
    tags: ['Siempre limpios'],
  },
]

export const IDEAS = [
  { title: 'Arco de globos', text: 'Colores a tu estilo', image: 'images/pack/pack-1/04-mesa-celebracion.webp' },
  { title: 'Mesa dulce', text: 'Donas, cupcakes y más', image: 'images/pack/pack-1/06-mesa-dulces.webp' },
  { title: 'Mesa temática', text: 'Inspiración bosque', image: 'images/pack/pack-1/05-mesa-tematica.webp' },
]

/** Catálogo fotográfico completo (pack 1), en el orden en que se recorre la casa.
 *  Se usa en la web, en el PDF y en las fichas de WhatsApp Business. */
export const CATALOGO: { title: string; text: string; image: string }[] = [
  { title: 'La casa', text: 'Casa privada en Chiguayante, solo para tu evento.', image: 'images/pack/pack-1/01-fachada.webp' },
  { title: 'Salón principal', text: 'Cielo de madera, pasto sintético y luz natural.', image: 'images/pack/pack-1/02-salon-principal.webp' },
  { title: 'Salón de celebración', text: 'Mesas y sillas para tus invitados.', image: 'images/pack/pack-1/03-salon-celebracion.webp' },
  { title: 'Mesa de celebración', text: 'Globos y decoración a tu estilo.', image: 'images/pack/pack-1/04-mesa-celebracion.webp' },
  { title: 'Mesa temática', text: 'Una ambientación hecha en la casa.', image: 'images/pack/pack-1/05-mesa-tematica.webp' },
  { title: 'Mesa dulce', text: 'Donas, cupcakes y más.', image: 'images/pack/pack-1/06-mesa-dulces.webp' },
  { title: 'Galpón de juegos', text: 'Techado, con inflable y cama elástica.', image: 'images/pack/pack-1/07-galpon-inflable.webp' },
  { title: 'Juegos de madera', text: 'Para trepar y explorar.', image: 'images/pack/pack-1/08-juegos-madera.webp' },
  { title: 'Bloques gigantes', text: 'Para construir en grande.', image: 'images/pack/pack-1/09-bloques-gigantes.webp' },
  { title: 'Taca-taca', text: 'Para grandes y chicos.', image: 'images/pack/pack-1/10-taca-taca.webp' },
  { title: 'Air hockey', text: 'Partidas rápidas entre amigos.', image: 'images/pack/pack-1/11-air-hockey.webp' },
  { title: 'Patio', text: 'Mesa de ping pong al aire libre.', image: 'images/pack/pack-1/12-patio.webp' },
  { title: 'Básquetbol', text: 'Aro en el patio.', image: 'images/pack/pack-1/13-basquetbol.webp' },
  { title: 'Cocina', text: 'Refrigerador, cocina y mesón para tu catering.', image: 'images/pack/pack-1/14-cocina.webp' },
  { title: 'Sala multiuso', text: 'Para regalos, torta o un rincón para adultos.', image: 'images/pack/pack-1/15-sala-multiuso.webp' },
  { title: 'Baños', text: 'Limpios y listos para tus invitados.', image: 'images/pack/pack-1/16-banos.webp' },
  { title: 'Decoración', text: 'Así se ve una fiesta en la casa.', image: 'images/pack/pack-1/17-decoracion.webp' },
]
