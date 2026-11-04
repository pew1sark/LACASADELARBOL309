// Genera la imagen para compartir en redes/WhatsApp (1200×630 PNG) con una
// foto real y el logo oficial.   node scripts/og-png.cjs
const path = require('node:path')
const { chromium } = require('playwright')
const fs = require('node:fs')
// Se incrustan como data: porque una página en blanco no puede leer file://
const pub = (p) => `data:image/webp;base64,${fs.readFileSync(path.resolve('app/public', p)).toString('base64')}`
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
  await p.setContent(`<!doctype html><html><head><style>
    body{margin:0;width:1200px;height:630px;font-family:Inter,Arial,sans-serif;overflow:hidden;position:relative;background:#17422F}
    .bg{position:absolute;inset:0;background:url('${pub('images/fotos/mesa-globos.webp')}') center 8%/cover}
    .shade{position:absolute;inset:0;background:linear-gradient(90deg,#0f2d20 0%,rgba(23,66,47,.92) 48%,rgba(23,66,47,.35) 100%)}
    .wrap{position:absolute;left:80px;top:70px;right:420px;color:#fdfaf5}
    img{width:150px;height:150px;border-radius:32px;box-shadow:0 18px 40px rgba(0,0,0,.35)}
    h1{font-family:Georgia,serif;font-size:64px;line-height:1.02;margin:34px 0 14px;font-weight:700}
    h1 span{color:#E0F890}
    p{font-size:28px;color:#e8efe9;margin:0 0 30px}
    .pill{display:inline-block;background:#E0F890;color:#17422F;font-weight:800;font-size:28px;padding:16px 30px;border-radius:999px}
    .loc{position:absolute;right:40px;bottom:36px;color:#fff;font-size:22px;font-weight:700;background:rgba(15,45,32,.75);padding:10px 18px;border-radius:999px}
  </style></head><body><div class="bg"></div><div class="shade"></div>
  <div class="wrap"><img src="${pub('brand/logo.webp')}"><h1>Celebra en una casa <span>solo para ti</span></h1>
  <p>Cumpleaños y eventos · inflable, cama elástica, taca-taca y patio</p><span class="pill">Agenda +56 9 5473 7249</span></div>
  <div class="loc">📍 Los Castaños · Chiguayante</div></body></html>`, { waitUntil: 'load' })
  await p.waitForTimeout(400)
  await p.screenshot({ path: 'app/public/images/og-cover.png' })
  await b.close()
})()
