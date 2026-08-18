/** Resuelve rutas de imagen guardadas en la base de datos.
 *  Acepta URLs absolutas (fotos reales subidas a un CDN) y rutas
 *  relativas del proyecto, respetando el base path del despliegue. */
export function asset(path?: string | null): string {
  if (!path) return `${import.meta.env.BASE_URL}images/hero.svg`
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
