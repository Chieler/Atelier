import fs from 'node:fs'
import path from 'node:path'
import { renderPiece, validatePiece, type Piece } from './render-piece.ts'
import type { Mark } from '../src/studio/model.ts'

function makeRandom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function curvedStroke(
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  jitter: number,
  rand: () => number,
): string {
  const jx = (rand() - 0.5) * jitter
  const jy = (rand() - 0.5) * jitter
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${(cx + jx).toFixed(1)} ${(cy + jy).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

function cubicStroke(
  x1: number,
  y1: number,
  c1x: number,
  c1y: number,
  c2x: number,
  c2y: number,
  x2: number,
  y2: number,
  jitter: number,
  rand: () => number,
): string {
  const j1x = (rand() - 0.5) * jitter
  const j1y = (rand() - 0.5) * jitter
  const j2x = (rand() - 0.5) * jitter
  const j2y = (rand() - 0.5) * jitter
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(c1x + j1x).toFixed(1)} ${(c1y + j1y).toFixed(1)} ${(c2x + j2x).toFixed(1)} ${(c2y + j2y).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

function spiralPath(
  cx: number,
  cy: number,
  startR: number,
  endR: number,
  turns: number,
  jitter: number,
  rand: () => number,
): string {
  const steps = 16
  const points: { x: number; y: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angle = t * turns * Math.PI * 2
    const r = startR + (endR - startR) * t
    const jx = (rand() - 0.5) * jitter
    const jy = (rand() - 0.5) * jitter
    points.push({
      x: cx + Math.cos(angle) * r + jx,
      y: cy + Math.sin(angle) * r + jy,
    })
  }
  let d = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const midX = (prev.x + curr.x) / 2
    const midY = (prev.y + curr.y) / 2
    d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`
  }
  return d
}

// Generates an oriented heart/almond peacock eye feather halo
function eyeHaloPath(cx: number, cy: number, angle: number, rx: number, ry: number): string {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const pt = (dx: number, dy: number) => ({
    x: (cx + dx * cos - dy * sin).toFixed(1),
    y: (cy + dx * sin + dy * cos).toFixed(1),
  })
  const top = pt(0, -ry)
  const right = pt(rx, 0)
  const bot = pt(0, ry * 0.8)
  const left = pt(-rx, 0)
  const c1 = pt(rx * 0.8, -ry * 0.9)
  const c2 = pt(rx, -ry * 0.3)
  const c3 = pt(rx * 0.9, ry * 0.5)
  const c4 = pt(rx * 0.4, ry * 0.8)
  const c5 = pt(-rx * 0.4, ry * 0.8)
  const c6 = pt(-rx * 0.9, ry * 0.5)
  const c7 = pt(-rx, -ry * 0.3)
  const c8 = pt(-rx * 0.8, -ry * 0.9)
  return `M ${top.x} ${top.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${right.x} ${right.y} C ${c3.x} ${c3.y} ${c4.x} ${c4.y} ${bot.x} ${bot.y} C ${c5.x} ${c5.y} ${c6.x} ${c6.y} ${left.x} ${left.y} C ${c7.x} ${c7.y} ${c8.x} ${c8.y} ${top.x} ${top.y} Z`
}

export function createArtNouveau(): Piece {
  const rand = makeRandom(65219)
  let markCounter = 0
  const nextId = (prefix: string) => `an-${prefix}-${String(++markCounter).padStart(3, '0')}`

  // =========================================================================
  // BATCH 1: Warm Gilded Vellum Ground & Decorative Spandrels (32 marks)
  // Layer: 1, Preset: 'pastel'
  // Base parchment ground with soft atmospheric chalk shading in outer spandrels
  // =========================================================================
  const batch1: Mark[] = []
  batch1.push({
    id: nextId('ground-base'),
    type: 'rect',
    layer: 1,
    x: 0, y: 0, width: 1000, height: 700,
    fill: '#f7f1e5',
    stroke: 'none', strokeWidth: 0, opacity: 0.99,
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  const vellumTones = ['#ebdcc7', '#f1e4d1', '#e5d1b7', '#decaad', '#ecd7be', '#e2c9af']
  for (let i = 0; i < 31; i++) {
    const isLeft = i % 2 === 0
    const xBase = isLeft ? 15 + rand() * 110 : 875 + rand() * 110
    const yBase = 20 + rand() * 660
    const angle = (rand() - 0.5) * Math.PI * 0.8
    const len = 120 + rand() * 160
    const x1 = xBase - Math.cos(angle) * len * 0.5
    const y1 = yBase - Math.sin(angle) * len * 0.5
    const x2 = xBase + Math.cos(angle) * len * 0.5
    const y2 = yBase + Math.sin(angle) * len * 0.5
    const cx = (x1 + x2) / 2 + (rand() - 0.5) * 20
    const cy = (y1 + y2) / 2 + (rand() - 0.5) * 20
    batch1.push({
      id: nextId('vellum-shading'),
      type: 'path',
      layer: 1,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(x1, y1, cx, cy, x2, y2, 6, rand),
      fill: 'none',
      stroke: vellumTones[i % vellumTones.length],
      strokeWidth: 34 + rand() * 24,
      opacity: 0.55 + rand() * 0.25,
      brush: { preset: 'pastel', seed: 100 + i },
    })
  }

  // =========================================================================
  // BATCH 2: Deep Midnight Peacock-Teal Arch Vault (46 marks)
  // Layer: 2, Preset: 'gouache'
  // 46 vertical undulating gouache strokes covering the entire inner arch vault
  // from side to side (x = 152 to 848) with zero gaps, zero horizontal bands,
  // and zero overflow beyond the arch moulding.
  // =========================================================================
  const batch2: Mark[] = []
  const vaultTeals = [
    '#020d16', '#041622', '#07202e', '#0b2b3d', '#0f374c',
    '#051826', '#092434', '#0d3044', '#123d53', '#081e2c',
  ]

  // Exact arch apex curve: for any x in [150, 850], returns the top arch y
  const archTopY = (x: number): number => {
    const u = Math.min(1, Math.abs(x - 500) / 340)
    return 240 - 185 * Math.sqrt(Math.max(0, 1 - u * u))
  }

  for (let s = 0; s < 46; s++) {
    const frac = s / 45
    // Spaced evenly from x=155 to x=845 (underlapping arch moulding x=135..155)
    const xBase = 155 + frac * 690
    const yTop = Math.max(58, archTopY(xBase))
    const yBot = 665
    const strokeW = 32 + rand() * 6

    const midY = (yTop + yBot) / 2
    const cx = xBase + (rand() - 0.5) * 8
    const cy = midY + (rand() - 0.5) * 15

    batch2.push({
      id: nextId('vault-teal-sweep'),
      type: 'path',
      layer: 2,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(xBase, yTop, cx, cy, xBase, yBot, 3, rand),
      fill: 'none',
      stroke: vaultTeals[s % vaultTeals.length],
      strokeWidth: strokeW,
      opacity: 0.98,
      brush: { preset: 'gouache', seed: 200 + s },
    })
  }

  // =========================================================================
  // BATCH 3: Klimt Gilded Halo & Radiating Sunburst Aureole (46 marks)
  // Layer: 3, Preset: 'oil'
  // Opulent aureole centered behind the peacock head at (500, 205)
  // =========================================================================
  const batch3: Mark[] = []
  const goldPalette = ['#b88825', '#cf9c2e', '#e5b33d', '#f4cb5e', '#ffd875', '#d4a233', '#c69123']

  // 14 Radiating Klimt gold rays around halo periphery
  for (let r = 0; r < 14; r++) {
    const angle = Math.PI * (0.05 + (r / 13) * 0.90)
    const r1 = 65 + rand() * 20
    const r2 = 205 + rand() * 25
    const x1 = 500 - Math.cos(angle) * r1
    const y1 = 205 - Math.sin(angle) * (r1 * 0.85)
    const x2 = 500 - Math.cos(angle) * r2
    const y2 = 205 - Math.sin(angle) * (r2 * 0.85)
    const cx = (x1 + x2) / 2 + (rand() - 0.5) * 15
    const cy = (y1 + y2) / 2 + (rand() - 0.5) * 15
    batch3.push({
      id: nextId(`halo-ray-${r}`),
      type: 'path',
      layer: 3,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(x1, y1, cx, cy, x2, y2, 4, rand),
      fill: 'none',
      stroke: goldPalette[r % goldPalette.length],
      strokeWidth: 3.2 + rand() * 1.8,
      opacity: 0.95,
      brush: { preset: 'oil', seed: 300 + r },
    })
  }

  // 16 Golden Klimt spirals embedded within the halo disc
  const haloSpirals = [
    { x: 380, y: 150, r: 18 }, { x: 440, y: 110, r: 16 }, { x: 500, y: 95, r: 18 },
    { x: 560, y: 110, r: 16 }, { x: 620, y: 150, r: 18 }, { x: 340, y: 220, r: 20 },
    { x: 660, y: 220, r: 20 }, { x: 350, y: 300, r: 20 }, { x: 650, y: 300, r: 20 },
    { x: 400, y: 240, r: 16 }, { x: 600, y: 240, r: 16 }, { x: 420, y: 75,  r: 15 },
    { x: 580, y: 75,  r: 15 }, { x: 500, y: 65,  r: 15 }, { x: 370, y: 360, r: 18 },
    { x: 630, y: 360, r: 18 },
  ]
  haloSpirals.forEach((sp, idx) => {
    batch3.push({
      id: nextId(`halo-spiral-${idx}`),
      type: 'path',
      layer: 3,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: spiralPath(sp.x, sp.y, 2.5, sp.r, 2.1, 1.5, rand),
      fill: 'none',
      stroke: goldPalette[idx % goldPalette.length],
      strokeWidth: 2.2 + rand() * 1.2,
      opacity: 0.96,
      brush: { preset: 'oil', seed: 320 + idx },
    })
  })

  // 16 Gilded mosaic beads ringing the aureole
  for (let b = 0; b < 16; b++) {
    const angle = Math.PI * (0.06 + (b / 15) * 0.88)
    const bx = 500 - Math.cos(angle) * 225
    const by = 205 - Math.sin(angle) * 148
    batch3.push({
      id: nextId(`halo-bead-${b}`),
      type: 'ellipse',
      layer: 3,
      x: bx, y: by,
      width: 10, height: 10,
      fill: goldPalette[b % goldPalette.length],
      stroke: '#6a4a12',
      strokeWidth: 1.2,
      opacity: 0.98,
      brush: { preset: 'oil', seed: 340 + b },
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    })
  }

  // =========================================================================
  // BATCH 4: Klimt Golden Mosaic Pattern — Spirals & Tendrils (48 marks)
  // Layer: 4, Preset: 'oil'
  // Sinuous Klimt Tree-of-Life branches and coiling spirals across sky
  // =========================================================================
  const batch4: Mark[] = []

  // 24 Sinuous Tree-of-Life golden boughs
  const branchSites = [
    { x1: 200, y1: 170, c1x: 250, c1y: 110, c2x: 300, c2y: 90,  x2: 360, y2: 120 },
    { x1: 800, y1: 170, c1x: 750, c1y: 110, c2x: 700, c2y: 90,  x2: 640, y2: 120 },
    { x1: 170, y1: 270, c1x: 220, c1y: 220, c2x: 260, c2y: 240, x2: 300, y2: 200 },
    { x1: 830, y1: 270, c1x: 780, c1y: 220, c2x: 740, c2y: 240, x2: 700, y2: 200 },
    { x1: 190, y1: 370, c1x: 230, c1y: 330, c2x: 270, c2y: 360, x2: 320, y2: 320 },
    { x1: 810, y1: 370, c1x: 770, c1y: 330, c2x: 730, c2y: 360, x2: 680, y2: 320 },
    { x1: 260, y1: 100, c1x: 300, c1y: 65,  c2x: 360, c2y: 65,  x2: 410, y2: 80 },
    { x1: 740, y1: 100, c1x: 700, c1y: 65,  c2x: 640, c2y: 65,  x2: 590, y2: 80 },
    { x1: 160, y1: 190, c1x: 185, c1y: 140, c2x: 215, c2y: 125, x2: 245, y2: 155 },
    { x1: 840, y1: 190, c1x: 815, c1y: 140, c2x: 785, c2y: 125, x2: 755, y2: 155 },
    { x1: 180, y1: 330, c1x: 205, c1y: 290, c2x: 235, c2y: 305, x2: 275, y2: 280 },
    { x1: 820, y1: 330, c1x: 795, c1y: 290, c2x: 765, c2y: 305, x2: 725, y2: 280 },
    { x1: 240, y1: 240, c1x: 280, c1y: 260, c2x: 300, c2y: 280, x2: 340, y2: 260 },
    { x1: 760, y1: 240, c1x: 720, c1y: 260, c2x: 700, c2y: 280, x2: 660, y2: 260 },
    { x1: 290, y1: 70,  c1x: 340, c1y: 48,  c2x: 400, c2y: 52,  x2: 450, y2: 62 },
    { x1: 710, y1: 70,  c1x: 660, c1y: 48,  c2x: 600, c2y: 52,  x2: 550, y2: 62 },
    { x1: 220, y1: 310, c1x: 245, c1y: 280, c2x: 270, c2y: 290, x2: 295, y2: 270 },
    { x1: 780, y1: 310, c1x: 755, c1y: 280, c2x: 730, c2y: 290, x2: 705, y2: 270 },
    { x1: 200, y1: 420, c1x: 240, c1y: 380, c2x: 280, c2y: 400, x2: 310, y2: 360 },
    { x1: 800, y1: 420, c1x: 760, c1y: 380, c2x: 720, c2y: 400, x2: 690, y2: 360 },
    { x1: 320, y1: 85,  c1x: 360, c1y: 65,  c2x: 390, c2y: 70,  x2: 420, y2: 85 },
    { x1: 680, y1: 85,  c1x: 640, c1y: 65,  c2x: 610, c2y: 70,  x2: 580, y2: 85 },
    { x1: 180, y1: 230, c1x: 210, c1y: 190, c2x: 240, c2y: 195, x2: 270, y2: 180 },
    { x1: 820, y1: 230, c1x: 790, c1y: 190, c2x: 760, c2y: 195, x2: 730, y2: 180 },
  ]
  branchSites.forEach((bs, idx) => {
    batch4.push({
      id: nextId(`klimt-bough-${idx}`),
      type: 'path',
      layer: 4,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: cubicStroke(bs.x1, bs.y1, bs.c1x, bs.c1y, bs.c2x, bs.c2y, bs.x2, bs.y2, 3, rand),
      fill: 'none',
      stroke: goldPalette[idx % goldPalette.length],
      strokeWidth: 2.2 + rand() * 1.4,
      opacity: 0.95,
      brush: { preset: 'oil', seed: 400 + idx },
    })
  })

  // 24 Coiling Klimt spirals at branch endings
  const skySpirals = [
    { x: 360, y: 120, r: 16 }, { x: 640, y: 120, r: 16 }, { x: 300, y: 200, r: 15 },
    { x: 700, y: 200, r: 15 }, { x: 320, y: 320, r: 16 }, { x: 680, y: 320, r: 16 },
    { x: 410, y: 80,  r: 14 }, { x: 590, y: 80,  r: 14 }, { x: 245, y: 155, r: 15 },
    { x: 755, y: 155, r: 15 }, { x: 275, y: 280, r: 14 }, { x: 725, y: 280, r: 14 },
    { x: 340, y: 260, r: 15 }, { x: 660, y: 260, r: 15 }, { x: 450, y: 62,  r: 14 },
    { x: 550, y: 62,  r: 14 }, { x: 295, y: 270, r: 13 }, { x: 705, y: 270, r: 13 },
    { x: 310, y: 360, r: 15 }, { x: 690, y: 360, r: 15 }, { x: 420, y: 85,  r: 13 },
    { x: 580, y: 85,  r: 13 }, { x: 270, y: 180, r: 14 }, { x: 730, y: 180, r: 14 },
  ]
  skySpirals.forEach((ss, idx) => {
    batch4.push({
      id: nextId(`sky-spiral-${idx}`),
      type: 'path',
      layer: 4,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: spiralPath(ss.x, ss.y, 2.0, ss.r, 2.0, 1.2, rand),
      fill: 'none',
      stroke: goldPalette[(idx + 1) % goldPalette.length],
      strokeWidth: 2.0 + rand() * 1.0,
      opacity: 0.96,
      brush: { preset: 'oil', seed: 440 + idx },
    })
  })

  // =========================================================================
  // BATCH 5: Klimt Golden Mosaic Pattern — Dabs, Rings & Starbursts (48 marks)
  // Layer: 5, Preset: 'oil'
  // Glittering constellation of gold/ochre mosaic tesserae and rings
  // =========================================================================
  const batch5: Mark[] = []
  for (let m = 0; m < 48; m++) {
    const isLeft = m % 2 === 0
    const gx = isLeft ? 180 + rand() * 200 : 620 + rand() * 200
    const gy = 75 + rand() * 350
    const isRing = m % 3 === 0
    if (isRing) {
      batch5.push({
        id: nextId(`mosaic-ring-${m}`),
        type: 'ellipse',
        layer: 5,
        x: gx, y: gy,
        width: 12 + rand() * 12, height: 12 + rand() * 12,
        fill: 'none',
        stroke: goldPalette[m % goldPalette.length],
        strokeWidth: 1.8 + rand() * 1.2,
        opacity: 0.96,
        brush: { preset: 'oil', seed: 500 + m },
        x2: 0, y2: 0, d: '', text: '', fontSize: 24,
      })
    } else {
      batch5.push({
        id: nextId(`mosaic-dab-${m}`),
        type: 'ellipse',
        layer: 5,
        x: gx, y: gy,
        width: 7 + rand() * 8, height: 7 + rand() * 8,
        fill: goldPalette[m % goldPalette.length],
        stroke: '#805915',
        strokeWidth: 1,
        opacity: 0.98,
        brush: { preset: 'oil', seed: 500 + m },
        x2: 0, y2: 0, d: '', text: '', fontSize: 24,
      })
    }
  }

  // =========================================================================
  // BATCH 6: Sandstone Portal Arch & Carved Balustrade (44 marks)
  // Layer: 6, Preset: 'gouache'
  // Architectural framing of portal arch mouldings and sculpted pedestal
  // =========================================================================
  const batch6: Mark[] = []
  const archStone = ['#382a1c', '#4e3c29', '#68533a', '#866e50', '#a48b6b', '#c2a989']

  // 14 concentric arch moulding bands
  for (let a = 0; a < 14; a++) {
    const spread = (a - 7) * 3.6
    const lx = 135 + spread
    const rx = 865 - spread
    const topY = 40 + a * 2.5
    batch6.push({
      id: nextId('portal-arch-band'),
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: `M ${lx.toFixed(1)} 665 L ${lx.toFixed(1)} 240 C ${lx.toFixed(1)} 75 ${(lx + 150).toFixed(1)} ${topY.toFixed(1)} 500 ${topY.toFixed(1)} C ${(rx - 150).toFixed(1)} ${topY.toFixed(1)} ${rx.toFixed(1)} 75 ${rx.toFixed(1)} 240 L ${rx.toFixed(1)} 665`,
      fill: 'none',
      stroke: archStone[a % archStone.length],
      strokeWidth: 3.5 + rand() * 2,
      opacity: 0.95,
      brush: { preset: 'gouache', seed: 600 + a },
    })
  }

  // 30 fluted pedestal balustrade marks
  for (let p = 0; p < 30; p++) {
    const frac = p / 29
    const px = 425 + frac * 150
    const curveW = Math.sin(frac * Math.PI) * 16
    const col = archStone[p % archStone.length]
    batch6.push({
      id: nextId('balustrade-flute'),
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: cubicStroke(
        px + (frac - 0.5) * 18, 665,
        px - 10 - curveW * 0.4, 580,
        px + 10 + curveW * 0.4, 510,
        px - (frac - 0.5) * 14, 435,
        3, rand,
      ),
      fill: 'none',
      stroke: col,
      strokeWidth: 7.5 + rand() * 4.5,
      opacity: 0.96,
      brush: { preset: 'gouache', seed: 620 + p },
    })
  }

  // =========================================================================
  // BATCH 7: Peacock Sculptural Underpainting & Body Masses (42 marks)
  // Layer: 7, Preset: 'gouache'
  // Large proud peacock: broad chest (400 to 565, 230 to 445), regal S-neck
  // Rich royal sapphire underpainting contrasting boldly with midnight teal!
  // =========================================================================
  const batch7: Mark[] = []
  const peacockNavyTones = ['#082448', '#0d325e', '#134076', '#194f8e', '#103968', '#0c2d54']

  // Head and crown massing (6 marks)
  for (let h = 0; h < 6; h++) {
    const hx = 420 + (rand() - 0.5) * 16
    const hy = 140 + (rand() - 0.5) * 16
    batch7.push({
      id: nextId('peacock-head-mass'),
      type: 'ellipse',
      layer: 7,
      x: hx, y: hy,
      width: 32 + rand() * 12, height: 26 + rand() * 10,
      fill: peacockNavyTones[h % peacockNavyTones.length],
      stroke: '#05162b', strokeWidth: 1.5, opacity: 0.98,
      brush: { preset: 'gouache', seed: 700 + h },
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    })
  }

  // Serpentine S-neck massing (16 marks)
  for (let n = 0; n < 16; n++) {
    const frac = n / 15
    const ny = 265 - frac * 125
    const nx = 475 - Math.sin(frac * Math.PI) * 35 - frac * 45
    batch7.push({
      id: nextId('peacock-neck-mass'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(nx - 16, ny + 8, nx, ny, nx + 16, ny - 8, 3, rand),
      fill: 'none',
      stroke: peacockNavyTones[n % peacockNavyTones.length],
      strokeWidth: 24 + rand() * 8,
      opacity: 0.99,
      brush: { preset: 'gouache', seed: 710 + n },
    })
  }

  // Volumetric torso massing: broad proud chest thrusting forward (20 marks)
  for (let t = 0; t < 20; t++) {
    const frac = t / 19
    const by1 = 245 + frac * 190
    const bx1 = 415 + Math.sin(frac * Math.PI * 0.75) * 45
    const by2 = by1 + 25
    const bx2 = bx1 + 90 - frac * 20
    const cx = (bx1 + bx2) / 2 + (rand() - 0.5) * 10
    const cy = (by1 + by2) / 2 + (rand() - 0.5) * 10
    batch7.push({
      id: nextId('peacock-body-mass'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(bx1, by1, cx, cy, bx2, by2, 4, rand),
      fill: 'none',
      stroke: peacockNavyTones[t % peacockNavyTones.length],
      strokeWidth: 28 + rand() * 8,
      opacity: 0.98,
      brush: { preset: 'gouache', seed: 730 + t },
    })
  }

  // =========================================================================
  // BATCH 8: Iridescent Sapphire & Emerald Plumage (46 marks)
  // Layer: 8, Preset: 'gouache'
  // Flowing longitudinal neck strokes & organic imbricated breast feathers
  // =========================================================================
  const batch8: Mark[] = []
  const jewelBlues = [
    '#0f4880', '#1561a8', '#1c78cb', '#2490eb', '#179c8d',
    '#1ebaa9', '#27d6c4', '#34ebe0', '#19806e', '#165780',
    '#18a478', '#22be8d',
  ]

  // Flowing longitudinal neck plumage (16 marks)
  for (let m = 0; m < 16; m++) {
    const t = m / 15
    const ny1 = 270 - t * 135
    const nx1 = 475 - Math.sin(t * Math.PI) * 35 - t * 45
    const tNext = Math.min(1, t + 0.18)
    const ny2 = 270 - tNext * 135
    const nx2 = 475 - Math.sin(tNext * Math.PI) * 35 - tNext * 45
    const offset = ((m % 4) - 1.5) * 7
    batch8.push({
      id: nextId('neck-jewel-flow'),
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: cubicStroke(
        nx1 + offset, ny1,
        (nx1 + nx2) / 2 + offset - 4, (ny1 + ny2) / 2,
        (nx1 + nx2) / 2 + offset + 4, (ny1 + ny2) / 2,
        nx2 + offset, ny2,
        2, rand,
      ),
      fill: 'none',
      stroke: jewelBlues[m % jewelBlues.length],
      strokeWidth: 6.0 + rand() * 2.5,
      opacity: 0.96,
      brush: { preset: 'gouache', seed: 800 + m },
    })
  }

  // Breast & torso imbricated plumage: broad overlapping strokes that model form (30 marks)
  const breastPlumage = [
    // Upper breast row
    { x1: 420, y1: 250, cx: 435, cy: 265, x2: 455, y2: 255 },
    { x1: 445, y1: 252, cx: 460, cy: 268, x2: 480, y2: 258 },
    { x1: 470, y1: 255, cx: 485, cy: 270, x2: 505, y2: 260 },
    // Mid-upper breast row
    { x1: 412, y1: 275, cx: 430, cy: 295, x2: 452, y2: 280 },
    { x1: 442, y1: 278, cx: 460, cy: 298, x2: 482, y2: 284 },
    { x1: 472, y1: 282, cx: 490, cy: 302, x2: 512, y2: 288 },
    { x1: 502, y1: 285, cx: 520, cy: 305, x2: 540, y2: 290 },
    // Center breast swelling
    { x1: 408, y1: 305, cx: 428, cy: 328, x2: 452, y2: 310 },
    { x1: 442, y1: 308, cx: 462, cy: 332, x2: 485, y2: 315 },
    { x1: 476, y1: 312, cx: 496, cy: 335, x2: 518, y2: 318 },
    { x1: 510, y1: 315, cx: 530, cy: 338, x2: 550, y2: 320 },
    // Mid-lower breast
    { x1: 415, y1: 338, cx: 435, cy: 362, x2: 458, y2: 345 },
    { x1: 450, y1: 342, cx: 470, cy: 366, x2: 492, y2: 348 },
    { x1: 485, y1: 345, cx: 505, cy: 368, x2: 528, y2: 350 },
    { x1: 518, y1: 348, cx: 536, cy: 370, x2: 556, y2: 352 },
    // Lower chest & flank
    { x1: 425, y1: 372, cx: 445, cy: 395, x2: 468, y2: 378 },
    { x1: 460, y1: 375, cx: 480, cy: 398, x2: 502, y2: 380 },
    { x1: 495, y1: 378, cx: 515, cy: 400, x2: 538, y2: 382 },
    { x1: 528, y1: 380, cx: 545, cy: 402, x2: 565, y2: 385 },
    // Abdomen & flank base
    { x1: 435, y1: 405, cx: 455, cy: 426, x2: 478, y2: 410 },
    { x1: 470, y1: 408, cx: 490, cy: 428, x2: 512, y2: 412 },
    { x1: 505, y1: 410, cx: 522, cy: 430, x2: 545, y2: 415 },
    // Wing coverts layering (lateral contour)
    { x1: 490, y1: 290, cx: 525, cy: 315, x2: 550, y2: 345 },
    { x1: 505, y1: 320, cx: 538, cy: 345, x2: 560, y2: 375 },
    { x1: 515, y1: 350, cx: 545, cy: 375, x2: 565, y2: 405 },
    { x1: 430, y1: 290, cx: 420, cy: 330, x2: 435, y2: 370 },
    { x1: 440, y1: 325, cx: 432, cy: 360, x2: 445, y2: 395 },
    { x1: 465, y1: 270, cx: 455, cy: 300, x2: 470, y2: 335 },
    { x1: 480, y1: 330, cx: 475, cy: 365, x2: 490, y2: 395 },
    { x1: 495, y1: 360, cx: 490, cy: 395, x2: 505, y2: 425 },
  ]
  breastPlumage.forEach((bf, bIdx) => {
    batch8.push({
      id: nextId('breast-scallop-plume'),
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(bf.x1, bf.y1, bf.cx, bf.cy, bf.x2, bf.y2, 2, rand),
      fill: 'none',
      stroke: jewelBlues[bIdx % jewelBlues.length],
      strokeWidth: 8.5 + rand() * 2.5,
      opacity: 0.96,
      brush: { preset: 'gouache', seed: 820 + bIdx },
    })
  })

  // =========================================================================
  // BATCH 9: Cascading Multi-Tiered Undulating Fan Plumes (48 marks)
  // Layer: 9, Preset: 'gouache'
  // Billowing feather masses fanning across the entire lower canvas!
  // Trajectories fanning organically from -150° across -90° to +25°
  // =========================================================================
  const batch9: Mark[] = []
  const plumeGreens = [
    '#0b3124', '#104433', '#155943', '#1b7054', '#228967',
    '#184b55', '#1d5e6b', '#237382', '#0f3a30', '#2aa07b',
    '#136652', '#1a8269',
  ]

  for (let tp = 0; tp < 48; tp++) {
    const ox = 440 + (tp % 11) * 11
    const oy = 390 + (tp % 4) * 12
    let endX: number, endY: number, c1x: number, c1y: number, c2x: number, c2y: number

    if (tp < 16) {
      // Leftward cascading billows: curve out to left, dip down, then curl up
      const lt = tp / 15
      const angle = -Math.PI * (0.55 + lt * 0.28)
      const len = 220 + lt * 130 + Math.sin(lt * Math.PI) * 40
      endX = ox + Math.cos(angle) * len
      endY = oy - Math.sin(angle) * len
      c1x = ox - 80 - lt * 40
      c1y = oy + 30 + lt * 25
      c2x = endX + 45
      c2y = endY - 60
    } else if (tp < 28) {
      // Center cascading waterfall plumes draping over balustrade
      const ct = (tp - 16) / 11
      const angle = -Math.PI * (0.45 + (ct - 0.5) * 0.20)
      const len = 170 + ct * 110 + Math.sin(ct * Math.PI) * 30
      endX = ox + Math.cos(angle) * len
      endY = oy - Math.sin(angle) * len
      c1x = ox + (ct - 0.5) * 40
      c1y = oy + 65
      c2x = endX - (ct - 0.5) * 20
      c2y = endY - 45
    } else {
      // Rightward magnificent billowing fan plumes
      const rt = (tp - 28) / 19
      const angle = -Math.PI * (0.38 - rt * 0.32)
      const len = 200 + rt * 160 + Math.sin(rt * Math.PI) * 45
      endX = ox + Math.cos(angle) * len
      endY = oy - Math.sin(angle) * len
      c1x = ox + 65 + rt * 100
      c1y = oy + 25 + rt * 10
      c2x = endX - 55
      c2y = endY - 55
    }

    const col = plumeGreens[tp % plumeGreens.length]
    batch9.push({
      id: nextId('fan-plume-mass'),
      type: 'path',
      layer: 9,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: cubicStroke(ox, oy, c1x, c1y, c2x, c2y, endX, endY, 5, rand),
      fill: 'none',
      stroke: col,
      strokeWidth: 8.0 + rand() * 4.5,
      opacity: 0.95,
      brush: { preset: 'gouache', seed: 900 + tp },
    })
  }

  // =========================================================================
  // BATCH 10: Golden Feather Shafts & Sinuous Quills (48 marks)
  // Layer: 10, Preset: 'oil'
  // Elegant gilded spines undulating along the plume trajectories
  // =========================================================================
  const batch10: Mark[] = []
  const quillGolds = ['#b88825', '#d4a233', '#edbe47', '#ffdc6d', '#ab7b19', '#f2ca5c']

  for (let q = 0; q < 48; q++) {
    const ox = 440 + (q % 11) * 11
    const oy = 395 + (q % 4) * 10
    let endX: number, endY: number, c1x: number, c1y: number, c2x: number, c2y: number

    if (q < 16) {
      const lt = q / 15
      const angle = -Math.PI * (0.55 + lt * 0.28)
      const len = 210 + lt * 125 + Math.sin(lt * Math.PI) * 35
      endX = ox + Math.cos(angle) * len
      endY = oy - Math.sin(angle) * len
      c1x = ox - 75 - lt * 35
      c1y = oy + 30 + lt * 20
      c2x = endX + 35
      c2y = endY - 55
    } else if (q < 28) {
      const ct = (q - 16) / 11
      const angle = -Math.PI * (0.45 + (ct - 0.5) * 0.20)
      const len = 160 + ct * 105 + Math.sin(ct * Math.PI) * 25
      endX = ox + Math.cos(angle) * len
      endY = oy - Math.sin(angle) * len
      c1x = ox + (ct - 0.5) * 35
      c1y = oy + 60
      c2x = endX - (ct - 0.5) * 18
      c2y = endY - 40
    } else {
      const rt = (q - 28) / 19
      const angle = -Math.PI * (0.38 - rt * 0.32)
      const len = 190 + rt * 155 + Math.sin(rt * Math.PI) * 40
      endX = ox + Math.cos(angle) * len
      endY = oy - Math.sin(angle) * len
      c1x = ox + 60 + rt * 90
      c1y = oy + 20 + rt * 8
      c2x = endX - 50
      c2y = endY - 50
    }

    const col = quillGolds[q % quillGolds.length]
    batch10.push({
      id: nextId('gold-quill-shaft'),
      type: 'path',
      layer: 10,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: cubicStroke(ox, oy, c1x, c1y, c2x, c2y, endX, endY, 3, rand),
      fill: 'none',
      stroke: col,
      strokeWidth: 2.2 + rand() * 1.5,
      opacity: 0.96,
      brush: { preset: 'oil', seed: 1000 + q },
    })
  }

  // =========================================================================
  // BATCH 11: Opulent Layered Ocellated Eye-Feathers (48 marks)
  // Layers: 11 (oil), 12 (gouache), 13 (oil)
  // 16 oriented heart/almond-shaped peacock eyes distributed organically
  // across left fan (6), center cascade (4), and right fan (6)
  // =========================================================================
  const batch11: Mark[] = []
  const eyeLocations = [
    // Left fan (6 eyes with leftward orientation)
    { x: 230, y: 535, r: 21, angle: -0.65 },
    { x: 285, y: 485, r: 20, angle: -0.50 },
    { x: 300, y: 590, r: 22, angle: -0.40 },
    { x: 355, y: 525, r: 21, angle: -0.35 },
    { x: 375, y: 620, r: 22, angle: -0.20 },
    { x: 415, y: 545, r: 20, angle: -0.15 },
    // Center cascade (4 eyes cascading downward)
    { x: 465, y: 600, r: 21, angle: -0.05 },
    { x: 490, y: 515, r: 19, angle: 0.00 },
    { x: 515, y: 640, r: 22, angle: 0.05 },
    { x: 540, y: 560, r: 20, angle: 0.10 },
    // Right fan (6 eyes sweeping rightward)
    { x: 595, y: 515, r: 20, angle: 0.20 },
    { x: 635, y: 610, r: 22, angle: 0.25 },
    { x: 675, y: 480, r: 21, angle: 0.35 },
    { x: 730, y: 565, r: 22, angle: 0.45 },
    { x: 785, y: 505, r: 21, angle: 0.55 },
    { x: 825, y: 585, r: 20, angle: 0.65 },
  ]

  // Layer 11: Bronze/Gold Outer Halo Path (oil)
  eyeLocations.forEach((loc, idx) => {
    batch11.push({
      id: nextId(`eye-halo-${idx}`),
      type: 'path',
      layer: 11,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: eyeHaloPath(loc.x, loc.y, loc.angle, loc.r * 1.1, loc.r * 1.3),
      fill: '#cf9c2e',
      stroke: '#5c410c',
      strokeWidth: 1.6,
      opacity: 0.96,
      brush: { preset: 'oil', seed: 1100 + idx },
    })
  })

  // Layer 12: Turquoise Iridescent Iris & Deep Indigo Ring (gouache)
  eyeLocations.forEach((loc, idx) => {
    batch11.push({
      id: nextId(`eye-iris-${idx}`),
      type: 'path',
      layer: 12,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: eyeHaloPath(loc.x, loc.y + 1, loc.angle, loc.r * 0.75, loc.r * 0.9),
      fill: '#18bba5',
      stroke: '#0e4a78',
      strokeWidth: 1.8,
      opacity: 0.98,
      brush: { preset: 'gouache', seed: 1120 + idx },
    })
  })

  // Layer 13: Midnight Velvet Pupil with Gilded Spark Core (oil)
  eyeLocations.forEach((loc, idx) => {
    batch11.push({
      id: nextId(`eye-pupil-${idx}`),
      type: 'ellipse',
      layer: 13,
      x: loc.x, y: loc.y + 2,
      width: loc.r * 0.9, height: loc.r * 1.1,
      fill: '#05111c',
      stroke: '#ffdf70',
      strokeWidth: 1.4,
      opacity: 0.99,
      brush: { preset: 'oil', seed: 1140 + idx },
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    })
  })

  // =========================================================================
  // BATCH 12: Mucha Botanical Border — Whiplash Cyclamen & Ivy (46 marks)
  // Layer: 14, Preset: 'ink'
  // Sinuous calligraphic stems and stylized Art Nouveau floral blooms
  // =========================================================================
  const batch12: Mark[] = []

  // 16 Sinuous Mucha whiplash vine stems
  const vinePaths = [
    { x1: 125, y1: 620, c1x: 155, c1y: 430, c2x: 120, c2y: 280, x2: 175, y2: 175 },
    { x1: 175, y1: 175, c1x: 215, c1y: 110, c2x: 280, c2y: 80,  x2: 360, y2: 90 },
    { x1: 875, y1: 620, c1x: 845, c1y: 430, c2x: 880, c2y: 280, x2: 825, y2: 175 },
    { x1: 825, y1: 175, c1x: 785, c1y: 110, c2x: 720, c2y: 80,  x2: 640, y2: 90 },
    { x1: 135, y1: 460, c1x: 170, c1y: 360, c2x: 145, c2y: 270, x2: 210, y2: 210 },
    { x1: 865, y1: 460, c1x: 830, c1y: 360, c2x: 855, c2y: 270, x2: 790, y2: 210 },
    { x1: 210, y1: 210, c1x: 250, c1y: 160, c2x: 275, c2y: 115, x2: 325, y2: 125 },
    { x1: 790, y1: 210, c1x: 750, c1y: 160, c2x: 725, c2y: 115, x2: 675, y2: 125 },
    { x1: 125, y1: 660, c1x: 145, c1y: 550, c2x: 160, c2y: 490, x2: 140, y2: 430 },
    { x1: 875, y1: 660, c1x: 855, c1y: 550, c2x: 840, c2y: 490, x2: 860, y2: 430 },
    { x1: 360, y1: 90,  c1x: 400, c1y: 70,  c2x: 440, c2y: 70,  x2: 480, y2: 75 },
    { x1: 640, y1: 90,  c1x: 600, c1y: 70,  c2x: 560, c2y: 70,  x2: 520, y2: 75 },
    { x1: 150, y1: 300, c1x: 185, c1y: 260, c2x: 170, c2y: 190, x2: 230, y2: 160 },
    { x1: 850, y1: 300, c1x: 815, c1y: 260, c2x: 830, c2y: 190, x2: 770, y2: 160 },
    { x1: 230, y1: 160, c1x: 270, c1y: 130, c2x: 310, c2y: 140, x2: 350, y2: 110 },
    { x1: 770, y1: 160, c1x: 730, c1y: 130, c2x: 690, c2y: 140, x2: 650, y2: 110 },
  ]
  vinePaths.forEach((vp, idx) => {
    batch12.push({
      id: nextId(`botanical-vine-${idx}`),
      type: 'path',
      layer: 14,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: cubicStroke(vp.x1, vp.y1, vp.c1x, vp.c1y, vp.c2x, vp.c2y, vp.x2, vp.y2, 3, rand),
      fill: 'none',
      stroke: idx % 2 === 0 ? '#324a24' : '#476534',
      strokeWidth: 3.2,
      opacity: 0.95,
      brush: { preset: 'ink', seed: 1200 + idx },
    })
  })

  // 30 Stylized Mucha Cyclamen Petals
  const bloomSites = [
    { x: 175, y: 175 }, { x: 360, y: 90 }, { x: 210, y: 210 },
    { x: 825, y: 175 }, { x: 640, y: 90 }, { x: 790, y: 210 },
  ]
  bloomSites.forEach((bs, sIdx) => {
    for (let p = 0; p < 5; p++) {
      const angle = (p - 2) * 0.45 - Math.PI / 2
      const px = bs.x + Math.cos(angle) * 24
      const py = bs.y + Math.sin(angle) * 24
      const petalCol = p % 2 === 0 ? '#de6f69' : '#ee8c87'
      batch12.push({
        id: nextId(`cyclamen-petal-${sIdx}-${p}`),
        type: 'path',
        layer: 14,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: curvedStroke(bs.x, bs.y, (bs.x + px) / 2 + (p - 2) * 4, (bs.y + py) / 2 - 8, px, py, 2, rand),
        fill: 'none',
        stroke: petalCol,
        strokeWidth: 4.8 + rand() * 1.5,
        opacity: 0.95,
        brush: { preset: 'ink', seed: 1220 + sIdx * 5 + p },
      })
    }
  })

  // =========================================================================
  // BATCH 13: Facial Details, Aigrette Crest, Keylines & Cartouche (42 marks)
  // Layers: 15 (ink), 16 (oil), 17 (none)
  // =========================================================================
  const batch13: Mark[] = []

  // Noble head profile facing left: almond eye, white cheek, curved beak (Layer 15, ink)
  batch13.push({
    id: nextId('peacock-white-cheek'),
    type: 'ellipse',
    layer: 15,
    x: 418, y: 142,
    width: 15, height: 11,
    fill: '#fcfaf2',
    stroke: '#06121c', strokeWidth: 1.2, opacity: 0.98,
    brush: { preset: 'ink', seed: 1300 },
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  batch13.push({
    id: nextId('peacock-head-outline'),
    type: 'path',
    layer: 15,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 445 165 C 440 140 426 132 410 136 C 396 142 396 155 412 165 C 430 178 445 205 455 250',
    fill: 'none',
    stroke: '#06121c',
    strokeWidth: 2.5,
    opacity: 0.98,
    brush: { preset: 'ink', seed: 1301 },
  })

  batch13.push({
    id: nextId('peacock-beak-cone'),
    type: 'path',
    layer: 15,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 408 138 L 382 144 L 410 150 Z',
    fill: '#e0a436',
    stroke: '#362308',
    strokeWidth: 1.5,
    opacity: 0.98,
    brush: { preset: 'ink', seed: 1302 },
  })

  batch13.push({
    id: nextId('peacock-eye-pupil'),
    type: 'ellipse',
    layer: 15,
    x: 416, y: 142,
    width: 6, height: 5,
    fill: '#06121c',
    stroke: '#d9a836',
    strokeWidth: 1.2,
    opacity: 0.99,
    brush: { preset: 'ink', seed: 1303 },
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  // Sinuous Mucha keyline contours strictly within composition bounds (3 marks)
  const keylines = [
    { d: 'M 400 155 C 420 190 440 230 450 290 C 460 350 448 405 435 435', w: 2.6 },
    { d: 'M 440 170 C 460 210 480 270 475 340 C 472 385 490 415 505 435', w: 2.6 },
    { d: 'M 135 665 L 135 240 C 135 75 285 40 500 40 C 715 40 865 75 865 240 L 865 665', w: 3.0 },
  ]
  keylines.forEach((kl, idx) => {
    batch13.push({
      id: nextId(`mucha-keyline-${idx}`),
      type: 'path',
      layer: 15,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: kl.d,
      fill: 'none',
      stroke: '#1e140b',
      strokeWidth: kl.w,
      opacity: 0.96,
      brush: { preset: 'ink', seed: 1310 + idx },
    })
  })

  // 5 Aigrette Crown Plumes (10 marks: 5 stems + 5 gems, Layer 16, oil)
  const crestPlumes = [
    { x1: 428, y1: 133, x2: 444, y2: 92 },
    { x1: 425, y1: 132, x2: 434, y2: 85 },
    { x1: 422, y1: 131, x2: 422, y2: 82 },
    { x1: 419, y1: 132, x2: 410, y2: 85 },
    { x1: 416, y1: 133, x2: 400, y2: 92 },
  ]
  crestPlumes.forEach((cp, pIdx) => {
    batch13.push({
      id: nextId(`crest-stem-${pIdx}`),
      type: 'line',
      layer: 16,
      x: cp.x1, y: cp.y1, x2: cp.x2, y2: cp.y2,
      stroke: '#d4a233', strokeWidth: 2, opacity: 0.98,
      fill: 'none', width: 0, height: 0, d: '', text: '', fontSize: 24,
      brush: { preset: 'oil', seed: 1320 + pIdx },
    })
    batch13.push({
      id: nextId(`crest-gem-${pIdx}`),
      type: 'ellipse',
      layer: 16,
      x: cp.x2, y: cp.y2,
      width: 10, height: 10,
      fill: '#1ba395', stroke: '#ffdf79', strokeWidth: 1.8, opacity: 0.99,
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
      brush: { preset: 'oil', seed: 1330 + pIdx },
    })
  })

  // 23 Klimt Gold Leaf Flecks & Highlights on Breast & Plumes (Layer 16, oil)
  const goldFlecks = [
    { x: 435, y: 285 }, { x: 455, y: 310 }, { x: 430, y: 340 }, { x: 470, y: 360 },
    { x: 490, y: 390 }, { x: 510, y: 420 }, { x: 455, y: 380 }, { x: 480, y: 430 },
    { x: 380, y: 490 }, { x: 610, y: 460 }, { x: 450, y: 510 }, { x: 540, y: 480 },
    { x: 415, y: 320 }, { x: 500, y: 350 }, { x: 440, y: 300 }, { x: 465, y: 330 },
    { x: 485, y: 320 }, { x: 520, y: 360 }, { x: 430, y: 360 }, { x: 460, y: 390 },
    { x: 505, y: 395 }, { x: 535, y: 415 }, { x: 475, y: 415 },
  ]
  goldFlecks.forEach((gf, gIdx) => {
    batch13.push({
      id: nextId(`gold-fleck-${gIdx}`),
      type: 'path',
      layer: 16,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(gf.x - 5, gf.y - 3, gf.x, gf.y + 5, gf.x + 6, gf.y - 4, 2, rand),
      fill: 'none',
      stroke: '#ffdf75',
      strokeWidth: 3.5,
      opacity: 0.98,
      brush: { preset: 'oil', seed: 1340 + gIdx },
    })
  })

  // Cartouche Frame & Title (Layers 16 & 17)
  batch13.push({
    id: nextId('cartouche-frame'),
    type: 'path',
    layer: 16,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 370 632 C 415 618 585 618 630 632 C 640 658 630 672 615 672 L 385 672 C 370 672 360 658 370 632 Z',
    fill: '#faefce',
    stroke: '#4a3615',
    strokeWidth: 2.2,
    opacity: 0.98,
    brush: { preset: 'oil', seed: 1370 },
  })
  batch13.push({
    id: nextId('cartouche-title-text'),
    type: 'text',
    layer: 17,
    x: 430, y: 657,
    text: 'LE PAON D’OR',
    fontSize: 16,
    fill: '#362408',
    stroke: 'none', strokeWidth: 0, opacity: 0.99,
    width: 0, height: 0, x2: 0, y2: 0, d: '',
  })

  return {
    slug: 'art-nouveau-peacock',
    title: 'The Gilded Peacock in Arabesque',
    brief: 'An Art Nouveau ornamental composition of a radiant peacock with sinuous whiplash plumage draped over a carved stone balustrade inside an arched botanical portal, painted in opaque gouache with rich gilded oil accents and calligraphic sumi ink contours.',
    style: 'Art Nouveau and Vienna Secession in the style of Alphonse Mucha and Gustav Klimt. Velvety opaque gouache body, iridescent jewel plumage, gilded oil impasto beads and leafing, sinuous coup-de-fouet whiplash curves, and rhythmic calligraphic ink keylines.',
    batches: [
      { label: 'Warm aged vellum ground and soft mottled parchment texture', marks: batch1 },
      { label: 'Deep peacock midnight-teal arch vault', marks: batch2 },
      { label: 'Klimt gilded halo and radiating sunburst aureole', marks: batch3 },
      { label: 'Klimt golden mosaic pattern — spirals and tendrils', marks: batch4 },
      { label: 'Klimt golden mosaic pattern — dabs, rings, and starbursts', marks: batch5 },
      { label: 'Sandstone portal arch and carved balustrade', marks: batch6 },
      { label: 'Peacock sculptural underpainting and body masses', marks: batch7 },
      { label: 'Iridescent sapphire and emerald breast plumage', marks: batch8 },
      { label: 'Cascading multi-tiered undulating fan plumes', marks: batch9 },
      { label: 'Golden feather shafts and sinuous quills', marks: batch10 },
      { label: 'Opulent layered ocellated eye-feathers in bronze, turquoise, and velvet', marks: batch11 },
      { label: 'Mucha botanical border with whiplash vines and cyclamens', marks: batch12 },
      { label: 'Facial details, aigrette crest, keylines, and gilded cartouche', marks: batch13 },
    ],
  }
}

// Self-executing runner
const piece = createArtNouveau()
const stats = validatePiece(piece)
const outPng = path.resolve('renders/art-nouveau-peacock.png')
renderPiece(piece, outPng)
const jsonPath = 'src/studio/examples/art-nouveau-peacock.json'
fs.writeFileSync(jsonPath, JSON.stringify(piece, null, 2), 'utf8')
const fileSizeKb = (fs.statSync(jsonPath).size / 1024).toFixed(1)
console.log(`Art Nouveau Peacock: ${stats.totalMarks} marks in ${stats.batchCount} batches, JSON: ${fileSizeKb} KB -> ${outPng}`)
