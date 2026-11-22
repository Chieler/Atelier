import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { svg, markSchema, type Mark } from '../src/studio/model.ts'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export interface Piece {
  slug: string
  title: string
  brief: string
  style: string
  batches: { label: string; marks: Mark[] }[]
}

export function validatePiece(piece: Piece) {
  if (!piece.slug || typeof piece.slug !== 'string') throw new Error('Missing slug')
  if (!piece.title || typeof piece.title !== 'string') throw new Error('Missing title')
  if (!piece.brief || typeof piece.brief !== 'string') throw new Error('Missing brief')
  if (!piece.style || typeof piece.style !== 'string') throw new Error('Missing style')
  if (!Array.isArray(piece.batches) || piece.batches.length < 3 || piece.batches.length > 14) {
    throw new Error(`Piece ${piece.slug} must have 3-14 batches, found ${piece.batches?.length}`)
  }

  const ids = new Set<string>()
  let totalMarks = 0

  for (const [bIndex, batch] of piece.batches.entries()) {
    if (!batch.label || typeof batch.label !== 'string') {
      throw new Error(`Batch ${bIndex} in ${piece.slug} missing label`)
    }
    for (const [mIndex, mark] of batch.marks.entries()) {
      totalMarks++
      const parsed = markSchema.safeParse(mark)
      if (!parsed.success) {
        throw new Error(
          `Invalid mark ${mIndex} in batch ${bIndex} (${batch.label}) of ${piece.slug}: ${JSON.stringify(parsed.error.issues)}`,
        )
      }
      if (ids.has(mark.id)) {
        throw new Error(`Duplicate mark id: ${mark.id} in ${piece.slug}`)
      }
      ids.add(mark.id)
    }
  }

  if (totalMarks < 40 || totalMarks > 650) {
    console.warn(`Warning: ${piece.slug} has ${totalMarks} marks (target: 300-600)`)
  }

  return { totalMarks, batchCount: piece.batches.length }
}

export function renderPiece(piece: Piece, outPath: string) {
  const marks = piece.batches.flatMap((b) => b.marks).sort((a, b) => a.layer - b.layer || a.id.localeCompare(b.id))
  const svgContent = svg(marks)

  const tmpHtml = path.resolve(`/tmp/render-${piece.slug}.html`)
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 1000px;
    height: 700px;
    overflow: hidden;
    background: #f8f3e8;
  }
  svg {
    display: block;
    width: 1000px;
    height: 700px;
  }
</style>
</head>
<body>
${svgContent}
</body>
</html>`
  fs.writeFileSync(tmpHtml, html, 'utf8')

  execFileSync(CHROME_PATH, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    `--screenshot=${outPath}`,
    '--window-size=1000,786',
    `file://${tmpHtml}`,
  ])

  // Crop off macOS Chrome headless window-chrome padding (86px) to get exact 1000x700 viewport
  execFileSync('python3', [
    '-c',
    `from PIL import Image; im = Image.open('${outPath}'); im.crop((0, 0, 1000, 700)).save('${outPath}')`,
  ])

  return outPath
}

if (process.argv[1]?.endsWith('render-piece.ts')) {
  const fileArg = process.argv[2]
  if (fileArg) {
    const raw = JSON.parse(fs.readFileSync(fileArg, 'utf8'))
    const stats = validatePiece(raw)
    const out = process.argv[3] || path.resolve(`renders/${raw.slug}.png`)
    renderPiece(raw, out)
    console.log(`Rendered ${raw.slug} (${stats.totalMarks} marks in ${stats.batchCount} batches) to ${out}`)
  }
}
