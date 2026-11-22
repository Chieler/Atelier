// Pre-renders featured pieces to public/examples/<slug>.jpg. Filtered SVGs with hundreds of
// textured strokes are too slow to rasterize live on the home page.
// Run after editing any src/studio/examples/*.json:
//   node --experimental-strip-types scripts/render-thumbs.ts
import fs from 'node:fs'
import { chromium } from '@playwright/test'
import { svg, markSchema, type Mark } from '../src/studio/model.ts'

const dir = 'src/studio/examples'
fs.mkdirSync('public/examples', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } })
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const piece = JSON.parse(fs.readFileSync(`${dir}/${file}`, 'utf8')) as { slug: string; batches: { marks: Mark[] }[] }
  const marks = piece.batches.flatMap((b) => b.marks.map((m) => markSchema.parse(m)))
    .sort((a, b) => a.layer - b.layer || a.id.localeCompare(b.id))
  await page.setContent(`<body style="margin:0">${svg(marks)}</body>`)
  await page.screenshot({ path: `public/examples/${piece.slug}.jpg`, type: 'jpeg', quality: 86 })
  console.log(piece.slug)
}
await browser.close()
