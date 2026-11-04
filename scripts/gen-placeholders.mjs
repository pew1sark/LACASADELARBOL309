// Genera las ilustraciones de marca que se usan mientras no haya fotos reales.
// Todas siguen la identidad de La Casa del Árbol 309 (paleta y logo de
// app/src/components/brand/Logo.tsx). Las fotos reales se suben desde el panel.
//
//   node scripts/gen-placeholders.mjs
import { writeFileSync, mkdirSync } from 'node:fs'

mkdirSync('app/public/images', { recursive: true })

const C = {
  leaf900: '#1E442C', leaf700: '#2F6B45', leaf600: '#3F8556', leaf500: '#4E9E68', leaf100: '#D8ECDF',
  cream50: '#FDFAF5', cream100: '#F9F2E8', cream200: '#F1E5D3',
  sun400: '#E8A33D', sun100: '#FDF0D5', terra500: '#C96F4A', terra400: '#D98A68',
  bark900: '#3B2A21', bark700: '#5A3E2B', bark500: '#8A6A52',
}

// Fondos de la paleta: [cielo arriba, cielo abajo, suelo, acento]
const SCENES = {
  leaf: [C.leaf100, '#BFDDC9', C.leaf600, C.sun400],
  sun: [C.sun100, '#F7DDA6', C.leaf600, C.terra500],
  terra: ['#FBE6DA', '#F2C9B1', C.leaf700, C.sun400],
  dusk: [C.leaf900, '#2B5A3B', '#173622', C.sun400],
  cream: [C.cream100, C.cream200, C.leaf600, C.terra500],
}

const rnd = (seed) => (n) => {
  const x = Math.sin(seed * 9301 + n * 49297) * 233280
  return x - Math.floor(x)
}

// Pequeños motivos que cuentan de qué trata cada imagen.
const MOTIFS = {
  cake: (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-30" y="-10" width="60" height="34" rx="6" fill="${C.cream50}"/><rect x="-30" y="2" width="60" height="6" fill="${c}"/><rect x="-2" y="-26" width="4" height="16" rx="2" fill="${C.sun400}"/><circle cx="0" cy="-30" r="4" fill="${C.terra500}"/></g>`,
  balloons: (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 10 Q-10 40 -4 60 M14 6 Q10 40 4 60" stroke="${C.bark700}" stroke-width="1.5" fill="none" opacity=".5"/><ellipse cx="-14" cy="-10" rx="16" ry="20" fill="${c}"/><ellipse cx="14" cy="-14" rx="16" ry="20" fill="${C.sun400}"/></g>`,
  notes: (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="-12" cy="20" r="8"/><circle cx="16" cy="14" r="8"/><path d="M-5 20V-16l28-6v36" stroke="${c}" stroke-width="4" fill="none"/></g>`,
  heart: (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 18-22-4a13 13 0 0 1 22-14 13 13 0 0 1 22 14Z" fill="${c}"/></g>`,
  star: (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="m0-24 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2Z" fill="${c}"/></g>`,
  lights: (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-80 0 Q0 30 80 0" stroke="${C.bark700}" stroke-width="2" fill="none" opacity=".5"/>${[-60, -30, 0, 30, 60].map((dx, i) => `<circle cx="${dx}" cy="${Math.round(14 - Math.abs(dx) / 6)}" r="6" fill="${i % 2 ? c : C.sun400}"/>`).join('')}</g>`,
}

function scene({ w, h, palette, label, seed, motif }) {
  const [skyA, skyB, ground, accent] = SCENES[palette]
  const r = rnd(seed)
  const dark = palette === 'dusk'
  const cx = w * 0.5
  const base = h * 0.8
  const tree = Math.min(w, h) * 0.34
  const confetti = Array.from({ length: 18 }, (_, i) => {
    const x = (r(i) * w).toFixed(0)
    const y = (r(i + 40) * h * 0.6).toFixed(0)
    const col = [C.sun400, C.terra400, C.leaf500, C.cream50][i % 4]
    return i % 3
      ? `<circle cx="${x}" cy="${y}" r="${(3 + r(i + 80) * 4).toFixed(1)}" fill="${col}" opacity="${dark ? 0.7 : 0.55}"/>`
      : `<rect x="${x}" y="${y}" width="10" height="4" rx="2" fill="${col}" opacity=".55" transform="rotate(${(r(i + 9) * 180).toFixed(0)} ${x} ${y})"/>`
  }).join('')
  const m = MOTIFS[motif]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label || 'La Casa del Árbol 309'}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyA}"/><stop offset="1" stop-color="${skyB}"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".45" r=".5"><stop offset="0" stop-color="${C.sun400}" stop-opacity="${dark ? 0.35 : 0.25}"/><stop offset="1" stop-color="${C.sun400}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <circle cx="${cx}" cy="${h * 0.45}" r="${Math.max(w, h) * 0.45}" fill="url(#glow)"/>
  ${confetti}
  <path d="M0 ${base} Q ${w * 0.3} ${base - h * 0.06} ${w * 0.55} ${base - h * 0.01} T ${w} ${base - h * 0.04} V ${h} H 0Z" fill="${ground}"/>
  <path d="M0 ${base + h * 0.05} Q ${w * 0.4} ${base} ${w} ${base + h * 0.06} V ${h} H 0Z" fill="${C.leaf900}" opacity=".25"/>
  <g transform="translate(${cx} ${base})">
    <rect x="${-tree * 0.07}" y="${-tree * 1.15}" width="${tree * 0.14}" height="${tree * 1.15}" rx="${tree * 0.05}" fill="${C.bark500}"/>
    <circle cx="0" cy="${-tree * 1.55}" r="${tree * 0.62}" fill="${C.leaf500}"/>
    <circle cx="${-tree * 0.55}" cy="${-tree * 1.25}" r="${tree * 0.46}" fill="${C.leaf600}"/>
    <circle cx="${tree * 0.55}" cy="${-tree * 1.25}" r="${tree * 0.46}" fill="${C.leaf600}"/>
    <path d="M${-tree * 0.5} ${-tree * 0.98} L0 ${-tree * 1.36} L${tree * 0.5} ${-tree * 0.98}Z" fill="${C.sun400}"/>
    <rect x="${-tree * 0.42}" y="${-tree * 1.0}" width="${tree * 0.84}" height="${tree * 0.5}" rx="${tree * 0.06}" fill="${C.cream50}"/>
    <rect x="${-tree * 0.09}" y="${-tree * 0.8}" width="${tree * 0.18}" height="${tree * 0.3}" rx="${tree * 0.04}" fill="${C.bark700}"/>
    <circle cx="${-tree * 0.26}" cy="${-tree * 0.8}" r="${tree * 0.06}" fill="${C.sun400}"/>
    <circle cx="${tree * 0.26}" cy="${-tree * 0.8}" r="${tree * 0.06}" fill="${C.sun400}"/>
    <path d="M${-tree * 0.5} 0 L${-tree * 0.12} ${-tree * 0.5} M${-tree * 0.42} ${-tree * 0.12} H${-tree * 0.22} M${-tree * 0.34} ${-tree * 0.26} H${-tree * 0.16}" stroke="${C.bark700}" stroke-width="${tree * 0.03}" stroke-linecap="round" opacity=".7"/>
  </g>
  ${m ? m(w * 0.2, h * 0.32, Math.min(w, h) / 420, accent) + m(w * 0.8, h * 0.36, Math.min(w, h) / 520, C.terra500) : ''}
  ${label ? `<g transform="translate(${w / 2} ${h * 0.935})">
    <rect x="${-label.length * h * 0.016 - h * 0.04}" y="${-h * 0.045}" width="${label.length * h * 0.032 + h * 0.08}" height="${h * 0.075}" rx="${h * 0.0375}" fill="${C.cream50}" opacity=".92"/>
    <text y="${h * 0.012}" font-family="Fraunces, Georgia, 'Times New Roman', serif" font-size="${Math.round(h * 0.042)}" font-weight="600" fill="${C.leaf900}" text-anchor="middle">${label}</text>
  </g>` : ''}
</svg>`
}

const files = [
  ['hero', '', 1600, 1000, 'dusk', 'lights'],
  ['evento-infantil', 'Cumpleaños infantiles', 1200, 900, 'sun', 'balloons'],
  ['evento-cumpleanos', 'Cumpleaños', 1200, 900, 'terra', 'cake'],
  ['evento-particular', 'Eventos particulares', 1200, 900, 'leaf', 'heart'],
  ['pack-infantil', 'Pack Infantil', 1000, 700, 'sun', 'balloons'],
  ['pack-teen', 'Pack Teen', 1000, 700, 'dusk', 'notes'],
  ['pack-adultos', 'Pack Adultos', 1000, 700, 'terra', 'lights'],
  ['pack-particular', 'Pack Particular', 1000, 700, 'leaf', 'heart'],
  ['galeria-01', 'Salón principal', 1200, 900, 'cream', 'lights'],
  ['galeria-02', 'Zona de juegos', 1200, 900, 'sun', 'balloons'],
  ['galeria-03', 'Terraza', 1200, 900, 'dusk', 'star'],
  ['galeria-04', 'Mesa dulce', 1200, 900, 'terra', 'cake'],
  ['galeria-05', 'Cocina de apoyo', 1200, 900, 'leaf', 'star'],
  ['galeria-06', 'Fachada', 1200, 900, 'cream', 'heart'],
]

files.forEach(([name, label, w, h, palette, motif], i) => {
  writeFileSync(`app/public/images/${name}.svg`, scene({ w, h, palette, label, seed: i + 3, motif }))
})

// Isotipo (igual que <LogoMark/>)
const mark = (size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <rect width="64" height="64" rx="16" fill="${C.leaf700}"/>
  <circle cx="32" cy="22" r="13" fill="${C.leaf500}"/>
  <circle cx="20.5" cy="28" r="9.5" fill="${C.leaf600}"/>
  <circle cx="43.5" cy="28" r="9.5" fill="${C.leaf600}"/>
  <rect x="29.5" y="36" width="5" height="18" rx="2.5" fill="${C.bark500}"/>
  <path d="M21 37.5 32 29.5l11 8Z" fill="${C.sun400}"/>
  <rect x="23" y="37" width="18" height="11" rx="2" fill="${C.cream50}"/>
  <rect x="29.6" y="41" width="4.8" height="7" rx="1.2" fill="${C.bark700}"/>
  <circle cx="26.3" cy="41.3" r="1.4" fill="${C.sun400}"/>
</svg>`
writeFileSync('app/public/favicon.svg', mark())

// Imagen para compartir en redes (1200×630). Se convierte a PNG con
// scripts/og-png.cjs porque Facebook no acepta SVG.
const inner = mark(150).replace(/^<svg[^>]*>|<\/svg>$/g, '')
writeFileSync('app/public/images/og-cover.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs><radialGradient id="g" cx=".8" cy=".2" r=".7"><stop offset="0" stop-color="${C.sun400}" stop-opacity=".25"/><stop offset="1" stop-color="${C.sun400}" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="630" fill="${C.leaf900}"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1080" cy="560" r="220" fill="${C.leaf700}" opacity=".5"/>
  <circle cx="960" cy="640" r="160" fill="${C.leaf600}" opacity=".4"/>
  <g transform="translate(90 90) scale(2.2)">${inner}</g>
  <text x="90" y="350" font-family="Fraunces, Georgia, serif" font-size="74" font-weight="600" fill="${C.cream50}">La Casa del Árbol <tspan fill="${C.sun400}">309</tspan></text>
  <text x="92" y="420" font-family="Inter, Arial, sans-serif" font-size="34" fill="${C.cream200}">Cumpleaños, celebraciones y eventos privados</text>
  <rect x="90" y="470" width="470" height="70" rx="35" fill="${C.sun400}"/>
  <text x="325" y="516" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="${C.bark900}" text-anchor="middle">Cotiza y agenda en 1 minuto</text>
  <text x="1110" y="90" font-family="Inter, Arial, sans-serif" font-size="26" fill="${C.cream200}" text-anchor="end">@lacasadelarbol309</text>
</svg>`)

console.log(`Generadas ${files.length} ilustraciones, favicon e imagen para redes`)
