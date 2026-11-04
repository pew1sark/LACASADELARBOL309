import type { IconName } from '../components/ui/Icon'

/** Íconos disponibles para extras y servicios en el panel. */
export const PICKABLE_ICONS: IconName[] = [
  'sparkles', 'balloon', 'party', 'cake', 'candy', 'gift', 'utensils', 'kitchen', 'music', 'speaker',
  'camera', 'smile', 'baby', 'heart', 'star', 'clock', 'users', 'chair', 'table', 'lightbulb',
  'car', 'broom', 'shield', 'tree', 'wifi', 'snow', 'home', 'check',
]

/** Reglas de palabra clave → ícono para los servicios incluidos en un paquete.
 *  El orden importa: la primera coincidencia gana. */
const RULES: [RegExp, IconName][] = [
  [/exclusiv|privad|casa completa|espacio/i, 'home'],
  [/mesa|mantel/i, 'table'],
  [/silla/i, 'chair'],
  [/decora|ambienta|globo/i, 'sparkles'],
  [/sonido|parlante|audio/i, 'speaker'],
  [/m[uú]sica|dj/i, 'music'],
  [/ilumina|luz|luces/i, 'lightbulb'],
  [/estaciona/i, 'car'],
  [/aseo|limpi|orden/i, 'broom'],
  [/juego|infantil|ni[nñ]o/i, 'smile'],
  [/cocina|horno|refri/i, 'kitchen'],
  [/comida|catering|bebida|coctel|cóctel/i, 'utensils'],
  [/torta|pastel/i, 'cake'],
  [/dulce|candy/i, 'candy'],
  [/foto|video/i, 'camera'],
  [/wifi|internet/i, 'wifi'],
  [/clima|aire|calefac/i, 'snow'],
  [/segur|vigil/i, 'shield'],
  [/terraza|jard[ií]n|patio|árbol|arbol/i, 'tree'],
  [/hora|tiempo/i, 'clock'],
  [/invitad|persona/i, 'users'],
]

export function serviceIcon(name: string): IconName {
  for (const [re, icon] of RULES) if (re.test(name)) return icon
  return 'check'
}

const VALID = new Set<string>(PICKABLE_ICONS)
export const addonIcon = (icon: string | null | undefined, name = ''): IconName =>
  icon && VALID.has(icon) ? (icon as IconName) : serviceIcon(name) === 'check' ? 'sparkles' : serviceIcon(name)
