import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { svg, markSchema } from '../src/studio/model.ts'

async function buildSwatchMarks() {
  const marks = []
  let nextId = 1
  const id = () => `swatch-${nextId++}`

  // Layer 0: Backgrounds
  marks.push(
    markSchema.parse({
      id: id(),
      type: 'rect',
      layer: 0,
      x: 500,
      y: 0,
      width: 500,
      height: 700,
      fill: '#1a1917',
    }),
  )

  // Center divider line
  marks.push(
    markSchema.parse({
      id: id(),
      type: 'line',
      layer: 1,
      x: 500,
      y: 0,
      x2: 500,
      y2: 700,
      stroke: '#4a4640',
      strokeWidth: 1,
    }),
  )

  // Header Titles
  marks.push(
    markSchema.parse({
      id: id(),
      type: 'text',
      layer: 90,
      x: 24,
      y: 32,
      text: 'Light Ground (#f8f3e8) — Refined Media Presets',
      fontSize: 15,
      fill: '#242220',
    }),
  )
  marks.push(
    markSchema.parse({
      id: id(),
      type: 'text',
      layer: 90,
      x: 524,
      y: 32,
      text: 'Dark Ground (#1a1917) — Opaque Coverage & Sheen',
      fontSize: 15,
      fill: '#eae6df',
    }),
  )

  const presets = ['oil', 'gouache', 'ink', 'pastel', 'wet-wash']
  const rowHeight = 126
  const startY = 46

  presets.forEach((preset, index) => {
    const y = startY + index * rowHeight
    const seed = 30 + index * 17

    marks.push(
      markSchema.parse({
        id: id(),
        type: 'text',
        layer: 80,
        x: 24,
        y: y + 22,
        text: preset.toUpperCase(),
        fontSize: 13,
        fill: '#1c1b19',
      }),
    )
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'text',
        layer: 80,
        x: 524,
        y: y + 22,
        text: preset.toUpperCase(),
        fontSize: 13,
        fill: '#e2dfd9',
      }),
    )

    // --- LEFT HALF: Light Ground ---
    // 1. Broad stroke (Cadmium Red)
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 10 + index,
        stroke: '#c83827',
        strokeWidth: 18,
        d: `M 30 ${y + 50} Q 110 ${y + 42} 190 ${y + 50}`,
        brush: { preset, seed: seed + 1 },
      }),
    )

    // 2. S-curve stroke (Ultramarine Blue)
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 10 + index,
        stroke: '#2252a3',
        strokeWidth: 15,
        d: `M 215 ${y + 42} C 255 ${y + 75} 280 ${y + 35} 330 ${y + 58}`,
        brush: { preset, seed: seed + 2 },
      }),
    )

    // 3. Ochre / Gold layered strokes
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 10 + index,
        stroke: '#d4942a',
        strokeWidth: 12,
        d: `M 355 ${y + 44} L 445 ${y + 44}`,
        brush: { preset, seed: seed + 3 },
      }),
    )
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 11 + index,
        stroke: '#8a4816',
        strokeWidth: 10,
        d: `M 365 ${y + 60} L 440 ${y + 60}`,
        brush: { preset, seed: seed + 4 },
      }),
    )

    // 4. Dark contour / accent & diluted ink wash demonstration!
    if (preset === 'ink') {
      marks.push(
        markSchema.parse({
          id: id(),
          type: 'path',
          layer: 12 + index,
          stroke: '#141414',
          strokeWidth: 7,
          d: `M 30 ${y + 88} C 90 ${y + 96} 140 ${y + 82} 200 ${y + 90}`,
          brush: { preset, seed: seed + 5 },
        }),
      )
      marks.push(
        markSchema.parse({
          id: id(),
          type: 'path',
          layer: 13 + index,
          stroke: '#141414',
          strokeWidth: 16,
          opacity: 0.4,
          d: `M 65 ${y + 74} L 170 ${y + 74}`,
          brush: { preset, seed: seed + 6 },
        }),
      )
    } else {
      marks.push(
        markSchema.parse({
          id: id(),
          type: 'path',
          layer: 12 + index,
          stroke: '#181818',
          strokeWidth: 7,
          d: `M 30 ${y + 88} C 90 ${y + 96} 140 ${y + 82} 200 ${y + 90}`,
          brush: { preset, seed: seed + 5 },
        }),
      )
      marks.push(
        markSchema.parse({
          id: id(),
          type: 'path',
          layer: 13 + index,
          stroke: '#f4ebe1',
          strokeWidth: 11,
          d: `M 65 ${y + 75} L 170 ${y + 75}`,
          brush: { preset, seed: seed + 6 },
        }),
      )
    }

    // 5. Fine detail stroke
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 12 + index,
        stroke: '#2b593f',
        strokeWidth: 4,
        d: `M 225 ${y + 92} Q 275 ${y + 80} 335 ${y + 92}`,
        brush: { preset, seed: seed + 7 },
      }),
    )

    // --- RIGHT HALF: Dark Ground ---
    // 1. Titanium White mark (crucial test for opacity & rim absence)
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 10 + index,
        stroke: '#f6f4ee',
        strokeWidth: 18,
        d: `M 530 ${y + 50} Q 610 ${y + 42} 690 ${y + 50}`,
        brush: { preset, seed: seed + 8 },
      }),
    )

    // 2. Luminous Gold
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 10 + index,
        stroke: '#f2ab35',
        strokeWidth: 15,
        d: `M 715 ${y + 42} C 755 ${y + 75} 780 ${y + 35} 830 ${y + 58}`,
        brush: { preset, seed: seed + 9 },
      }),
    )

    // 3. Cadmium Red
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 10 + index,
        stroke: '#d63f2e',
        strokeWidth: 14,
        d: `M 855 ${y + 48} L 965 ${y + 48}`,
        brush: { preset, seed: seed + 10 },
      }),
    )

    // 4. Layering on dark: Cyan over Purple
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 10 + index,
        stroke: '#5a2e73',
        strokeWidth: 17,
        d: `M 530 ${y + 88} L 680 ${y + 88}`,
        brush: { preset, seed: seed + 11 },
      }),
    )
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 11 + index,
        stroke: '#38b6d4',
        strokeWidth: 9,
        d: `M 545 ${y + 88} L 665 ${y + 88}`,
        brush: { preset, seed: seed + 12 },
      }),
    )

    // 5. Fine accent
    marks.push(
      markSchema.parse({
        id: id(),
        type: 'path',
        layer: 12 + index,
        stroke: '#e8d89e',
        strokeWidth: 4,
        d: `M 715 ${y + 92} Q 765 ${y + 80} 825 ${y + 92}`,
        brush: { preset, seed: seed + 13 },
      }),
    )
  })

  return marks
}

async function main() {
  const marks = await buildSwatchMarks()
  const svgOutput = svg(marks)
  const svgPath = path.join(process.cwd(), 'renders/brush-swatches.svg')
  await fs.writeFile(svgPath, svgOutput)

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } })
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;">${svgOutput}</body></html>`)
  await page.evaluate(() => new Promise(requestAnimationFrame))

  const pngPath = path.join(process.cwd(), 'renders/brush-swatches.png')
  await page.screenshot({ path: pngPath })

  const thumbPage = await browser.newPage({ viewport: { width: 300, height: 210 } })
  await thumbPage.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;"><div style="transform:scale(${300 / 1000});transform-origin:0 0;">${svgOutput}</div></body></html>`)
  await thumbPage.evaluate(() => new Promise(requestAnimationFrame))
  const thumbPath = path.join(process.cwd(), 'renders/brush-swatches-thumb.png')
  await thumbPage.screenshot({ path: thumbPath })

  await browser.close()
  console.log('Production model.ts rendered swatches to:', pngPath)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
