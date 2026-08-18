// Genera imágenes SVG de marcador de posición con la identidad de la casa.
// Reemplázalas por fotografías reales desde el panel de administración.
import { writeFileSync, mkdirSync } from 'node:fs'

mkdirSync('app/public/images', { recursive: true })

const svg = ({ w, h, from, to, accent, label, seed }) => {
  const r = (n) => {
    let x = Math.sin(seed * 9301 + n * 49297) * 233280
    return x - Math.floor(x)
  }
  const canopies = Array.from({ length: 5 }, (_, i) => {
    const cx = w * (0.1 + r(i) * 0.8)
    const cy = h * (0.18 + r(i + 10) * 0.3)
    const rr = h * (0.14 + r(i + 20) * 0.16)
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${rr.toFixed(0)}" fill="${accent}" opacity="${(0.12 + r(i + 30) * 0.16).toFixed(2)}"/>`
  }).join('')
  const trunkX = w * 0.5
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${canopies}
  <path d="M0 ${h * 0.78} Q ${w * 0.25} ${h * 0.7} ${w * 0.5} ${h * 0.76} T ${w} ${h * 0.72} L ${w} ${h} L 0 ${h} Z" fill="${accent}" opacity="0.22"/>
  <rect x="${trunkX - w * 0.018}" y="${h * 0.42}" width="${w * 0.036}" height="${h * 0.4}" rx="${w * 0.012}" fill="${accent}" opacity="0.45"/>
  <path d="M${trunkX - w * 0.11} ${h * 0.46} h ${w * 0.22} l -${w * 0.02} -${h * 0.09} h -${w * 0.18} Z" fill="${accent}" opacity="0.55"/>
  <rect x="${trunkX - w * 0.1}" y="${h * 0.46}" width="${w * 0.2}" height="${h * 0.13}" rx="${w * 0.008}" fill="${accent}" opacity="0.4"/>
  <circle cx="${trunkX}" cy="${h * 0.525}" r="${h * 0.028}" fill="${from}" opacity="0.75"/>
  <text x="${w / 2}" y="${h * 0.93}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(h * 0.055)}"
        font-weight="600" fill="#ffffff" opacity="0.85" text-anchor="middle" letter-spacing="0.06em">${label.toUpperCase()}</text>
</svg>`
}

const palettes = [
  ['#F6E7D2', '#E2C9A6', '#5A3E2B'],
  ['#DCEBDC', '#B7D5BC', '#2F6B45'],
  ['#FBE3D6', '#F2C4AA', '#C96F4A'],
  ['#EDE4F5', '#D3C1E6', '#6B4E8F'],
  ['#FDF0D5', '#F5D99B', '#B8802A'],
  ['#DEEAF3', '#B9D2E6', '#2F5A7D'],
]

const files = [
  ['hero', 'La Casa del Árbol 309', 1600, 1000, 0],
  ['og-cover', 'La Casa del Árbol 309', 1200, 630, 1],
  ['evento-infantil', 'Cumpleaños infantiles', 1200, 900, 4],
  ['evento-cumpleanos', 'Cumpleaños', 1200, 900, 2],
  ['evento-particular', 'Eventos particulares', 1200, 900, 3],
  ['pack-infantil', 'Pack Infantil', 1000, 700, 4],
  ['pack-teen', 'Pack Teen', 1000, 700, 5],
  ['pack-adultos', 'Pack Adultos', 1000, 700, 0],
  ['pack-particular', 'Pack Particular', 1000, 700, 3],
  ['galeria-01', 'Salón principal', 1200, 900, 0],
  ['galeria-02', 'Zona de juegos', 1200, 900, 4],
  ['galeria-03', 'Terraza', 1200, 900, 1],
  ['galeria-04', 'Mesa dulce', 1200, 900, 2],
  ['galeria-05', 'Cocina de apoyo', 1200, 900, 5],
  ['galeria-06', 'Fachada', 1200, 900, 3],
]

files.forEach(([name, label, w, h, p], i) => {
  const [from, to, accent] = palettes[p]
  writeFileSync(`app/public/images/${name}.svg`, svg({ w, h, from, to, accent, label, seed: i + 1 }))
})

// Favicon
writeFileSync('app/public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#2F6B45"/>
  <circle cx="32" cy="24" r="15" fill="#4E9E68"/>
  <circle cx="20" cy="30" r="10" fill="#3F8556"/>
  <circle cx="44" cy="30" r="10" fill="#3F8556"/>
  <rect x="29" y="32" width="6" height="22" rx="3" fill="#8A5A38"/>
  <rect x="22" y="34" width="20" height="13" rx="2.5" fill="#C98A4B"/>
  <path d="M20 34 L32 26 L44 34 Z" fill="#E8A33D"/>
  <rect x="29.5" y="40" width="5" height="7" rx="1" fill="#5A3E2B"/>
</svg>`)

console.log(`Generadas ${files.length} imágenes + favicon`)
