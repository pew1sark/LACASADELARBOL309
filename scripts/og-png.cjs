// Convierte la imagen para redes a PNG (Facebook/WhatsApp no muestran SVG).
//   node scripts/og-png.cjs
const path = require('node:path')
const { chromium } = require('playwright')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
  await p.goto('file://' + path.resolve('app/public/images/og-cover.svg'))
  await p.waitForTimeout(300)
  await p.screenshot({ path: 'app/public/images/og-cover.png' })
  await b.close()
})()
