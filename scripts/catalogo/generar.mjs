// Genera el material de venta de La Casa del Árbol 309 a partir del pack de fotos:
//   app/public/catalogo/la-casa-del-arbol-309-catalogo.pdf   catálogo A4 (8 páginas)
//   app/public/catalogo/whatsapp/*.jpg                        fichas 1080×1080 para WhatsApp Business
//   app/public/catalogo/historias/*.jpg                       1080×1920 para estados / historias
//
// Uso:  node scripts/catalogo/generar.mjs
// Requiere Playwright con Chromium (ya instalado en el entorno de desarrollo).
//
// Todo lo que dice el material es información pública que ya está en la web:
// precio, abono, capacidad, horarios y preguntas frecuentes. Si cambia algo de
// eso, se cambia aquí (DATOS) y se vuelve a generar. No se inventan políticas.
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Playwright global del entorno (o el del proyecto, si se instala).
const { chromium } = createRequire(import.meta.url)('playwright')

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '../..')
const PACK = join(RAIZ, 'app/public/images/pack/pack-1')
const SALIDA = join(RAIZ, 'app/public/catalogo')

const DATOS = {
  nombre: 'La Casa del Árbol 309',
  lugar: 'Los Castaños · Chiguayante · Biobío',
  precio: '$140.000',
  abono: '30 %',
  capacidad: 60,
  whatsapp: '+56 9 5473 7249',
  instagram: '@lacasadelarbol309',
  web: 'pew1sark.github.io/LACASADELARBOL309',
  bloques: [
    ['Mañana', '11:00 – 14:30', 'Todos los días'],
    ['Tarde', '16:00 – 19:30', 'Todos los días'],
    ['Noche', '20:30 – 00:30', 'Jueves a sábado'],
  ],
}

// Fotos como data: URL para poder pasarlas a JPEG en el navegador (un PDF con
// WebP sale sin comprimir: ~55 MB; en JPEG queda en pocos MB).
const f = (n) => `data:image/webp;base64,${readFileSync(join(PACK, `${n}.webp`)).toString('base64')}`
const fuente = (n) => pathToFileURL(join(AQUI, 'fuentes', n)).href
const svg = (n) => readFileSync(join(AQUI, n), 'utf8').replace(/<\?xml[^>]*>/, '')
const logo = pathToFileURL(join(RAIZ, 'app/public/brand/logo.webp')).href

const CSS = `
@font-face{font-family:F;font-weight:400;src:url(${fuente('fraunces-latin-400-normal.woff2')})}
@font-face{font-family:F;font-weight:600;src:url(${fuente('fraunces-latin-600-normal.woff2')})}
@font-face{font-family:F;font-weight:700;src:url(${fuente('fraunces-latin-700-normal.woff2')})}
@font-face{font-family:I;font-weight:400;src:url(${fuente('inter-latin-400-normal.woff2')})}
@font-face{font-family:I;font-weight:600;src:url(${fuente('inter-latin-600-normal.woff2')})}
@font-face{font-family:I;font-weight:700;src:url(${fuente('inter-latin-700-normal.woff2')})}
:root{--crema:#fdfaf5;--hoja:#2f6b45;--bosque:#17422f;--noche:#0f2d20;--lima:#e0f890;--corteza:#3b2f25}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:I,sans-serif;color:var(--corteza);background:var(--crema);-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1,h2,h3,.d{font-family:F,serif;font-weight:600;letter-spacing:-.01em}
img{display:block;width:100%;height:100%;object-fit:cover}
.eyebrow{font:700 9pt I;letter-spacing:.18em;text-transform:uppercase;color:var(--hoja)}
`

// ---------------------------------------------------------------- PDF
const pagina = (contenido, clase = '') => `<section class="p ${clase}">${contenido}</section>`
const pie = (n) => `<footer><span>${DATOS.nombre}</span><span>${DATOS.whatsapp} · ${DATOS.instagram}</span><span>${n}</span></footer>`
const foto = (n, t, extra = '') => `<figure ${extra}><img src="${f(n)}"><figcaption>${t}</figcaption></figure>`

const PDF_CSS = `${CSS}
@page{size:A4;margin:0}
.p{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;padding:16mm 15mm 20mm}
footer{position:absolute;left:15mm;right:15mm;bottom:9mm;display:flex;justify-content:space-between;font-size:8pt;color:#8a7d70;border-top:1px solid #e8e0d4;padding-top:3mm}
figure{position:relative;border-radius:5mm;overflow:hidden;background:#eee}
figcaption{position:absolute;left:0;right:0;bottom:0;padding:9mm 5mm 4mm;color:#fff;font:600 10.5pt I;background:linear-gradient(transparent,rgba(15,45,32,.85))}
h2{font-size:28pt;line-height:1.05;color:var(--bosque);margin:2mm 0 4mm}
.lead{font-size:11pt;line-height:1.55;color:#5c4f43;max-width:150mm}
.g{display:grid;gap:4mm;margin-top:7mm}
.portada{padding:0;color:#fff}
.portada .fondo{position:absolute;inset:0}
.portada .velo{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,45,32,.55) 0%,rgba(15,45,32,.1) 35%,rgba(15,45,32,.25) 60%,rgba(15,45,32,.95) 100%)}
.portada .arriba{position:absolute;top:16mm;left:16mm;right:16mm;display:flex;align-items:center;gap:5mm}
.portada .arriba img{width:22mm;height:22mm;border-radius:5mm}
.portada .abajo{position:absolute;left:16mm;right:16mm;bottom:18mm}
.portada h1{font-size:46pt;line-height:1}
.portada .lima{color:var(--lima)}
.chips{display:flex;flex-wrap:wrap;gap:3mm;margin-top:7mm}
.chips span{border:1px solid rgba(255,255,255,.35);border-radius:99px;padding:2mm 4.5mm;font:600 9.5pt I;background:rgba(255,255,255,.1)}
.datos{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin-top:8mm}
.datos div{background:#fff;border:1px solid #ece4d8;border-radius:4mm;padding:5mm}
.datos b{display:block;font:600 19pt F;color:var(--hoja)}
.datos small{font-size:8.5pt;color:#7a6d60}
.oscura{background:var(--bosque);color:var(--crema)}
.oscura h2{color:var(--crema)} .oscura .eyebrow{color:var(--lima)} .oscura .lead{color:#d9e6dc}
.oscura footer{color:#9fb8a8;border-color:rgba(255,255,255,.15)}
.precio{display:flex;align-items:flex-end;gap:6mm;margin-top:8mm;padding:8mm;border-radius:6mm;background:var(--lima);color:var(--noche)}
.precio b{font:700 44pt F;line-height:.9}
.precio span{font-size:11pt;line-height:1.4}
table{width:100%;border-collapse:collapse;margin-top:6mm;font-size:11pt}
td{padding:4mm 0;border-bottom:1px solid rgba(255,255,255,.15)} td:last-child{text-align:right;color:#bcd0c2}
td b{font:600 13pt F}
.pasos{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin-top:7mm}
.pasos div{background:#fff;border-radius:4mm;padding:5mm;border:1px solid #ece4d8;font-size:9.5pt;line-height:1.45}
.pasos i{display:grid;place-items:center;width:8mm;height:8mm;border-radius:50%;background:var(--hoja);color:#fff;font:700 10pt I;font-style:normal;margin-bottom:3mm}
.faq{margin-top:7mm;display:grid;grid-template-columns:1fr 1fr;gap:4mm 8mm}
.faq h3{font-size:12pt;color:var(--bosque);margin-bottom:1.5mm} .faq p{font-size:9.5pt;line-height:1.5;color:#5c4f43}
.qrs{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:9mm}
.qrs div{display:flex;gap:5mm;align-items:center;background:#fff;border-radius:5mm;padding:5mm;border:1px solid #ece4d8}
.qrs svg{width:30mm;height:30mm;flex:none}
.qrs b{display:block;font:600 14pt F;color:var(--bosque);margin-bottom:1mm} .qrs span{font-size:9pt;color:#5c4f43;line-height:1.4}
`

const H = (n) => `style="height:${n}mm"`
const pdfHtml = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${PDF_CSS}</style></head><body>
${pagina(`<div class="fondo"><img src="${f('18-portada-vertical')}"></div><div class="velo"></div>
  <div class="arriba"><img src="${logo}"><div><div class="eyebrow" style="color:var(--lima)">Casa de eventos</div><div class="d" style="font-size:15pt">${DATOS.lugar}</div></div></div>
  <div class="abajo"><div class="eyebrow" style="color:var(--lima)">Catálogo del espacio</div>
  <h1>Celebra en una casa <span class="lima">solo para ti</span></h1>
  <div class="chips"><span>Casa completa</span><span>Hasta ${DATOS.capacidad} invitados</span><span>Arriendo ${DATOS.precio}</span><span>Juegos techados</span></div></div>`, 'portada')}

${pagina(`<div class="eyebrow">La casa</div><h2>Toda la casa, solo para tu evento</h2>
  <p class="lead">Una casa privada en Chiguayante pensada para celebrar en familia y entre amigos: salón, galpón de juegos techado, patio, cocina equipada, sala multiuso y baños. Arriendas el espacio completo a precio fijo, traes tu comida, tu torta y tu decoración, y solo te preocupas de disfrutar.</p>
  <div class="datos"><div><b>${DATOS.capacidad}</b><small>invitados máximo</small></div><div><b>${DATOS.precio}</b><small>arriendo, precio fijo</small></div><div><b>3,5 h</b><small>por bloque</small></div><div><b>${DATOS.abono}</b><small>de abono para reservar</small></div></div>
  <div class="g">${foto('01-fachada', 'La casa · acceso privado', H(150))}</div>${pie(2)}`)}

${pagina(`<div class="eyebrow">Salón principal</div><h2>Un espacio para celebrar</h2>
  <p class="lead">Cielo de madera, pasto sintético y luz natural. Mesas y sillas para todos tus invitados, listas para armar a tu manera.</p>
  <div class="g">${foto('02-salon-principal', 'Salón principal', H(112))}${foto('03-salon-celebracion', 'Salón armado para una celebración', H(98))}</div>${pie(3)}`)}

${pagina(`<div class="eyebrow">Ideas de ambientación</div><h2>Una fiesta a su estilo</h2>
  <p class="lead">Así se han visto celebraciones reales en la casa. La decoración, la mesa dulce y la torta las pones tú (o tu proveedor de confianza).</p>
  <div class="g" style="grid-template-columns:1fr 1fr">${foto('04-mesa-celebracion', 'Mesa de celebración', H(104))}${foto('05-mesa-tematica', 'Mesa temática', H(104))}${foto('06-mesa-dulces', 'Mesa dulce', H(104))}${foto('17-decoracion', 'Decoración', H(104))}</div>${pie(4)}`)}

${pagina(`<div class="eyebrow">Juegos y entretención</div><h2>Diversión en grande, aunque llueva</h2>
  <p class="lead">Galpón de juegos techado con inflable y cama elástica, juegos de madera, bloques gigantes, taca-taca y air hockey para grandes y chicos.</p>
  <div class="g" style="grid-template-columns:1fr 1fr">${foto('07-galpon-inflable', 'Galpón de juegos techado', 'style="grid-column:span 2;height:84mm"')}${foto('08-juegos-madera', 'Juegos de madera', H(62))}${foto('09-bloques-gigantes', 'Bloques gigantes', H(62))}${foto('10-taca-taca', 'Taca-taca', H(62))}${foto('11-air-hockey', 'Air hockey', H(62))}</div>${pie(5)}`)}

${pagina(`<div class="eyebrow">Patio y áreas de apoyo</div><h2>Todo lo que tu evento necesita</h2>
  <p class="lead">Patio con ping pong y básquetbol al aire libre, cocina con refrigerador y mesón para tu catering, sala multiuso para regalos o un rincón para adultos, y baños listos para tus invitados.</p>
  <div class="g" style="grid-template-columns:1fr 1fr">${foto('12-patio', 'Patio · ping pong', H(66))}${foto('13-basquetbol', 'Básquetbol', H(66))}${foto('14-cocina', 'Cocina equipada', H(66))}${foto('15-sala-multiuso', 'Sala multiuso', H(66))}${foto('16-banos', 'Baños', 'style="grid-column:span 2;height:52mm"')}</div>${pie(6)}`)}

${pagina(`<div class="eyebrow">Arriendo</div><h2>Un precio, la casa completa</h2>
  <p class="lead">Sin paquetes confusos: arriendas todo el espacio para tu evento por un bloque de 3,5 horas.</p>
  <div class="precio"><b>${DATOS.precio}</b><span>Arriendo de la casa completa<br>Hasta ${DATOS.capacidad} invitados · reserva con ${DATOS.abono} de abono, saldo el día del evento</span></div>
  <h3 class="d" style="margin-top:12mm;font-size:16pt">Horarios disponibles</h3>
  <table>${DATOS.bloques.map(([n, h, d]) => `<tr><td><b>${n}</b></td><td>${h}</td><td>${d}</td></tr>`).join('')}</table>
  <div class="g" style="grid-template-columns:1fr 1fr;margin-top:12mm">${foto('02-salon-principal', 'Salón', H(62))}${foto('07-galpon-inflable', 'Juegos', H(62))}</div>${pie(7)}`, 'oscura')}

${pagina(`<div class="eyebrow">Cómo reservar</div><h2>Tu fecha en 4 pasos</h2>
  <div class="pasos"><div><i>1</i>Elige fecha y horario en la agenda de la web.</div><div><i>2</i>Cuéntanos de tu evento: la solicitud llega lista a WhatsApp.</div><div><i>3</i>Confirmamos la disponibilidad el mismo día.</div><div><i>4</i>Con el abono del ${DATOS.abono} tu fecha queda reservada.</div></div>
  <h3 class="d" style="margin-top:10mm;font-size:16pt;color:var(--bosque)">Preguntas frecuentes</h3>
  <div class="faq">
    <div><h3>¿Puedo llevar mi comida y torta?</h3><p>Sí. Traes tu comida, torta y decoración. La cocina equipada está incluida.</p></div>
    <div><h3>¿Cuántas personas caben?</h3><p>La capacidad máxima es de ${DATOS.capacidad} personas.</p></div>
    <div><h3>¿Cuánto abono para confirmar?</h3><p>El ${DATOS.abono} del valor total. El saldo se paga el día del evento.</p></div>
    <div><h3>¿Y si necesito cambiar la fecha?</h3><p>Sin costo hasta 15 días antes del evento, sujeto a disponibilidad.</p></div>
    <div><h3>¿Es seguro para niños?</h3><p>Sí. La zona de juegos está acondicionada y el recinto es cerrado y privado durante tu evento.</p></div>
    <div><h3>¿Cómo sé el estado de mi reserva?</h3><p>Con tu código de reserva lo revisas en la web cuando quieras.</p></div>
  </div>
  <div class="qrs"><div>${svg('qr-web.svg')}<p><b>Ver fechas libres</b><span>Escanea y elige tu fecha en la agenda en línea.</span></p></div>
  <div>${svg('qr-whatsapp.svg')}<p><b>Escríbenos</b><span>WhatsApp ${DATOS.whatsapp}<br>Instagram ${DATOS.instagram}</span></p></div></div>${pie(8)}`)}
</body></html>`

// ---------------------------------------------------------------- Fichas
const FICHA_CSS = `${CSS}
html,body{width:1080px;height:1080px;overflow:hidden}
.c{position:relative;width:1080px;height:1080px}
.c>img{position:absolute;inset:0}
.velo{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,45,32,0) 45%,rgba(15,45,32,.92) 100%)}
.marca{position:absolute;top:40px;left:40px;display:flex;align-items:center;gap:16px;background:rgba(253,250,245,.94);border-radius:24px;padding:12px 22px 12px 12px;font:600 26px F;color:var(--bosque)}
.marca img{width:60px;height:60px;border-radius:14px}
.txt{position:absolute;left:56px;right:56px;bottom:52px;color:#fff}
.txt .k{font:700 24px I;letter-spacing:.16em;text-transform:uppercase;color:var(--lima)}
.txt h1{font-size:76px;line-height:1;margin-top:10px}
.txt p{font-size:30px;margin-top:14px;color:#e4efe7}
.pill{display:inline-block;margin-top:22px;background:var(--lima);color:var(--noche);border-radius:99px;padding:14px 30px;font:700 34px I}
`
const ficha = (img, kicker, titulo, texto, pill = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${FICHA_CSS}</style></head><body><div class="c">
<img src="${f(img)}"><div class="velo"></div><div class="marca"><img src="${logo}">${DATOS.nombre}</div>
<div class="txt"><div class="k">${kicker}</div><h1>${titulo}</h1>${texto ? `<p>${texto}</p>` : ''}${pill ? `<span class="pill">${pill}</span>` : ''}</div></div></body></html>`

const HIST_CSS = FICHA_CSS.replace('html,body{width:1080px;height:1080px', 'html,body{width:1080px;height:1920px').replace('.c{position:relative;width:1080px;height:1080px}', '.c{position:relative;width:1080px;height:1920px}')
const historia = (img, kicker, titulo, texto, pill) => ficha(img, kicker, titulo, texto, pill).replace(FICHA_CSS, HIST_CSS)

// [archivo, foto, kicker, título, texto, pill]
const FICHAS = [
  ['00-arriendo-casa-completa', '02-salon-principal', 'Arriendo', 'La casa completa, solo para tu evento', `Hasta ${DATOS.capacidad} invitados · bloque de 3,5 h`, DATOS.precio],
  ['01-bloque-manana', '01-fachada', 'Bloque mañana', '11:00 – 14:30', 'Todos los días · casa completa', DATOS.precio],
  ['02-bloque-tarde', '03-salon-celebracion', 'Bloque tarde', '16:00 – 19:30', 'Todos los días · casa completa', DATOS.precio],
  ['03-bloque-noche', '17-decoracion', 'Bloque noche', '20:30 – 00:30', 'Jueves a sábado · casa completa', DATOS.precio],
  ['10-salon-principal', '02-salon-principal', 'Salón principal', 'Un espacio para celebrar', 'Cielo de madera, pasto sintético y luz natural'],
  ['11-salon-celebracion', '03-salon-celebracion', 'Montaje', 'Mesas y sillas para todos', 'Armas el salón a tu manera'],
  ['12-galpon-juegos', '07-galpon-inflable', 'Juegos', 'Galpón techado', 'Inflable y cama elástica, aunque llueva'],
  ['13-juegos-madera', '08-juegos-madera', 'Juegos', 'Juegos de madera', 'Para trepar y explorar'],
  ['14-bloques-gigantes', '09-bloques-gigantes', 'Juegos', 'Bloques gigantes', 'Para construir en grande'],
  ['15-taca-taca', '10-taca-taca', 'Juegos', 'Taca-taca', 'Para grandes y chicos'],
  ['16-air-hockey', '11-air-hockey', 'Juegos', 'Air hockey', 'Partidas rápidas entre amigos'],
  ['17-patio', '12-patio', 'Patio', 'Ping pong al aire libre', 'Más espacio para jugar'],
  ['18-basquetbol', '13-basquetbol', 'Patio', 'Básquetbol', 'Aro en el patio'],
  ['19-cocina', '14-cocina', 'Áreas de apoyo', 'Cocina equipada', 'Refrigerador, cocina y mesón'],
  ['20-sala-multiuso', '15-sala-multiuso', 'Áreas de apoyo', 'Sala multiuso', 'Regalos, torta o rincón para adultos'],
  ['21-banos', '16-banos', 'Comodidad', 'Baños', 'Limpios y listos para tus invitados'],
  ['22-mesa-celebracion', '04-mesa-celebracion', 'Ideas', 'Mesa de celebración', 'Globos y decoración a tu estilo'],
  ['23-mesa-tematica', '05-mesa-tematica', 'Ideas', 'Mesa temática', 'Una ambientación hecha en la casa'],
  ['24-mesa-dulce', '06-mesa-dulces', 'Ideas', 'Mesa dulce', 'Donas, cupcakes y más'],
  ['25-la-casa', '01-fachada', 'La casa', 'Casa privada en Chiguayante', DATOS.lugar],
]
const HISTORIAS = [
  ['01-portada', '18-portada-vertical', 'Casa de eventos · Chiguayante', 'Celebra en una casa solo para ti', `Casa completa · hasta ${DATOS.capacidad} invitados`, `Arriendo ${DATOS.precio}`],
  ['02-juegos', '07-galpon-inflable', 'Juegos techados', 'Diversión aunque llueva', 'Inflable, cama elástica, taca-taca y más', 'Reserva por WhatsApp'],
  ['03-salon', '02-salon-principal', 'Salón principal', 'Tu fiesta, a tu estilo', 'Trae tu comida, torta y decoración', 'Ver fechas libres'],
]

mkdirSync(join(SALIDA, 'whatsapp'), { recursive: true })
mkdirSync(join(SALIDA, 'historias'), { recursive: true })
const tmp = join(SALIDA, '.tmp.html')
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const cargar = async (html) => {
    writeFileSync(tmp, html)
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
  }

  await cargar(pdfHtml)
  await page.evaluate(async () => {
    for (const img of [...document.images]) {
      if (!img.src.startsWith('data:image/webp')) continue
      await img.decode()
      const k = Math.min(1, 1500 / Math.max(img.naturalWidth, img.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      img.src = c.toDataURL('image/jpeg', 0.8)
      await img.decode()
    }
  })
  await page.pdf({ path: join(SALIDA, 'la-casa-del-arbol-309-catalogo.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true })
  console.log('PDF listo')

  await page.setViewportSize({ width: 1080, height: 1080 })
  for (const [archivo, ...resto] of FICHAS) {
    await cargar(ficha(...resto))
    await page.screenshot({ path: join(SALIDA, 'whatsapp', `${archivo}.jpg`), type: 'jpeg', quality: 86 })
  }
  console.log(`${FICHAS.length} fichas de WhatsApp listas`)

  await page.setViewportSize({ width: 1080, height: 1920 })
  for (const [archivo, ...resto] of HISTORIAS) {
    await cargar(historia(...resto))
    await page.screenshot({ path: join(SALIDA, 'historias', `${archivo}.jpg`), type: 'jpeg', quality: 86 })
  }
  console.log(`${HISTORIAS.length} historias listas`)
} finally {
  await browser.close()
  try { (await import('node:fs')).unlinkSync(tmp) } catch {}
}
