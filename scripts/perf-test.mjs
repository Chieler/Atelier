import { chromium } from 'playwright'
import { svg, markSchema } from '../src/studio/model.ts'

async function runPerfTest() {
  console.log('Testing 500 small strokes using src/studio/model.ts in Chrome...')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } })

  // Generate 500 marks across oil, gouache, ink, pastel
  const marks = []
  const presets = ['oil', 'gouache', 'ink', 'pastel']
  const colors = ['#c83827', '#2252a3', '#d4942a', '#2b593f', '#f6f4ee', '#1c1a17']

  for (let i = 0; i < 500; i++) {
    const preset = presets[i % presets.length]
    const x = 50 + (i % 25) * 36 + (Math.sin(i * 1.5) * 8)
    const y = 60 + Math.floor(i / 25) * 30 + (Math.cos(i * 1.2) * 6)
    const color = colors[i % colors.length]
    const d = `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(x + 15).toFixed(1)} ${(y - 12).toFixed(1)} ${(x + 30).toFixed(1)} ${(y + 4).toFixed(1)}`

    marks.push(
      markSchema.parse({
        id: `perf-${i}`,
        type: 'path',
        layer: 1 + (i % 10),
        stroke: color,
        strokeWidth: 6 + (i % 8),
        d,
        brush: { preset, seed: i * 13 + 7 },
      }),
    )
  }

  const svgOutput = svg(marks)
  console.log(`SVG payload size for 500 strokes: ${(svgOutput.length / 1024).toFixed(1)} KB`)

  // Warm-up
  await page.setContent('<!DOCTYPE html><html><body></body></html>')

  // Benchmark multiple renders
  const trials = 5
  const times = []
  for (let t = 0; t < trials; t++) {
    const t0 = performance.now()
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;">${svgOutput}</body></html>`)
    await page.evaluate(() => new Promise(requestAnimationFrame))
    const t1 = performance.now()
    times.push(t1 - t0)
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length
  console.log(`Render times across ${trials} runs: ${times.map(t => t.toFixed(1) + 'ms').join(', ')}`)
  console.log(`Average paint time in Chrome: ${avgTime.toFixed(1)} ms`)

  await browser.close()
}

runPerfTest().catch(console.error)
