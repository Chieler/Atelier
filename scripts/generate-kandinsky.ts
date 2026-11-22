import fs from 'node:fs'
import path from 'node:path'
import { renderPiece, validatePiece, type Piece } from './render-piece.ts'
import type { Mark } from '../src/studio/model.ts'

// Deterministic PRNG for reproducible brushwork
function makeRandom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Generate an individual curved brushstroke with organic jitter
function curvedStroke(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number,
  rand: () => number,
): string {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const offset = curvature * (0.8 + 0.4 * rand())
  const cx = mx + nx * offset + (rand() - 0.5) * 3
  const cy = my + ny * offset + (rand() - 0.5) * 3
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

// Generate a smooth circular arc path with SVG 'A' command
function arcPath(
  cx: number,
  cy: number,
  r: number,
  a1: number,
  a2: number,
  rand: () => number,
): string {
  const rJitter = r + (rand() - 0.5) * 1.5
  const x1 = cx + Math.cos(a1) * rJitter
  const y1 = cy + Math.sin(a1) * rJitter
  const x2 = cx + Math.cos(a2) * rJitter
  const y2 = cy + Math.sin(a2) * rJitter
  let dAngle = a2 - a1
  while (dAngle < 0) dAngle += Math.PI * 2
  const largeArc = dAngle > Math.PI ? 1 : 0
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rJitter.toFixed(1)} ${rJitter.toFixed(1)} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

export function createKandinsky(): Piece {
  const rand = makeRandom(19230718)
  let markIndex = 1
  const nextId = (prefix: string) => `kh-${prefix}-${markIndex++}`

  // BATCH 1: Toned atmospheric field and partitioned ground washes (44 marks)
  const batch1: Mark[] = []

  // Full-canvas warm cream parchment foundation (14 horizontal sweeps)
  const parchmentTones = ['#f4ede0', '#ebe3d4', '#f7f1e6', '#e6decb', '#efe7d8']
  for (let i = 0; i < 14; i++) {
    const y = i * 52 - 15
    batch1.push({
      id: nextId('parchment-sweep'),
      type: 'path',
      layer: 1,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(-20, y, 1020, y + 25, (rand() - 0.5) * 8, rand),
      fill: 'none',
      stroke: parchmentTones[i % parchmentTones.length],
      strokeWidth: 64,
      opacity: 0.96,
      brush: { preset: 'gouache', seed: Math.floor(rand() * 100000) },
    })
  }

  // Cross-directional vertical scumbles (10 sweeps)
  for (let i = 0; i < 10; i++) {
    const x = i * 105 - 10
    batch1.push({
      id: nextId('parchment-vert'),
      type: 'path',
      layer: 1,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(x, -20, x + 25, 720, (rand() - 0.5) * 8, rand),
      fill: 'none',
      stroke: parchmentTones[(i + 2) % parchmentTones.length],
      strokeWidth: 70,
      opacity: 0.94,
      brush: { preset: 'pastel', seed: Math.floor(rand() * 100000) },
    })
  }

  // Soft atmospheric partition: Pale sage green angled diagonal zone (left-center, 7 strokes)
  const sageTones = ['#d5e0d0', '#c8d6c3', '#e0ebd9', '#bfceba']
  for (let i = 0; i < 7; i++) {
    const x1 = 120 + i * 45
    const x2 = 20 + i * 45
    batch1.push({
      id: nextId('field-sage-wash'),
      type: 'path',
      layer: 2,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(x1, -20, x2, 720, (rand() - 0.5) * 6, rand),
      fill: 'none',
      stroke: sageTones[i % sageTones.length],
      strokeWidth: 52,
      opacity: 0.75,
      brush: { preset: 'gouache', seed: Math.floor(rand() * 100000) },
    })
  }

  // Soft atmospheric partition: Dusty mauve vertical zone (center-right, 7 strokes)
  const mauveTones = ['#dbced8', '#cfc0cc', '#e4d8e1', '#c7b6c3']
  for (let i = 0; i < 7; i++) {
    const x1 = 490 + i * 45
    const x2 = 410 + i * 45
    batch1.push({
      id: nextId('field-mauve-wash'),
      type: 'path',
      layer: 2,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(x1, -20, x2, 720, (rand() - 0.5) * 6, rand),
      fill: 'none',
      stroke: mauveTones[i % mauveTones.length],
      strokeWidth: 52,
      opacity: 0.68,
      brush: { preset: 'gouache', seed: Math.floor(rand() * 100000) },
    })
  }

  // Soft atmospheric partition: Warm ochre zone (far right, 6 strokes)
  const ochreTones = ['#ecdcb7', '#dfcea5', '#f4e5c5', '#d6c498']
  for (let i = 0; i < 6; i++) {
    const x1 = 810 + i * 40
    const x2 = 740 + i * 40
    batch1.push({
      id: nextId('field-ochre-wash'),
      type: 'path',
      layer: 2,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(x1, -20, x2, 720, (rand() - 0.5) * 6, rand),
      fill: 'none',
      stroke: ochreTones[i % ochreTones.length],
      strokeWidth: 50,
      opacity: 0.65,
      brush: { preset: 'pastel', seed: Math.floor(rand() * 100000) },
    })
  }

  // BATCH 2: Primary cobalt disc and luminous celestial halos (44 marks)
  const batch2: Mark[] = []

  // Radiant outer cerulean & ice blue pastel halo around the cobalt disc (12 arcs)
  for (let i = 0; i < 12; i++) {
    const a1 = (i / 12) * Math.PI * 2
    const a2 = ((i + 1.15) / 12) * Math.PI * 2
    const rHalo = 125 + (rand() - 0.5) * 6
    batch2.push({
      id: nextId('cobalt-halo-arc'),
      type: 'path',
      layer: 4,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: arcPath(280, 260, rHalo, a1, a2, rand),
      fill: 'none',
      stroke: i % 2 === 0 ? '#8fc2ea' : '#70ace0',
      strokeWidth: 20,
      opacity: 0.8,
      brush: { preset: 'pastel', seed: Math.floor(rand() * 100000) },
    })
  }

  // Solid, dense concentric oil brushwork building the cobalt sphere: center x: 280, y: 260, maxR: 110 (24 smooth circular arcs)
  const cobaltColors = ['#1a4b98', '#143c7d', '#225bb3', '#113269', '#2d6bc4', '#0d2753']
  for (let tier = 1; tier <= 6; tier++) {
    const r = (tier / 6) * 110
    const w = tier === 6 ? 22 : 26
    for (let q = 0; q < 4; q++) {
      const a1 = (q / 4) * Math.PI * 2
      const a2 = ((q + 1.15) / 4) * Math.PI * 2
      batch2.push({
        id: nextId('cobalt-disc-arc'),
        type: 'path',
        layer: 6,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: arcPath(280, 260, r, a1, a2, rand),
        fill: 'none',
        stroke: cobaltColors[(tier + q) % cobaltColors.length],
        strokeWidth: w,
        opacity: 0.96,
        brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
      })
    }
  }

  // Inner luminous cyan crescent and impasto core gleam (8 arcs)
  for (let i = 0; i < 8; i++) {
    const a1 = Math.PI * 0.75 + (i / 7) * Math.PI * 0.7
    const a2 = a1 + 0.4
    const r = 35 + i * 7
    batch2.push({
      id: nextId('cobalt-core-gleam'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: arcPath(280, 260, r, a1, a2, rand),
      fill: 'none',
      stroke: i % 2 === 0 ? '#52a7eb' : '#7fc3f4',
      strokeWidth: 7,
      opacity: 0.94,
      brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
    })
  }

  // BATCH 3: Cadmium yellow polygon and vermilion solar sphere (44 marks)
  const batch3: Mark[] = []

  // Vermilion solar sphere: center x: 410, y: 320, r: 70 (20 smooth concentric circular arcs)
  const vermilionColors = ['#d82b1d', '#bf1f12', '#e83e2e', '#a6170c', '#f05241']
  for (let tier = 1; tier <= 5; tier++) {
    const r = (tier / 5) * 70
    const w = tier === 5 ? 18 : 22
    for (let q = 0; q < 4; q++) {
      const a1 = (q / 4) * Math.PI * 2
      const a2 = ((q + 1.15) / 4) * Math.PI * 2
      batch3.push({
        id: nextId('vermilion-sphere-arc'),
        type: 'path',
        layer: 8,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: arcPath(410, 320, r, a1, a2, rand),
        fill: 'none',
        stroke: vermilionColors[(tier + q) % vermilionColors.length],
        strokeWidth: w,
        opacity: 0.96,
        brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
      })
    }
  }

  // Glowing golden-rose halo around vermilion sphere (6 arcs)
  for (let i = 0; i < 6; i++) {
    const a1 = (i / 6) * Math.PI * 2
    const a2 = ((i + 1.15) / 6) * Math.PI * 2
    const rHalo = 82 + (rand() - 0.5) * 4
    batch3.push({
      id: nextId('vermilion-halo-arc'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: arcPath(410, 320, rHalo, a1, a2, rand),
      fill: 'none',
      stroke: i % 2 === 0 ? '#f07d67' : '#f5a695',
      strokeWidth: 12,
      opacity: 0.78,
      brush: { preset: 'pastel', seed: Math.floor(rand() * 100000) },
    })
  }

  // Tilted Cadmium Yellow Bauhaus Square (x: 540..720, y: 140..320): 18 dense cross-hatched strokes
  const yellowColors = ['#f5c218', '#e8b20c', '#fad234', '#dba005', '#fff066', '#f3bb10']
  for (let i = 0; i < 18; i++) {
    const frac = i / 17
    const xTop = 540 + frac * 140
    const yTop = 180 - frac * 40
    const xBot = 580 + frac * 140
    const yBot = 320 - frac * 40
    batch3.push({
      id: nextId('yellow-square-fill'),
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(xTop, yTop, xBot, yBot, (rand() - 0.5) * 2, rand),
      fill: 'none',
      stroke: yellowColors[i % yellowColors.length],
      strokeWidth: 20,
      opacity: 0.98,
      brush: { preset: 'gouache', seed: Math.floor(rand() * 100000) },
    })
  }

  // BATCH 4: Deep violet crescent, emerald wedge, and satellite discs (44 marks)
  const batch4: Mark[] = []

  // Deep Violet Semicircle (lower right, x: 620..800, y: 460..600): 16 dense curved arcs
  const violetColors = ['#4f2b69', '#3f2055', '#60357e', '#321844', '#724095']
  for (let i = 0; i < 16; i++) {
    const frac = i / 15
    const rx = 40 + frac * 140
    const ry = 25 + frac * 115
    batch4.push({
      id: nextId('violet-crescent-stroke'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(800 - rx, 460, 800, 460 + ry, ry * 0.45, rand),
      fill: 'none',
      stroke: violetColors[i % violetColors.length],
      strokeWidth: 18,
      opacity: 0.96,
      brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
    })
  }

  // Dynamic Yellow Wedge / Spear cutting from lower left to upper center: 12 strokes
  for (let i = 0; i < 12; i++) {
    const frac = i / 11
    const x1 = 140 + frac * 40
    const y1 = 700 - frac * 70
    const x2 = 450 + frac * 40
    const y2 = 170 - frac * 40
    batch4.push({
      id: nextId('yellow-wedge-spear'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(x1, y1, x2, y2, 3, rand),
      fill: 'none',
      stroke: i % 2 === 0 ? '#fad02c' : '#f5b700',
      strokeWidth: 10,
      opacity: 0.96,
      brush: { preset: 'gouache', seed: Math.floor(rand() * 100000) },
    })
  }

  // Cerulean Acute Needle Triangle (right of checkerboard): 6 strokes
  const cyanColors = ['#299eb5', '#1a889e', '#3cb4cc', '#146e80']
  for (let i = 0; i < 6; i++) {
    const frac = i / 5
    const xBot = 810 + frac * 50
    batch4.push({
      id: nextId('cyan-triangle-fill'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(720, 170, xBot, 560, (rand() - 0.5) * 2, rand),
      fill: 'none',
      stroke: cyanColors[i % cyanColors.length],
      strokeWidth: 11,
      opacity: 0.94,
      brush: { preset: 'gouache', seed: Math.floor(rand() * 100000) },
    })
  }

  // Emerald Green Planetary Disc (x: 520, y: 660, r: 35): 10 smooth circular arcs
  const emeraldColors = ['#1d7a48', '#146036', '#26965b', '#0d4a27', '#32af6d']
  for (let tier = 1; tier <= 3; tier++) {
    const r = (tier / 3) * 35
    const count = tier === 1 ? 2 : 4
    for (let q = 0; q < count; q++) {
      const a1 = (q / count) * Math.PI * 2
      const a2 = ((q + 1.15) / count) * Math.PI * 2
      batch4.push({
        id: nextId('emerald-disc-arc'),
        type: 'path',
        layer: 9,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: arcPath(520, 660, r, a1, a2, rand),
        fill: 'none',
        stroke: emeraldColors[(tier + q) % emeraldColors.length],
        strokeWidth: 14,
        opacity: 0.96,
        brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
      })
    }
  }

  // BATCH 5: Suspended checkerboard matrices and geometric grids (44 marks)
  const batch5: Mark[] = []

  // Bauhaus 4x4 Checkerboard Matrix (x: 680..760, y: 280..360, each cell 20x20): 32 marks
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isDark = (r + c) % 2 === 1
      const xCell = 680 + c * 20
      const yCell = 280 + r * 20
      const col = isDark ? '#141210' : r === 0 && c === 0 ? '#d82b1d' : r === 3 && c === 3 ? '#f5c218' : '#faf6ee'
      const preset = isDark ? ('charcoal' as const) : ('gouache' as const)

      batch5.push({
        id: nextId('checker-cell-a'),
        type: 'path',
        layer: 11,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: curvedStroke(xCell + 3, yCell + 6, xCell + 17, yCell + 6, 0, rand),
        fill: 'none',
        stroke: col,
        strokeWidth: 9,
        opacity: 0.98,
        brush: { preset, seed: Math.floor(rand() * 100000) },
      })
      batch5.push({
        id: nextId('checker-cell-b'),
        type: 'path',
        layer: 11,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: curvedStroke(xCell + 3, yCell + 14, xCell + 17, yCell + 14, 0, rand),
        fill: 'none',
        stroke: col,
        strokeWidth: 9,
        opacity: 0.98,
        brush: { preset, seed: Math.floor(rand() * 100000) },
      })
    }
  }

  // Linear grid bounding struts around the checkerboard and geometric axes (12 marks)
  const gridStruts = [
    { x1: 678, y1: 278, x2: 762, y2: 278, w: 2.5, col: '#141210' },
    { x1: 678, y1: 362, x2: 762, y2: 362, w: 2.5, col: '#141210' },
    { x1: 678, y1: 278, x2: 678, y2: 362, w: 2.5, col: '#141210' },
    { x1: 762, y1: 278, x2: 762, y2: 362, w: 2.5, col: '#141210' },
    { x1: 678, y1: 320, x2: 762, y2: 320, w: 1.8, col: '#2c251e' },
    { x1: 720, y1: 278, x2: 720, y2: 362, w: 1.8, col: '#2c251e' },
    { x1: 660, y1: 260, x2: 780, y2: 260, w: 1.5, col: '#453c33' },
    { x1: 660, y1: 380, x2: 780, y2: 380, w: 1.5, col: '#453c33' },
    { x1: 660, y1: 260, x2: 660, y2: 380, w: 1.5, col: '#453c33' },
    { x1: 780, y1: 260, x2: 780, y2: 380, w: 1.5, col: '#453c33' },
    { x1: 700, y1: 240, x2: 740, y2: 400, w: 1.2, col: '#5a4e42' },
    { x1: 640, y1: 340, x2: 800, y2: 300, w: 1.2, col: '#5a4e42' },
  ]
  gridStruts.forEach((gs) => {
    batch5.push({
      id: nextId('grid-strut'),
      type: 'path',
      layer: 12,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(gs.x1, gs.y1, gs.x2, gs.y2, 0, rand),
      fill: 'none',
      stroke: gs.col,
      strokeWidth: gs.w,
      opacity: 0.95,
      brush: { preset: 'ink', seed: Math.floor(rand() * 100000) },
    })
  })

  // BATCH 6: Dynamic linear vectors, tension rays, and arcs (46 marks)
  const batch6: Mark[] = []

  // Dynamic tension vector lines piercing through composition (20 marks)
  const tensionLines = [
    { x1: 60, y1: 730, x2: 880, y2: 200, w: 3.5, col: '#141210', p: 'ink' as const },
    { x1: 90, y1: 260, x2: 640, y2: 670, w: 3.0, col: '#141210', p: 'ink' as const },
    { x1: 340, y1: 80, x2: 640, y2: 740, w: 3.2, col: '#141210', p: 'ink' as const },
    { x1: 520, y1: 110, x2: 520, y2: 630, w: 3.5, col: '#141210', p: 'ink' as const },
    { x1: 550, y1: 110, x2: 550, y2: 630, w: 2.2, col: '#141210', p: 'ink' as const },
    { x1: 460, y1: 600, x2: 860, y2: 600, w: 3.0, col: '#141210', p: 'ink' as const },
    { x1: 540, y1: 640, x2: 840, y2: 640, w: 1.8, col: '#2c251e', p: 'ink' as const },
    { x1: 140, y1: 640, x2: 940, y2: 350, w: 3.2, col: '#d82b1d', p: 'oil' as const },
    { x1: 580, y1: 540, x2: 890, y2: 510, w: 3.2, col: '#d82b1d', p: 'oil' as const },
    { x1: 140, y1: 500, x2: 850, y2: 680, w: 2.8, col: '#1a4b98', p: 'oil' as const },
    { x1: 720, y1: 170, x2: 860, y2: 560, w: 4.0, col: '#178fa3', p: 'oil' as const },
    { x1: 720, y1: 170, x2: 810, y2: 560, w: 3.0, col: '#116574', p: 'oil' as const },
    { x1: 280, y1: 150, x2: 560, y2: 380, w: 2.0, col: '#141210', p: 'ink' as const },
    { x1: 170, y1: 260, x2: 440, y2: 450, w: 2.0, col: '#141210', p: 'ink' as const },
    { x1: 200, y1: 380, x2: 270, y2: 350, w: 2.5, col: '#141210', p: 'ink' as const },
    { x1: 620, y1: 680, x2: 780, y2: 780, w: 2.8, col: '#141210', p: 'ink' as const },
    { x1: 360, y1: 420, x2: 480, y2: 450, w: 2.2, col: '#d82b1d', p: 'oil' as const },
    { x1: 480, y1: 450, x2: 440, y2: 540, w: 2.2, col: '#d82b1d', p: 'oil' as const },
    { x1: 640, y1: 480, x2: 780, y2: 590, w: 3.2, col: '#141210', p: 'ink' as const },
    { x1: 460, y1: 570, x2: 680, y2: 610, w: 2.5, col: '#1a4b98', p: 'oil' as const },
  ]
  tensionLines.forEach((tl) => {
    batch6.push({
      id: nextId('tension-vector'),
      type: 'path',
      layer: 13,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(tl.x1, tl.y1, tl.x2, tl.y2, 0, rand),
      fill: 'none',
      stroke: tl.col,
      strokeWidth: tl.w,
      opacity: 0.96,
      brush: { preset: tl.p, seed: Math.floor(rand() * 100000) },
    })
  })

  // Dynamic sweeping curved arcs (14 marks)
  const arcSpans = [
    { x1: 140, y1: 500, x2: 420, y2: 480, c: 35, col: '#1a4b98', w: 3 },
    { x1: 420, y1: 480, x2: 700, y2: 430, c: 45, col: '#d82b1d', w: 3.2 },
    { x1: 340, y1: 450, x2: 480, y2: 360, c: -25, col: '#141210', w: 2.4 },
    { x1: 350, y1: 480, x2: 480, y2: 390, c: -25, col: '#141210', w: 2.4 },
    { x1: 360, y1: 510, x2: 480, y2: 420, c: -25, col: '#141210', w: 2.4 },
    { x1: 580, y1: 540, x2: 890, y2: 510, c: 60, col: '#d82b1d', w: 3.5 },
    { x1: 620, y1: 460, x2: 800, y2: 600, c: 70, col: '#141210', w: 3 },
  ]
  arcSpans.forEach((as) => {
    for (let k = 0; k < 2; k++) {
      batch6.push({
        id: nextId('sweeping-arc-vector'),
        type: 'path',
        layer: 14,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: curvedStroke(as.x1, as.y1 + k * 2, as.x2, as.y2 + k * 2, as.c, rand),
        fill: 'none',
        stroke: as.col,
        strokeWidth: as.w,
        opacity: 0.94,
        brush: { preset: 'ink', seed: Math.floor(rand() * 100000) },
      })
    }
  })

  // Ray cross-hatch intersections (12 marks)
  for (let i = 0; i < 12; i++) {
    const rx = 440 + i * 22
    const ry = 580 - i * 14
    batch6.push({
      id: nextId('ray-cross-hatch'),
      type: 'path',
      layer: 13,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(rx - 12, ry - 14, rx + 12, ry + 14, 0, rand),
      fill: 'none',
      stroke: i % 2 === 0 ? '#141210' : '#d82b1d',
      strokeWidth: 2.2,
      opacity: 0.92,
      brush: { preset: 'ink', seed: Math.floor(rand() * 100000) },
    })
  }

  // BATCH 7: Target constellations, orbital rings, and planetary discs (44 marks)
  const batch7: Mark[] = []

  // Grand outer hollow black ring encircling the cobalt disc: 6 smooth circular SVG arcs
  for (let i = 0; i < 6; i++) {
    const a1 = (i / 6) * Math.PI * 2
    const a2 = ((i + 1.15) / 6) * Math.PI * 2
    batch7.push({
      id: nextId('black-hollow-ring-arc'),
      type: 'path',
      layer: 15,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: arcPath(280, 260, 155, a1, a2, rand),
      fill: 'none',
      stroke: '#141210',
      strokeWidth: 4.5,
      opacity: 0.96,
      brush: { preset: 'ink', seed: Math.floor(rand() * 100000) },
    })
  }

  // Target Constellation Bullseye (upper right, x: 820, y: 220): 16 marks
  // Outer crimson ring (8 arcs)
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2
    const a2 = ((i + 1.15) / 8) * Math.PI * 2
    batch7.push({
      id: nextId('bullseye-outer-crimson'),
      type: 'path',
      layer: 15,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: arcPath(820, 220, 26, a1, a2, rand),
      fill: 'none',
      stroke: '#d82b1d',
      strokeWidth: 4.0,
      opacity: 0.96,
      brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
    })
  }
  // Mid white ring (4 arcs)
  for (let i = 0; i < 4; i++) {
    const a1 = (i / 4) * Math.PI * 2
    const a2 = ((i + 1.2) / 4) * Math.PI * 2
    batch7.push({
      id: nextId('bullseye-mid-white'),
      type: 'path',
      layer: 16,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: arcPath(820, 220, 16, a1, a2, rand),
      fill: 'none',
      stroke: '#ffffff',
      strokeWidth: 3.5,
      opacity: 0.98,
      brush: { preset: 'gouache', seed: Math.floor(rand() * 100000) },
    })
  }
  // Inner solid core disc (4 arcs)
  for (let i = 0; i < 4; i++) {
    const a1 = (i / 4) * Math.PI * 2
    const a2 = ((i + 1.2) / 4) * Math.PI * 2
    batch7.push({
      id: nextId('bullseye-core-arc'),
      type: 'path',
      layer: 17,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: arcPath(820, 220, 7, a1, a2, rand),
      fill: 'none',
      stroke: '#d82b1d',
      strokeWidth: 5,
      opacity: 0.98,
      brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
    })
  }

  // Satellite orbiting planetary discs (22 marks)
  const satellites = [
    { x: 420, y: 120, r: 8, col: '#1a4b98' },
    { x: 380, y: 155, r: 7, col: '#d82b1d' },
    { x: 450, y: 165, r: 6, col: '#f5c218' },
    { x: 170, y: 455, r: 9, col: '#141210' },
    { x: 145, y: 495, r: 6, col: '#f5c218' },
    { x: 620, y: 560, r: 10, col: '#1a4b98' },
    { x: 655, y: 590, r: 7, col: '#d82b1d' },
    { x: 740, y: 690, r: 7, col: '#f5c218' },
    { x: 880, y: 720, r: 8, col: '#141210' },
    { x: 915, y: 700, r: 6, col: '#d82b1d' },
    { x: 205, y: 685, r: 8, col: '#f5c218' },
  ]
  satellites.forEach((sat) => {
    // Disc body
    batch7.push({
      id: nextId('satellite-disc-body'),
      type: 'path',
      layer: 16,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(sat.x - sat.r, sat.y, sat.x + sat.r, sat.y, sat.r * 0.8, rand),
      fill: 'none',
      stroke: sat.col,
      strokeWidth: sat.r * 1.6,
      opacity: 0.96,
      brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
    })
    // Halo rim
    batch7.push({
      id: nextId('satellite-disc-rim'),
      type: 'path',
      layer: 17,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(sat.x - sat.r * 0.4, sat.y - sat.r * 0.3, sat.x + sat.r * 0.4, sat.y - sat.r * 0.3, 1, rand),
      fill: 'none',
      stroke: '#ffffff',
      strokeWidth: 2.2,
      opacity: 0.95,
      brush: { preset: 'gouache', seed: Math.floor(rand() * 100000) },
    })
  })

  // BATCH 8: Musical vibration lattices, hatch combs, and calligraphic glyphs (42 marks)
  const batch8: Mark[] = []

  // Vertical parallel musical comb/harp striae inside violet semicircle (12 marks)
  for (let i = 0; i < 12; i++) {
    const hx = 750 + i * 4
    batch8.push({
      id: nextId('harp-comb-stria'),
      type: 'path',
      layer: 16,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(hx, 500, hx, 555, 0, rand),
      fill: 'none',
      stroke: '#141210',
      strokeWidth: 1.8,
      opacity: 0.94,
      brush: { preset: 'ink', seed: Math.floor(rand() * 100000) },
    })
  }

  // Cross-hatched diagonal vibration zones in yellow wedge apex (14 marks)
  for (let i = 0; i < 14; i++) {
    const vx = 180 + i * 14
    const vy = 640 - i * 26
    batch8.push({
      id: nextId('wedge-vibration-hatch'),
      type: 'path',
      layer: 15,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(vx - 10, vy - 10, vx + 10, vy + 10, 0, rand),
      fill: 'none',
      stroke: i % 2 === 0 ? '#141210' : '#d82b1d',
      strokeWidth: 2.2,
      opacity: 0.92,
      brush: { preset: 'ink', seed: Math.floor(rand() * 100000) },
    })
  }

  // Calligraphic glyphs and acute angle needles (16 marks)
  const calligraphicGlyphs = [
    { x1: 210, y1: 670, x2: 210, y2: 700, w: 3 },
    { x1: 205, y1: 685, x2: 235, y2: 685, w: 2.5 },
    { x1: 520, y1: 390, x2: 550, y2: 410, w: 3.5 },
    { x1: 520, y1: 410, x2: 550, y2: 390, w: 3.5 },
    { x1: 720, y1: 140, x2: 770, y2: 120, w: 2.8 },
    { x1: 770, y1: 120, x2: 760, y2: 160, w: 2.8 },
    { x1: 860, y1: 290, x2: 910, y2: 300, w: 3 },
    { x1: 890, y1: 280, x2: 880, y2: 310, w: 3 },
    { x1: 310, y1: 180, x2: 350, y2: 150, w: 3 },
    { x1: 340, y1: 140, x2: 360, y2: 180, w: 3 },
    { x1: 600, y1: 240, x2: 630, y2: 220, w: 3 },
    { x1: 625, y1: 215, x2: 615, y2: 245, w: 3 },
    { x1: 450, y1: 620, x2: 490, y2: 630, w: 2.5 },
    { x1: 470, y1: 610, x2: 470, y2: 640, w: 2.5 },
    { x1: 800, y1: 430, x2: 840, y2: 410, w: 3 },
    { x1: 825, y1: 400, x2: 825, y2: 435, w: 3 },
  ]
  calligraphicGlyphs.forEach((cg) => {
    batch8.push({
      id: nextId('calligraphic-glyph'),
      type: 'path',
      layer: 17,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(cg.x1, cg.y1, cg.x2, cg.y2, 0, rand),
      fill: 'none',
      stroke: '#141210',
      strokeWidth: cg.w,
      opacity: 0.96,
      brush: { preset: 'ink', seed: Math.floor(rand() * 100000) },
    })
  })

  // BATCH 9: Luminous gouache accents, impasto nodes, and focal points (40 marks)
  const batch9: Mark[] = []

  // Pure white gouache stellar spark points and intersection nodes (16 marks)
  const whiteFocalPoints = [
    { x: 280, y: 260, r: 6 },
    { x: 410, y: 320, r: 5 },
    { x: 540, y: 180, r: 4 },
    { x: 680, y: 140, r: 4 },
    { x: 720, y: 280, r: 4 },
    { x: 580, y: 320, r: 4 },
    { x: 520, y: 660, r: 4.5 },
    { x: 820, y: 220, r: 3.5 },
    { x: 680, y: 280, r: 3.5 },
    { x: 760, y: 280, r: 3.5 },
    { x: 760, y: 360, r: 3.5 },
    { x: 680, y: 360, r: 3.5 },
    { x: 210, y: 685, r: 4 },
    { x: 640, y: 480, r: 3.5 },
    { x: 460, y: 600, r: 4 },
    { x: 520, y: 400, r: 4 },
  ]
  whiteFocalPoints.forEach((wp) => {
    batch9.push({
      id: nextId('white-focal-spark'),
      type: 'path',
      layer: 18,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(wp.x - wp.r, wp.y, wp.x + wp.r, wp.y, wp.r * 0.8, rand),
      fill: 'none',
      stroke: '#ffffff',
      strokeWidth: wp.r * 2,
      opacity: 0.98,
      brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
    })
  })

  // Sharp black needle points and anchor nodes (12 marks)
  const blackAnchorNodes = [
    { x: 915, y: 730, r: 5 },
    { x: 880, y: 755, r: 4.5 },
    { x: 165, y: 465, r: 5 },
    { x: 420, y: 120, r: 4 },
    { x: 620, y: 560, r: 4.5 },
    { x: 520, y: 110, r: 4 },
    { x: 520, y: 630, r: 4 },
    { x: 860, y: 560, r: 4 },
    { x: 800, y: 600, r: 4.5 },
    { x: 620, y: 460, r: 4.5 },
    { x: 800, y: 460, r: 4.5 },
    { x: 340, y: 80, r: 4 },
  ]
  blackAnchorNodes.forEach((bn) => {
    batch9.push({
      id: nextId('black-anchor-node'),
      type: 'path',
      layer: 18,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(bn.x - bn.r, bn.y, bn.x + bn.r, bn.y, bn.r * 0.8, rand),
      fill: 'none',
      stroke: '#100e0c',
      strokeWidth: bn.r * 1.8,
      opacity: 0.98,
      brush: { preset: 'ink', seed: Math.floor(rand() * 100000) },
    })
  })

  // Final impasto light glints on geometric contours (12 marks)
  const contourLightGlints = [
    { x1: 540, y1: 180, x2: 610, y2: 160, w: 3.5 },
    { x1: 610, y1: 160, x2: 680, y2: 140, w: 3.8 },
    { x1: 680, y1: 140, x2: 700, y2: 210, w: 3.2 },
    { x1: 820, y1: 200, x2: 835, y2: 215, w: 2.8 },
    { x1: 275, y1: 155, x2: 320, y2: 170, w: 4.0 },
    { x1: 380, y1: 260, x2: 410, y2: 275, w: 3.5 },
    { x1: 490, y1: 630, x2: 520, y2: 628, w: 3.0 },
    { x1: 720, y1: 460, x2: 770, y2: 460, w: 3.2 },
    { x1: 680, y1: 280, x2: 720, y2: 280, w: 2.8 },
    { x1: 140, y1: 700, x2: 160, y2: 650, w: 3.0 },
    { x1: 760, y1: 360, x2: 760, y2: 320, w: 2.6 },
    { x1: 520, y1: 630, x2: 550, y2: 630, w: 3.0 },
  ]
  contourLightGlints.forEach((cg) => {
    batch9.push({
      id: nextId('contour-light-glint'),
      type: 'path',
      layer: 18,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: curvedStroke(cg.x1, cg.y1, cg.x2, cg.y2, 0, rand),
      fill: 'none',
      stroke: '#ffffff',
      strokeWidth: cg.w,
      opacity: 0.98,
      brush: { preset: 'oil', seed: Math.floor(rand() * 100000) },
    })
  })

  return {
    slug: 'kandinsky-harmony',
    title: 'Dynamic Equilibrium in Geometric Space',
    brief: 'A non-objective abstract masterwork synthesizing Kandinsky’s Bauhaus geometry with tactile gouache, impasto oil brushwork, textured ground, celestial discs, tension vectors, and checkerboard matrix.',
    style: 'Geometric Abstraction in the tradition of Wassily Kandinsky (Bauhaus period). Primary color triad of cobalt blue, cadmium vermilion, and lemon gold; rich multi-directional gouache and pastel ground washes; painterly concentric brushwork building discs and halos; calligraphic black ink tension vectors and suspended checkerboard matrix.',
    batches: [
      { label: 'Toned atmospheric field and partitioned ground washes', marks: batch1 },
      { label: 'Primary cobalt disc and luminous celestial halos', marks: batch2 },
      { label: 'Cadmium yellow polygon and vermilion solar sphere', marks: batch3 },
      { label: 'Deep violet crescent, emerald wedge, and satellite discs', marks: batch4 },
      { label: 'Suspended checkerboard matrices and geometric grids', marks: batch5 },
      { label: 'Dynamic linear vectors, tension rays, and arcs', marks: batch6 },
      { label: 'Target constellations, orbital rings, and planetary discs', marks: batch7 },
      { label: 'Musical vibration lattices, hatch combs, and calligraphic glyphs', marks: batch8 },
      { label: 'Luminous gouache accents, impasto nodes, and focal points', marks: batch9 },
    ],
  }
}

// Self-executing CLI generator
if (process.argv[1]?.endsWith('generate-kandinsky.ts')) {
  const p = createKandinsky()
  const stats = validatePiece(p)
  renderPiece(p, path.resolve('renders/kandinsky-harmony.png'))
  console.log(`Kandinsky Harmony Rendered: ${stats.totalMarks} marks in ${stats.batchCount} batches`)
  fs.writeFileSync('src/studio/examples/kandinsky-harmony.json', JSON.stringify(p, null, 2), 'utf8')
}
