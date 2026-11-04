import type { IconName } from '../components/ui/Icon'

/** Espacios reales de la casa, tomados del recorrido en video. */
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
    kicker: 'Salón principal',
    title: 'Un espacio para celebrar',
    text: 'Cielo de madera, pasto sintético y luz natural. Mesas y sillas para todos tus invitados.',
    image: 'images/fotos/salon-principal.webp',
    icon: 'home',
    tags: ['Mesas y sillas', 'Climatizado', 'Pasto sintético'],
  },
  {
    kicker: 'Juegos y entretención',
    title: 'Diversión en grande',
    text: 'Galpón de juegos techado con inflable y cama elástica: los niños juegan aunque llueva.',
    image: 'images/fotos/juegos-inflable.webp',
    icon: 'smile',
    tags: ['Inflable', 'Cama elástica'],
  },
  {
    kicker: 'Para compartir',
    title: '¡Que empiece el juego!',
    text: 'Taca-taca y air hockey para grandes y chicos.',
    image: 'images/fotos/taca-taca.webp',
    icon: 'party',
    tags: ['Taca-taca', 'Air hockey'],
  },
  {
    kicker: 'Explorar y crear',
    title: 'Pequeñas grandes aventuras',
    text: 'Bloques gigantes para construir y juegos de madera para trepar.',
    image: 'images/fotos/bloques-gigantes.webp',
    icon: 'star',
    tags: ['Bloques gigantes', 'Juegos de madera'],
  },
  {
    kicker: 'Patio',
    title: 'Más espacio para jugar',
    text: 'Mesa de ping pong y aro de básquetbol al aire libre.',
    image: 'images/fotos/patio-pingpong.webp',
    icon: 'tree',
    tags: ['Ping pong', 'Básquetbol'],
  },
  {
    kicker: 'Áreas de apoyo',
    title: 'Cocina equipada',
    text: 'Refrigerador, cocina y mesón para tu catering, torta o colaciones.',
    image: 'images/fotos/cocina.webp',
    icon: 'kitchen',
    tags: ['Refrigerador', 'Cocina'],
  },
  {
    kicker: 'Versatilidad',
    title: 'Sala multiuso',
    text: 'Un espacio extra para la mesa dulce, los regalos o un rincón para los adultos.',
    image: 'images/fotos/sala-multiuso.webp',
    icon: 'sparkles',
    tags: ['Mesa dulce', 'Regalos'],
  },
  {
    kicker: 'Comodidad',
    title: 'Baños funcionales',
    text: 'Baños limpios y listos para tus invitados durante todo el evento.',
    image: 'images/fotos/banos.webp',
    icon: 'check',
    tags: ['Siempre limpios'],
  },
]

export const IDEAS = [
  { title: 'Arco de globos', text: 'Colores a tu estilo', image: 'images/fotos/mesa-globos.webp' },
  { title: 'Mesa dulce', text: 'Donas, cupcakes y más', image: 'images/fotos/mesa-dulce.webp' },
  { title: 'Mesa temática', text: 'Inspiración bosque', image: 'images/fotos/mesa-tematica.webp' },
]
