import fs from 'node:fs'
import path from 'node:path'
import { renderPiece, validatePiece, type Piece } from './render-piece.ts'
import type { Mark } from '../src/studio/model.ts'

// Deterministic pseudo-random generator
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

export function createMasterShanShui(): Piece {
  const rand = makeRandom(33101)
  let markCounter = 0
  const nextId = (prefix: string) => `shanshui-${prefix}-${++markCounter}`

  // =============================================================
  // BATCH 1: Aged Silk Ground & Distant Mountain Ridges (38 marks)
  // =============================================================
  const batch1: Mark[] = []
  // Aged Xuan silk ground
  batch1.push({
    id: nextId('silk-ground'),
    type: 'rect',
    layer: 1,
    x: 0, y: 0, width: 1000, height: 700,
    fill: '#f3ede2', stroke: 'none', strokeWidth: 0, opacity: 1,
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })
  // Sky tea wash tone along upper edge (5 marks)
  for (let i = 0; i < 5; i++) {
    const sx = (rand() - 0.1) * 350
    const sy = 15 + i * 20 + (rand() - 0.5) * 6
    const w = 450 + rand() * 250
    batch1.push({
      id: nextId('sky-wash'),
      type: 'path',
      layer: 2,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#e4dcce', strokeWidth: 26 + rand() * 12,
      opacity: 0.28 + rand() * 0.14,
      d: curvedStroke(sx, sy, sx + w * 0.5, sy + (rand() - 0.5) * 8, sx + w, sy, 6, rand),
      brush: { preset: 'ink', seed: 100 + i },
    })
  }

  // 2 Solid distant mountain silhouettes with ink wash granulation
  batch1.push(
    {
      id: nextId('far-peak-mass-left'),
      type: 'path',
      layer: 3,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: '#bcb8ad', stroke: 'none', strokeWidth: 0, opacity: 0.45,
      d: 'M 140 320 L 170 190 L 210 110 L 240 130 L 270 220 L 320 180 L 360 250 L 410 330 C 310 350 200 340 140 320 Z',
      brush: { preset: 'ink', seed: 201 },
    },
    {
      id: nextId('far-peak-mass-center'),
      type: 'path',
      layer: 3,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: '#aba69a', stroke: 'none', strokeWidth: 0, opacity: 0.5,
      d: 'M 350 290 L 410 150 L 440 70 L 470 90 L 510 180 L 550 140 L 590 230 L 640 320 C 530 340 430 320 350 290 Z',
      brush: { preset: 'ink', seed: 202 },
    },
  )
  // 30 diagonal wash strokes giving broken tone and atmospheric depth across the distant ridges
  const farPeaks = [
    { apexX: 210, apexY: 110, leftW: 70, rightW: 190, base: 320 },
    { apexX: 440, apexY: 70, leftW: 90, rightW: 190, base: 290 },
  ]
  const farTones = ['#baa998', '#ab9c8d', '#c2b3a4', '#9e8f81']
  farPeaks.forEach((pk, pIdx) => {
    for (let k = 0; k < 15; k++) {
      const frac = k / 14
      const isLeft = k % 2 === 0
      const sx = pk.apexX + (isLeft ? -frac * pk.leftW * 0.35 : frac * pk.rightW * 0.35)
      const sy = pk.apexY + frac * 50
      const ex = pk.apexX + (isLeft ? -pk.leftW * (0.35 + frac * 0.65) : pk.rightW * (0.35 + frac * 0.65))
      const ey = pk.base - (1 - frac) * 30 + (rand() - 0.5) * 8
      const cx = (sx + ex) * 0.5 + (rand() - 0.5) * 10
      const cy = (sy + ey) * 0.5 + (rand() - 0.5) * 6
      batch1.push({
        id: nextId(`far-ridge-${pIdx}`),
        type: 'path',
        layer: 4,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        fill: 'none', stroke: farTones[(pIdx * 3 + k) % farTones.length]!,
        strokeWidth: 12 + rand() * 8,
        opacity: 0.28 + rand() * 0.18,
        d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
        brush: { preset: 'ink', seed: 210 + pIdx * 15 + k },
      })
    }
  })

  // =============================================================
  // BATCH 2: Left Towering Karst Crag Mass & Facets (46 marks)
  // =============================================================
  // Left crag at x: 120..310, y: 280..550
  // Solid underpainting mass + 18 body strokes + 18 axe cuts + 9 contours = 46 marks
  const batch2: Mark[] = []
  batch2.push({
    id: nextId('cliff-left-mass'),
    type: 'path',
    layer: 5,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    fill: '#46423a', stroke: 'none', strokeWidth: 0, opacity: 0.94,
    d: 'M 120 540 L 150 410 L 200 310 L 240 280 L 270 340 L 310 440 L 280 550 Z',
    brush: { preset: 'ink', seed: 301 },
  })
  // 18 broken-tone body strokes
  const leftCragTones = ['#4a453d', '#3a352d', '#524c43', '#2e2a23', '#433e36']
  for (let i = 0; i < 18; i++) {
    const fracY = i / 17
    const curY = 290 + fracY * 240
    const halfW = 20 + Math.pow(fracY, 1.1) * 60
    const curX = 220 + (rand() - 0.5) * halfW * 1.3
    const angle = curX < 220 ? 1.8 + rand() * 0.4 : 1.2 + rand() * 0.4
    const len = 30 + rand() * 40
    const ex = curX + Math.cos(angle) * len * 0.5
    const ey = curY + Math.sin(angle) * len
    batch2.push({
      id: nextId('left-crag-body'),
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: leftCragTones[i % leftCragTones.length]!,
      strokeWidth: 14 + rand() * 8,
      opacity: 0.84 + rand() * 0.12,
      d: `M ${curX.toFixed(1)} ${curY.toFixed(1)} Q ${(curX + ex) * 0.5} ${(curY + ey) * 0.5} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      brush: { preset: 'ink', seed: 310 + i },
    })
  }
  // 18 axe-cut cun (斧劈皴) facets carving the crag
  for (let i = 0; i < 18; i++) {
    const fracY = i / 17
    const by = 295 + fracY * 230
    const halfW = 18 + Math.pow(fracY, 1.1) * 50
    const bx = 220 + (rand() - 0.5) * halfW * 1.2
    const len = 14 + rand() * 16
    const ang = 1.9 + rand() * 0.6
    const x1 = bx + Math.cos(ang) * len
    const y1 = by + Math.sin(ang) * len
    const x2 = x1 + 5 + rand() * 5
    const y2 = y1 + 3 + rand() * 4
    batch2.push({
      id: nextId('left-crag-axecut'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: ['#161411', '#0b0a08', '#201d18'][i % 3]!,
      strokeWidth: 2.2 + rand() * 2.0,
      opacity: 0.94,
      d: `M ${bx.toFixed(1)} ${by.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      brush: { preset: 'ink', seed: 330 + i },
    })
  }
  // 9 rock contour lines defining the crag ridges
  const leftContours = [
    'M 120 540 L 150 410 L 200 310 L 240 280',
    'M 240 280 L 270 340 L 310 440 L 280 550',
    'M 200 310 L 225 380 L 235 460',
    'M 150 410 L 175 470 L 190 540',
    'M 260 360 L 280 430',
    'M 140 470 L 175 530',
    'M 215 340 L 240 400',
    'M 240 420 L 265 490',
    'M 270 340 L 290 410',
  ]
  leftContours.forEach((d) => {
    batch2.push({
      id: nextId('left-crag-contour'),
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#12100e', strokeWidth: 2.5 + rand() * 1.5,
      opacity: 0.96,
      d,
      brush: { preset: 'ink', seed: 360 + markCounter },
    })
  })

  // =============================================================
  // BATCH 3: Central Karst Monolith Mass & Cleavage (46 marks)
  // =============================================================
  // Central monolith at x: 280..440, y: 200..520
  // Solid underpainting mass + 16 body strokes + 20 axe cuts + 9 contours = 46 marks
  const batch3: Mark[] = []
  batch3.push({
    id: nextId('central-karst-mass'),
    type: 'path',
    layer: 5,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    fill: '#3c3831', stroke: 'none', strokeWidth: 0, opacity: 0.95,
    d: 'M 280 520 L 320 360 L 350 240 L 380 200 L 410 240 L 440 380 L 430 510 Z',
    brush: { preset: 'ink', seed: 401 },
  })
  // 16 body strokes
  const centerCragTones = ['#423d35', '#332f28', '#4b453c', '#28251f', '#3c3730']
  for (let i = 0; i < 16; i++) {
    const fracY = i / 15
    const curY = 210 + fracY * 290
    const halfW = 18 + Math.pow(fracY, 1.1) * 50
    const curX = 370 + (rand() - 0.5) * halfW * 1.3
    const angle = curX < 370 ? 1.8 + rand() * 0.4 : 1.2 + rand() * 0.4
    const len = 30 + rand() * 45
    const ex = curX + Math.cos(angle) * len * 0.5
    const ey = curY + Math.sin(angle) * len
    batch3.push({
      id: nextId('center-crag-body'),
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: centerCragTones[i % centerCragTones.length]!,
      strokeWidth: 15 + rand() * 8,
      opacity: 0.85 + rand() * 0.12,
      d: `M ${curX.toFixed(1)} ${curY.toFixed(1)} Q ${(curX + ex) * 0.5} ${(curY + ey) * 0.5} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      brush: { preset: 'ink', seed: 410 + i },
    })
  }
  // 20 axe cuts
  for (let i = 0; i < 20; i++) {
    const fracY = i / 19
    const by = 220 + fracY * 275
    const halfW = 16 + Math.pow(fracY, 1.1) * 45
    const bx = 370 + (rand() - 0.5) * halfW * 1.2
    const len = 14 + rand() * 16
    const ang = (i % 2 === 0 ? 1.9 : 0.8) + (rand() - 0.5) * 0.4
    const x1 = bx + Math.cos(ang) * len
    const y1 = by + Math.sin(ang) * len
    const x2 = x1 + (i % 2 === 0 ? 5 : -5)
    const y2 = y1 + 3 + rand() * 4
    batch3.push({
      id: nextId('center-crag-axecut'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: ['#14120f', '#0c0b09', '#1e1b16'][i % 3]!,
      strokeWidth: 2.2 + rand() * 2.0,
      opacity: 0.94,
      d: `M ${bx.toFixed(1)} ${by.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      brush: { preset: 'ink', seed: 430 + i },
    })
  }
  // 9 contour lines
  const centerContours = [
    'M 280 520 L 320 360 L 350 240 L 380 200',
    'M 380 200 L 410 240 L 440 380 L 430 510',
    'M 350 240 L 375 205 L 405 240 L 415 310 L 435 380',
    'M 320 360 L 345 320 L 370 340 L 390 420',
    'M 345 320 L 370 380 L 385 470',
    'M 380 280 L 405 340 L 420 430',
    'M 310 420 L 335 480',
    'M 390 440 L 415 500',
    'M 360 410 L 380 480',
  ]
  centerContours.forEach((d) => {
    batch3.push({
      id: nextId('center-crag-contour'),
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#100e0c', strokeWidth: 2.5 + rand() * 1.5,
      opacity: 0.96,
      d,
      brush: { preset: 'ink', seed: 460 + markCounter },
    })
  })

  // =============================================================
  // BATCH 4: Right Karst Mass & Canyon Shadow Cleft (46 marks)
  // =============================================================
  // Right karst mass at x: 450..640, y: 180..510
  // Solid underpainting mass + 12 cleft shadow + 14 body + 12 axe cuts + 7 contours = 46 marks
  const batch4: Mark[] = []
  batch4.push({
    id: nextId('right-karst-mass'),
    type: 'path',
    layer: 5,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    fill: '#35312a', stroke: 'none', strokeWidth: 0, opacity: 0.95,
    d: 'M 460 510 L 480 320 L 510 210 L 540 180 L 570 230 L 610 350 L 640 490 Z',
    brush: { preset: 'ink', seed: 501 },
  })
  // 12 deep black shadow strokes behind waterfall (x: 438..450, y: 220..480)
  for (let c = 0; c < 12; c++) {
    const cy = 220 + c * 22
    batch4.push({
      id: nextId('waterfall-cleft-shadow'),
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#080706',
      strokeWidth: 10 + rand() * 6,
      opacity: 0.96,
      d: `M 444 ${cy} Q ${444 + (rand() - 0.5) * 4} ${cy + 15} 444 ${cy + 26}`,
      brush: { preset: 'ink', seed: 510 + c },
    })
  }
  // 14 body strokes
  const rightCragTones = ['#3c3730', '#2d2923', '#454038', '#25221c', '#36312a']
  for (let i = 0; i < 14; i++) {
    const fracY = i / 13
    const curY = 195 + fracY * 295
    const halfW = 18 + Math.pow(fracY, 1.1) * 55
    const curX = 545 + (rand() - 0.5) * halfW * 1.3
    const angle = curX < 545 ? 1.8 + rand() * 0.4 : 1.2 + rand() * 0.4
    const len = 30 + rand() * 40
    const ex = curX + Math.cos(angle) * len * 0.5
    const ey = curY + Math.sin(angle) * len
    batch4.push({
      id: nextId('right-crag-body'),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: rightCragTones[i % rightCragTones.length]!,
      strokeWidth: 15 + rand() * 8,
      opacity: 0.85 + rand() * 0.12,
      d: `M ${curX.toFixed(1)} ${curY.toFixed(1)} Q ${(curX + ex) * 0.5} ${(curY + ey) * 0.5} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      brush: { preset: 'ink', seed: 530 + i },
    })
  }
  // 12 axe cuts
  for (let i = 0; i < 12; i++) {
    const fracY = i / 11
    const by = 210 + fracY * 270
    const halfW = 16 + Math.pow(fracY, 1.1) * 50
    const bx = 545 + (rand() - 0.5) * halfW * 1.2
    const len = 14 + rand() * 16
    const ang = (i % 2 === 0 ? 2.0 : 0.7) + (rand() - 0.5) * 0.4
    const x1 = bx + Math.cos(ang) * len
    const y1 = by + Math.sin(ang) * len
    const x2 = x1 + (i % 2 === 0 ? 5 : -5)
    const y2 = y1 + 3 + rand() * 4
    batch4.push({
      id: nextId('right-crag-axecut'),
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: ['#14120f', '#0c0b09', '#1e1b16'][i % 3]!,
      strokeWidth: 2.2 + rand() * 2.0,
      opacity: 0.94,
      d: `M ${bx.toFixed(1)} ${by.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      brush: { preset: 'ink', seed: 550 + i },
    })
  }
  // 7 contours
  const rightContours = [
    'M 460 510 L 480 320 L 510 210 L 540 180',
    'M 540 180 L 570 230 L 610 350 L 640 490',
    'M 510 210 L 535 185 L 565 225 L 585 310',
    'M 480 320 L 505 280 L 535 305 L 555 400',
    'M 535 340 L 560 410 L 580 480',
    'M 570 380 L 600 450',
    'M 590 320 L 620 390',
  ]
  rightContours.forEach((d) => {
    batch4.push({
      id: nextId('right-crag-contour'),
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#100e0c', strokeWidth: 2.5 + rand() * 1.5,
      opacity: 0.96,
      d,
      brush: { preset: 'ink', seed: 570 + markCounter },
    })
  })

  // =============================================================
  // BATCH 5: Cascading Cataract, Chasm Rapids & Foam (44 marks)
  // =============================================================
  const batch5: Mark[] = []
  // 24 fine ribbons of white mineral gouache
  const fallCols = ['#ffffff', '#f7f4ed', '#ece6db']
  for (let i = 0; i < 24; i++) {
    const sx = 442 + (rand() - 0.5) * 8
    const sy = 245 + rand() * 25
    const ey = 465 + rand() * 20
    const my1 = sy + (ey - sy) * 0.35
    const my2 = sy + (ey - sy) * 0.72
    batch5.push({
      id: nextId('waterfall-thread'),
      type: 'path',
      layer: 9,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: fallCols[i % fallCols.length]!,
      strokeWidth: 1.5 + rand() * 1.6,
      opacity: 0.92 + rand() * 0.06,
      d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${(sx + (rand() - 0.5) * 4).toFixed(1)} ${my1.toFixed(1)} ${(sx + (rand() - 0.5) * 4).toFixed(1)} ${my2.toFixed(1)} ${(sx + (rand() - 0.5) * 3).toFixed(1)} ${ey.toFixed(1)}`,
      brush: { preset: 'gouache', seed: 600 + i },
    })
  }
  // 8 churning pool rapids at cataract foot
  for (let i = 0; i < 8; i++) {
    const py = 470 + rand() * 25
    const px = 425 + rand() * 40
    const pw = 30 + rand() * 35
    batch5.push({
      id: nextId('cataract-foam'),
      type: 'path',
      layer: 10,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: i % 2 === 0 ? '#faf6ee' : '#d2c8b7',
      strokeWidth: 3 + rand() * 3,
      opacity: 0.6 + rand() * 0.28,
      d: `M ${px.toFixed(1)} ${py.toFixed(1)} Q ${(px + pw * 0.5).toFixed(1)} ${(py + (rand() - 0.5) * 4).toFixed(1)} ${(px + pw).toFixed(1)} ${py.toFixed(1)}`,
      brush: { preset: 'gouache', seed: 630 + i },
    })
  }
  // 12 water surface ripple currents flowing from the pool
  for (let i = 0; i < 12; i++) {
    const rx = 360 + rand() * 180
    const ry = 490 + rand() * 55
    const rw = 40 + rand() * 60
    batch5.push({
      id: nextId('rapids-ripple'),
      type: 'path',
      layer: 11,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#5a6b72',
      strokeWidth: 1.6 + rand() * 1.2,
      opacity: 0.35 + rand() * 0.2,
      d: `M ${rx.toFixed(1)} ${ry.toFixed(1)} Q ${(rx + rw * 0.5).toFixed(1)} ${(ry + (rand() - 0.5) * 4).toFixed(1)} ${(rx + rw).toFixed(1)} ${ry.toFixed(1)}`,
      brush: { preset: 'ink', seed: 650 + i },
    })
  }

  // =============================================================
  // BATCH 6: Swirling Valley Mist & Cloud Belts (42 marks)
  // =============================================================
  const batch6: Mark[] = []
  const mistCols = ['#f7f2e8', '#ede5d8', '#f5eee1']
  // Mid-valley cloud belt drifting across crag waists (y: 280..380) (22 marks)
  for (let i = 0; i < 22; i++) {
    const mx = (rand() - 0.1) * 750
    const my = 285 + rand() * 85
    const mw = 180 + rand() * 190
    const wave = (rand() - 0.5) * 14
    batch6.push({
      id: nextId('valley-mist'),
      type: 'path',
      layer: 12,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: mistCols[i % mistCols.length]!,
      strokeWidth: 20 + rand() * 16,
      opacity: 0.45 + rand() * 0.3,
      d: curvedStroke(mx, my, mx + mw * 0.45, my + wave, mx + mw, my + (rand() - 0.5) * 8, 8, rand),
      brush: { preset: 'gouache', seed: 700 + i },
    })
  }
  // Lower gorge vapor rising above the river (y: 450..530) (20 marks)
  for (let i = 0; i < 20; i++) {
    const mx = 50 + rand() * 800
    const my = 455 + rand() * 65
    const mw = 180 + rand() * 200
    const wave = (rand() - 0.5) * 16
    batch6.push({
      id: nextId('gorge-vapor'),
      type: 'path',
      layer: 12,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: mistCols[i % mistCols.length]!,
      strokeWidth: 22 + rand() * 18,
      opacity: 0.5 + rand() * 0.3,
      d: curvedStroke(mx, my, mx + mw * 0.5, my + wave, mx + mw, my + (rand() - 0.5) * 10, 8, rand),
      brush: { preset: 'gouache', seed: 730 + i },
    })
  }

  // =============================================================
  // BATCH 7: Foreground Rocky Bluff & Shore Strata (48 marks)
  // =============================================================
  // Solid underpainting masses for bluff and left shore + 22 strata on right + 14 strata on left + 10 contours = 48 marks
  const batch7: Mark[] = []
  batch7.push(
    {
      id: nextId('fore-bluff-mass'),
      type: 'path',
      layer: 13,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: '#24211b', stroke: 'none', strokeWidth: 0, opacity: 0.95,
      d: 'M 540 700 L 550 560 C 570 510 630 495 700 500 C 760 505 800 465 850 470 L 930 500 L 1000 520 L 1000 700 Z',
      brush: { preset: 'ink', seed: 801 },
    },
    {
      id: nextId('fore-left-shore-mass'),
      type: 'path',
      layer: 13,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: '#2a261f', stroke: 'none', strokeWidth: 0, opacity: 0.92,
      d: 'M 0 630 C 130 620 250 635 340 670 L 360 700 L 0 700 Z',
      brush: { preset: 'ink', seed: 802 },
    },
  )
  const fgRockTones = ['#25221c', '#312c24', '#1a1813', '#3d362d', '#28231c']
  for (let b = 0; b < 22; b++) {
    const rx = 560 + rand() * 390
    const ry = 485 + rand() * 190
    const len = 30 + rand() * 55
    const ang = 0.3 + rand() * 0.6
    const ex = rx + Math.cos(ang) * len
    const ey = ry + Math.sin(ang) * len * 0.6
    batch7.push({
      id: nextId('fg-right-bluff-strata'),
      type: 'path',
      layer: 14,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: fgRockTones[b % fgRockTones.length]!,
      strokeWidth: 10 + rand() * 8,
      opacity: 0.88 + rand() * 0.1,
      d: `M ${rx.toFixed(1)} ${ry.toFixed(1)} Q ${(rx + ex) * 0.5} ${(ry + ey) * 0.5 + (rand() - 0.5) * 5} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      brush: { preset: 'ink', seed: 810 + b },
    })
  }
  for (let b = 0; b < 14; b++) {
    const rx = 20 + rand() * 310
    const ry = 635 + rand() * 55
    const len = 25 + rand() * 45
    const ang = 0.2 + rand() * 0.5
    const ex = rx + Math.cos(ang) * len
    const ey = ry + Math.sin(ang) * len * 0.5
    batch7.push({
      id: nextId('fg-left-shore-strata'),
      type: 'path',
      layer: 14,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: fgRockTones[(b + 2) % fgRockTones.length]!,
      strokeWidth: 10 + rand() * 8,
      opacity: 0.88 + rand() * 0.1,
      d: `M ${rx.toFixed(1)} ${ry.toFixed(1)} Q ${(rx + ex) * 0.5} ${(ry + ey) * 0.5 + (rand() - 0.5) * 4} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      brush: { preset: 'ink', seed: 840 + b },
    })
  }
  // 10 rock contour lines defining the rugged bluff
  const fgContours = [
    'M 540 700 L 550 560 L 595 520',
    'M 595 520 L 655 535 L 700 490',
    'M 700 490 L 755 480 L 800 455 L 850 460',
    'M 850 460 L 930 490 L 1000 515',
    'M 600 580 L 650 630',
    'M 680 550 L 740 600',
    'M 760 520 L 820 570',
    'M 0 635 C 130 625 250 640 340 675 L 360 700',
    'M 120 650 L 180 690',
    'M 200 640 L 260 680',
  ]
  fgContours.forEach((d) => {
    batch7.push({
      id: nextId('fg-bluff-contour'),
      type: 'path',
      layer: 15,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#12100e', strokeWidth: 3.0 + rand() * 1.5,
      opacity: 0.96,
      d,
      brush: { preset: 'ink', seed: 870 + markCounter },
    })
  })

  // =============================================================
  // BATCH 8: Foreground Axe-Cuts & Moss Dotting (苔点) (48 marks)
  // =============================================================
  const batch8: Mark[] = []
  // 20 sharp chisel axe-cut marks defining boulder facets
  for (let i = 0; i < 20; i++) {
    const isRight = i < 14
    const bx = isRight ? 570 + rand() * 380 : 40 + rand() * 280
    const by = isRight ? 490 + rand() * 180 : 635 + rand() * 55
    const len = 14 + rand() * 16
    const ang = 0.3 + rand() * 0.7
    const x1 = bx + Math.cos(ang) * len
    const y1 = by + Math.sin(ang) * len
    const x2 = x1 + 5 + rand() * 6
    const y2 = y1 + 3 + rand() * 5
    batch8.push({
      id: nextId('fg-rock-cun'),
      type: 'path',
      layer: 16,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: ['#0d0c0a', '#171512', '#070605'][i % 3]!,
      strokeWidth: 2.0 + rand() * 2.2,
      opacity: 0.94,
      d: `M ${bx.toFixed(1)} ${by.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      brush: { preset: 'ink', seed: 900 + i },
    })
  }
  // 28 dense rhythmic moss dots (苔点 Tai Dian) clustering on rock rims
  for (let i = 0; i < 28; i++) {
    const isRight = i < 20
    const mx = isRight ? 560 + rand() * 380 : 30 + rand() * 290
    const my = isRight ? 475 + rand() * 180 : 630 + rand() * 55
    const dw = 4 + rand() * 5
    const dh = 3 + rand() * 3
    const isMineral = i % 4 === 0
    batch8.push({
      id: nextId('fg-moss-dot'),
      type: 'path',
      layer: 17,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: isMineral ? '#274b3a' : ['#080706', '#14120f', '#0c0b09'][i % 3]!,
      strokeWidth: 2.4 + rand() * 2.4,
      opacity: 0.94,
      d: `M ${mx.toFixed(1)} ${my.toFixed(1)} Q ${(mx + dw * 0.5).toFixed(1)} ${(my - dh * 0.5).toFixed(1)} ${(mx + dw).toFixed(1)} ${(my + (rand() - 0.5) * 2).toFixed(1)}`,
      brush: { preset: isMineral ? 'gouache' : 'ink', seed: 930 + i },
    })
  }

  // =============================================================
  // BATCH 9: Ancient Gnarled Pine Trunk & Boughs (44 marks)
  // =============================================================
  const batch9: Mark[] = []
  // Pine roots grasping the crag (4 marks)
  const roots = [
    'M 720 520 L 680 495', 'M 680 495 L 650 515', 'M 680 495 L 670 540', 'M 700 510 L 730 535'
  ]
  roots.forEach((d) => {
    batch9.push({
      id: nextId('pine-root'),
      type: 'path',
      layer: 18,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#151411', strokeWidth: 5.5 + rand() * 1.5,
      opacity: 0.96,
      d,
      brush: { preset: 'ink', seed: 1000 + markCounter },
    })
  })
  // Trunk segments ascending with calligraphic twists (15 marks = 5 segments * 3 contoured strokes)
  const trunkCurves = [
    { x1: 680, y1: 495, cx: 640, cy: 460, x2: 590, y2: 445, w: 12 },
    { x1: 590, y1: 445, cx: 560, cy: 410, x2: 575, y2: 365, w: 9 },
    { x1: 575, y1: 365, cx: 610, cy: 330, x2: 655, y2: 305, w: 7 },
    { x1: 655, y1: 305, cx: 700, cy: 295, x2: 745, y2: 310, w: 5.5 },
    { x1: 590, y1: 445, cx: 520, cy: 440, x2: 450, y2: 460, w: 6.5 },
  ]
  trunkCurves.forEach((seg, sIdx) => {
    for (let p = 0; p < 3; p++) {
      const jx = (rand() - 0.5) * 3
      const jy = (rand() - 0.5) * 3
      batch9.push({
        id: nextId(`trunk-bark-${sIdx}-${p}`),
        type: 'path',
        layer: 19,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        fill: 'none', stroke: p === 0 ? '#0d0c0a' : p === 1 ? '#181613' : '#060605',
        strokeWidth: seg.w * (p === 0 ? 1 : 0.65),
        opacity: 0.95,
        d: `M ${(seg.x1 + jx).toFixed(1)} ${(seg.y1 + jy).toFixed(1)} Q ${(seg.cx + (rand() - 0.5) * 5).toFixed(1)} ${(seg.cy + (rand() - 0.5) * 5).toFixed(1)} ${(seg.x2 + jx).toFixed(1)} ${(seg.y2 + jy).toFixed(1)}`,
        brush: { preset: 'ink', seed: 1010 + sIdx * 5 + p },
      })
    }
  })
  // Branching boughs reaching out over the ravine (24 marks)
  const branches = [
    { x: 450, y: 460, a: 2.8, l: 65 }, { x: 450, y: 460, a: -0.8, l: 50 },
    { x: 390, y: 475, a: 2.6, l: 55 }, { x: 390, y: 475, a: 1.2, l: 45 },
    { x: 575, y: 365, a: 2.9, l: 60 }, { x: 575, y: 365, a: -1.2, l: 50 },
    { x: 515, y: 350, a: 2.7, l: 55 }, { x: 515, y: 350, a: 1.0, l: 45 },
  ]
  branches.forEach(br => {
    for (let b = 0; b < 3; b++) {
      const a = br.a + (rand() - 0.5) * 0.25
      const l = br.l * (0.8 + rand() * 0.3)
      const ex = br.x + Math.cos(a) * l
      const ey = br.y + Math.sin(a) * l
      const cx = br.x + Math.cos(a + 0.3) * l * 0.5
      const cy = br.y + Math.sin(a + 0.3) * l * 0.5
      batch9.push({
        id: nextId('pine-branch'),
        type: 'path',
        layer: 20,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        fill: 'none', stroke: ['#0b0a08', '#151310', '#060604'][b % 3]!,
        strokeWidth: 1.8 + rand() * 2.2,
        opacity: 0.96,
        d: `M ${br.x.toFixed(1)} ${br.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
        brush: { preset: 'ink', seed: 1040 + markCounter },
      })
    }
  })
  // 1 extra crown branch
  batch9.push({
    id: nextId('pine-crown-branch'),
    type: 'path',
    layer: 20,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    fill: 'none', stroke: '#0e0c0a', strokeWidth: 2.5, opacity: 0.96,
    d: 'M 745 310 Q 770 315 790 325',
    brush: { preset: 'ink', seed: 1070 },
  })

  // =============================================================
  // BATCH 10: Radiant Pine Needle Fans & Malachite Glaze (48 marks)
  // =============================================================
  const batch10: Mark[] = []
  const needleClusters = [
    { cx: 340, cy: 500, w: 46, h: 24 }, { cx: 390, cy: 475, w: 50, h: 26 }, { cx: 450, cy: 455, w: 54, h: 28 },
    { cx: 510, cy: 440, w: 56, h: 28 }, { cx: 460, cy: 365, w: 52, h: 26 }, { cx: 515, cy: 350, w: 56, h: 28 },
    { cx: 565, cy: 335, w: 60, h: 30 }, { cx: 615, cy: 310, w: 62, h: 32 }, { cx: 665, cy: 295, w: 62, h: 32 },
    { cx: 720, cy: 305, w: 58, h: 30 }, { cx: 765, cy: 320, w: 52, h: 26 }, { cx: 795, cy: 330, w: 45, h: 22 },
  ]
  // 12 Malachite mineral wash pads under the needle clusters (gouache)
  needleClusters.forEach(cl => {
    batch10.push({
      id: nextId('pine-malachite-wash'),
      type: 'path',
      layer: 21,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: '#26583d',
      strokeWidth: 7 + rand() * 6,
      opacity: 0.7 + rand() * 0.18,
      d: `M ${(cl.cx - cl.w * 0.4).toFixed(1)} ${cl.cy.toFixed(1)} Q ${cl.cx.toFixed(1)} ${(cl.cy - cl.h * 0.35).toFixed(1)} ${(cl.cx + cl.w * 0.4).toFixed(1)} ${cl.cy.toFixed(1)} Q ${cl.cx.toFixed(1)} ${(cl.cy + cl.h * 0.35).toFixed(1)} ${(cl.cx - cl.w * 0.4).toFixed(1)} ${cl.cy.toFixed(1)}`,
      brush: { preset: 'gouache', seed: 1100 + markCounter },
    })
  })
  // 36 radiant needle fan rosettes (3 per cluster)
  needleClusters.forEach(cl => {
    for (let f = 0; f < 3; f++) {
      const radius = 16 + rand() * 8
      const baseA = rand() * Math.PI * 2
      const needles: string[] = []
      for (let n = 0; n < 5; n++) {
        const ang = baseA + (n - 2) * 0.28
        const nx = cl.cx + Math.cos(ang) * radius
        const ny = cl.cy + Math.sin(ang) * radius
        needles.push(`M ${cl.cx.toFixed(1)} ${cl.cy.toFixed(1)} L ${nx.toFixed(1)} ${ny.toFixed(1)}`)
      }
      batch10.push({
        id: nextId('needle-fan'),
        type: 'path',
        layer: 22,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        fill: 'none', stroke: f === 0 ? '#090807' : f === 1 ? '#13110e' : '#050403',
        strokeWidth: 1.2 + rand() * 0.6,
        opacity: 0.94,
        d: needles.join(' '),
        brush: { preset: 'ink', seed: 1150 + markCounter },
      })
    }
  })

  // =============================================================
  // BATCH 11: Pavilion, Wild Geese & Vermilion Seal (44 marks)
  // =============================================================
  // Pavilion nestled on the cliff ledge at (875, 450)
  const batch11: Mark[] = []
  // Pavilion roof
  batch11.push(
    {
      id: nextId('pavilion-roof-mass'),
      type: 'path',
      layer: 25,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 830 455 C 845 450 865 437 875 430 C 885 437 905 450 920 455 L 910 460 C 895 457 875 455 875 455 C 875 455 855 457 840 460 Z',
      fill: '#1c1b18', stroke: '#151412', strokeWidth: 1.5, opacity: 0.96,
      brush: { preset: 'ink', seed: 1201 },
    },
    // Vermilion lacquer accent under eave
    {
      id: nextId('pavilion-roof-vermilion'),
      type: 'path',
      layer: 25,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 845 458 L 905 458',
      fill: 'none', stroke: '#b83324', strokeWidth: 2.2, opacity: 0.95,
      brush: { preset: 'gouache', seed: 1202 },
    },
    // Pillars and floor
    {
      id: nextId('pavilion-pillar-1'),
      type: 'line',
      layer: 25,
      x: 855, y: 457, x2: 855, y2: 477,
      stroke: '#151412', strokeWidth: 2, opacity: 0.95,
      fill: 'none', width: 0, height: 0, d: '', text: '', fontSize: 24,
      brush: { preset: 'ink', seed: 1203 },
    },
    {
      id: nextId('pavilion-pillar-2'),
      type: 'line',
      layer: 25,
      x: 895, y: 457, x2: 895, y2: 477,
      stroke: '#151412', strokeWidth: 2, opacity: 0.95,
      fill: 'none', width: 0, height: 0, d: '', text: '', fontSize: 24,
      brush: { preset: 'ink', seed: 1204 },
    },
    {
      id: nextId('pavilion-floor'),
      type: 'line',
      layer: 25,
      x: 845, y: 477, x2: 905, y2: 477,
      stroke: '#151412', strokeWidth: 2.5, opacity: 0.95,
      fill: 'none', width: 0, height: 0, d: '', text: '', fontSize: 24,
      brush: { preset: 'ink', seed: 1205 },
    },
    // Scholar in robe standing inside pavilion
    {
      id: nextId('scholar-robe'),
      type: 'path',
      layer: 26,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 875 464 L 875 476',
      fill: 'none', stroke: '#171411', strokeWidth: 3.2, opacity: 0.96,
      brush: { preset: 'ink', seed: 1206 },
    },
    {
      id: nextId('scholar-head'),
      type: 'path',
      layer: 26,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 875 460 L 875 462',
      fill: 'none', stroke: '#0b0a08', strokeWidth: 2.6, opacity: 0.98,
      brush: { preset: 'ink', seed: 1207 },
    },
  )
  // Flock of 5 wild geese flying across the sky (5 marks)
  const geese = [
    { x: 190, y: 140 }, { x: 215, y: 132 }, { x: 235, y: 142 }, { x: 255, y: 135 }, { x: 275, y: 146 }
  ]
  geese.forEach((g) => {
    batch11.push({
      id: nextId('wild-goose'),
      type: 'path',
      layer: 27,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: `M ${g.x - 7} ${g.y + 2} Q ${g.x - 3} ${g.y - 4} ${g.x} ${g.y} Q ${g.x + 3} ${g.y - 4} ${g.x + 7} ${g.y + 2}`,
      fill: 'none', stroke: '#2e2c26', strokeWidth: 1.6, opacity: 0.85,
      brush: { preset: 'ink', seed: 1210 + markCounter },
    })
  })
  // River wave ripples across foreground water (28 marks)
  const waveCols = ['#5a6b72', '#6b7b82', '#4b5b62', '#7e8e94']
  for (let i = 0; i < 28; i++) {
    const rx = 100 + rand() * 450
    const ry = 530 + rand() * 140
    const rw = 40 + rand() * 70
    const wave = (rand() - 0.5) * 5
    batch11.push({
      id: nextId('river-wave'),
      type: 'path',
      layer: 14,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      fill: 'none', stroke: waveCols[i % waveCols.length]!,
      strokeWidth: 1.5 + rand() * 1.4,
      opacity: 0.3 + rand() * 0.25,
      d: `M ${rx.toFixed(1)} ${ry.toFixed(1)} Q ${(rx + rw * 0.33).toFixed(1)} ${(ry + wave).toFixed(1)} ${(rx + rw * 0.66).toFixed(1)} ${(ry - wave).toFixed(1)} T ${(rx + rw).toFixed(1)} ${(ry + (rand() - 0.5) * 2).toFixed(1)}`,
      brush: { preset: 'ink', seed: 1220 + i },
    })
  }
  // Vermilion red artist seal in upper right corner (4 marks)
  batch11.push(
    {
      id: nextId('seal-border'),
      type: 'rect',
      layer: 30,
      x: 885, y: 55, width: 55, height: 55,
      fill: '#b82323', stroke: '#851212', strokeWidth: 1.8, opacity: 0.95,
      brush: { preset: 'gouache', seed: 33150 },
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    },
    {
      id: nextId('seal-text-top'),
      type: 'text',
      layer: 31,
      x: 893, y: 80,
      text: '松濤',
      fontSize: 18,
      fill: '#fcfaf2',
      stroke: 'none', strokeWidth: 0, opacity: 0.96,
      width: 0, height: 0, x2: 0, y2: 0, d: '',
    },
    {
      id: nextId('seal-text-bot'),
      type: 'text',
      layer: 31,
      x: 893, y: 102,
      text: '山水',
      fontSize: 18,
      fill: '#fcfaf2',
      stroke: 'none', strokeWidth: 0, opacity: 0.96,
      width: 0, height: 0, x2: 0, y2: 0, d: '',
    },
    {
      id: nextId('seal-accent-dot'),
      type: 'ellipse',
      layer: 31,
      x: 935, y: 120, width: 14, height: 16,
      fill: '#ad281b', stroke: 'none', strokeWidth: 0, opacity: 0.94,
      brush: { preset: 'gouache', seed: 33151 },
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    },
  )

  const batches = [
    { label: 'Aged silk ground and distant mountain ridges', marks: batch1 },
    { label: 'Left towering karst crag mass and facets', marks: batch2 },
    { label: 'Central karst monolith mass and cleavage', marks: batch3 },
    { label: 'Right karst mass and canyon shadow cleft', marks: batch4 },
    { label: 'Cascading cataract, chasm rapids and foam', marks: batch5 },
    { label: 'Swirling valley mist and cloud belts', marks: batch6 },
    { label: 'Foreground rocky bluff and shore strata', marks: batch7 },
    { label: 'Foreground axe-cuts and moss dotting (苔点)', marks: batch8 },
    { label: 'Ancient gnarled pine trunk and boughs', marks: batch9 },
    { label: 'Radiant pine needle fans and malachite glaze', marks: batch10 },
    { label: 'Pavilion, wild geese and vermilion seal', marks: batch11 },
  ]

  const piece: Piece = {
    slug: 'shan-shui',
    title: 'Misty Peaks and Gnarled Mountain Pine',
    brief: 'A classical Chinese ink-wash shan shui landscape featuring towering jagged karst crags, a cascading waterfall, a scholar pavilion, an ancient twisted pine, and a vermilion seal.',
    style: 'Traditional Chinese Shan Shui ink-and-wash painting (山水画). Five ink tones (五墨), expansive misty negative space (留白), axe-cut rock fractures (斧劈皴), calligraphic pine needle fans, moss dotting (苔点), and a carved vermilion seal mark.',
    batches,
  }

  return piece
}

function main() {
  const piece = createMasterShanShui()
  const stats = validatePiece(piece)
  console.log(`Validated ${piece.slug}: ${stats.totalMarks} marks in ${stats.batchCount} batches.`)

  const jsonPath = path.resolve(import.meta.dirname, '../src/studio/examples/shan-shui.json')
  fs.writeFileSync(jsonPath, JSON.stringify(piece, null, 2))
  console.log(`Saved JSON to: ${jsonPath}`)

  const rendersDir = path.resolve(import.meta.dirname, '../renders')
  if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true })
  const outPng = path.join(rendersDir, 'shan-shui.png')
  renderPiece(piece, outPng)
  console.log(`Rendered PNG to: ${outPng}`)
}

if (process.argv[1]?.endsWith('generate-shanshui-master.ts')) {
  main()
}
