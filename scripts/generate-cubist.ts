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

// Generate an individual curved brushstroke with organic inflection
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

// Create stroke from center, length, angle, and curvature
function angledStroke(
  cx: number,
  cy: number,
  length: number,
  angleDeg: number,
  curvature: number,
  rand: () => number,
): string {
  const rad = (angleDeg * Math.PI) / 180
  const dx = (Math.cos(rad) * length) / 2
  const dy = (Math.sin(rad) * length) / 2
  return curvedStroke(cx - dx, cy - dy, cx + dx, cy + dy, curvature, rand)
}

export function createCubistGuitar(): Piece {
  const rand = makeRandom(19121124) // Juan Gris & Picasso cubist era seed
  let markIndex = 1
  const nextId = (prefix: string) => `cg-${prefix}-${markIndex++}`

  function randRange(min: number, max: number) {
    return min + rand() * (max - min)
  }

  function randChoice<T>(arr: T[]): T {
    return arr[Math.floor(rand() * arr.length)]
  }

  function makeMark(
    prefix: string,
    d: string,
    stroke: string,
    strokeWidth: number,
    opacity: number,
    preset: 'oil' | 'gouache' | 'charcoal' | 'pastel' | 'ink',
    layer: number = 10,
  ): Mark {
    return {
      id: nextId(prefix),
      type: 'path',
      layer,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      x2: 0,
      y2: 0,
      text: '',
      fontSize: 24,
      d,
      fill: 'none',
      stroke,
      strokeWidth: Math.round(strokeWidth),
      opacity: Math.round(opacity * 100) / 100,
      brush: { preset, seed: Math.floor(rand() * 100000) },
    }
  }

  function makeFilledFacet(
    prefix: string,
    d: string,
    fill: string,
    opacity: number,
    preset: 'oil' | 'gouache' | 'pastel',
    layer: number = 5,
  ): Mark {
    return {
      id: nextId(prefix),
      type: 'path',
      layer,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      x2: 0,
      y2: 0,
      text: '',
      fontSize: 24,
      d,
      fill,
      stroke: 'none',
      strokeWidth: 0,
      opacity: Math.round(opacity * 100) / 100,
      brush: { preset, seed: Math.floor(rand() * 100000) },
    }
  }

  // =========================================================================
  // BATCH 1: Toned Imprimatura & Scumbled Grey-Ochre Field (33 marks)
  // Warm linen imprimatura base rect plus multi-directional soft scumbles
  // forming an authentic, non-tiled, broken grey-ochre field.
  // =========================================================================
  const batch1: Mark[] = []

  // 1. Warm toned imprimatura canvas base
  batch1.push({
    id: nextId('imprimatura-base'),
    type: 'rect',
    layer: 1,
    x: 0,
    y: 0,
    width: 1000,
    height: 700,
    fill: '#e8e1d2',
    stroke: 'none',
    strokeWidth: 0,
    opacity: 0.99,
    x2: 0,
    y2: 0,
    d: '',
    text: '',
    fontSize: 24,
    brush: { preset: 'gouache', seed: 42 },
  })

  // 2. Soft, multi-directional scumble washes (32 marks)
  const scumblePalette = [
    '#dcd4c3', '#d0c8b6', '#c4bca8', '#e2dac9',
    '#beb6a1', '#b5ac96', '#ded6c4', '#aba28c',
  ]
  for (let i = 0; i < 32; i++) {
    const cx = 50 + rand() * 900
    const cy = 40 + rand() * 620
    const len = randRange(180, 290)
    const ang = randChoice([28, -35, 60, -22, 45, -50, 15]) + randRange(-8, 8)
    const w = randRange(45, 75)
    const col = randChoice(scumblePalette)
    const op = randRange(0.42, 0.68)
    const d = angledStroke(cx, cy, len, ang, randRange(-8, 8), rand)
    batch1.push(makeMark('ground-wash', d, col, w, op, i % 2 === 0 ? 'gouache' : 'pastel', 2))
  }

  // =========================================================================
  // BATCH 2: Architectural Space Facets - Top-Right & Flanks (26 marks)
  // Broad geometric planes framing the pyramid: top-right architectural
  // shadow facet filling the top-right void, and top-left architectural facet.
  // =========================================================================
  const batch2: Mark[] = []
  // Top-right architectural shadow facet (completely fills top-right void!)
  batch2.push(makeFilledFacet('space-tr-base', 'M 580 80 L 920 70 L 870 380 L 660 340 Z', '#a89c85', 0.94, 'gouache', 3))
  // Soft, multi-directional painterly blending sweeps (8 marks)
  const trSpaceColors = ['#b8ac95', '#968a73', '#c2b69f', '#8c8069', '#a0947d']
  const trSites = [
    { x: 740, y: 130, ang: -30, len: 140 },
    { x: 840, y: 150, ang: 45, len: 120 },
    { x: 710, y: 220, ang: 15, len: 130 },
    { x: 800, y: 240, ang: -55, len: 140 },
    { x: 860, y: 280, ang: 20, len: 130 },
    { x: 760, y: 310, ang: -25, len: 120 },
    { x: 680, y: 170, ang: 60, len: 110 },
    { x: 830, y: 340, ang: -40, len: 125 },
  ]
  for (const ts of trSites) {
    const d = angledStroke(ts.x, ts.y, ts.len, ts.ang, randRange(-4, 4), rand)
    batch2.push(makeMark('space-tr-stroke', d, randChoice(trSpaceColors), randRange(28, 42), randRange(0.65, 0.85), 'oil', 4))
  }

  // Top-left architectural space plane (frames the pyramid shoulder)
  batch2.push(makeFilledFacet('space-tl-base', 'M 430 90 L 80 80 L 170 360 L 350 330 Z', '#c0b7a4', 0.94, 'gouache', 3))
  const tlSpaceColors = ['#b2a995', '#ccc4b2', '#9f9581', '#a89e8b', '#8f8674']
  const tlSites = [
    { x: 260, y: 130, ang: 35, len: 140 },
    { x: 160, y: 150, ang: -40, len: 120 },
    { x: 290, y: 220, ang: -15, len: 130 },
    { x: 200, y: 240, ang: 50, len: 140 },
    { x: 140, y: 280, ang: -20, len: 130 },
    { x: 240, y: 310, ang: 25, len: 120 },
    { x: 320, y: 170, ang: -55, len: 110 },
    { x: 170, y: 340, ang: 40, len: 125 },
  ]
  for (const ts of tlSites) {
    const d = angledStroke(ts.x, ts.y, ts.len, ts.ang, randRange(-4, 4), rand)
    batch2.push(makeMark('space-tl-stroke', d, randChoice(tlSpaceColors), randRange(28, 42), randRange(0.65, 0.85), 'oil', 4))
  }

  // Lower table shadow apron / wall grounding behind guéridon pedestal (8 marks)
  batch2.push(makeFilledFacet('space-apron-base', 'M 220 570 L 780 570 L 680 680 L 320 680 Z', '#584e40', 0.94, 'oil', 4))
  const apronWallColors = ['#4a4033', '#665c4c', '#5a5040', '#3e362a']
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const x = 300 + t * 400 + randRange(-10, 10)
    const y = 605 + Math.sin(t * Math.PI) * 20 + randRange(-4, 4)
    const d = angledStroke(x, y, randRange(90, 130), (t - 0.5) * 20, randRange(-3, 3), rand)
    batch2.push(makeMark('space-apron-stroke', d, randChoice(apronWallColors), randRange(26, 38), 0.85, 'oil', 5))
  }

  // =========================================================================
  // BATCH 3: Guéridon Table & Sturdy Pedestal Base (44 marks)
  // Expansive round guéridon tabletop spanning x=130..870, y=470..610. Deep burnt
  // umber left wing, golden ochre right wing, apron bevel, and architectural tripod pedestal.
  // =========================================================================
  const batch3: Mark[] = []
  const umberTableColors = ['#2c1f14', '#3d2b1c', '#4a3623', '#5c432d', '#6e5239']
  const ochreTableColors = ['#a06f36', '#b8813f', '#cb9249', '#8a5c28', '#d69f54', '#c4893a']

  // 1. Left table wing underpainting polygon:
  batch3.push(makeFilledFacet('table-umber-base', 'M 130 510 L 460 535 L 440 610 L 220 595 Z', '#352416', 0.96, 'oil', 6))
  // Multi-directional layered oil strokes over left wing (15 marks)
  const leftTableSites = [
    { x: 220, y: 535, ang: -25, len: 140 },
    { x: 300, y: 520, ang: -15, len: 130 },
    { x: 380, y: 525, ang: -35, len: 125 },
    { x: 190, y: 550, ang: -10, len: 120 },
    { x: 270, y: 555, ang: -30, len: 145 },
    { x: 360, y: 550, ang: -20, len: 135 },
    { x: 420, y: 545, ang: -40, len: 110 },
    { x: 240, y: 575, ang: 5, len: 130 },
    { x: 320, y: 575, ang: -22, len: 140 },
    { x: 400, y: 570, ang: -15, len: 125 },
    { x: 170, y: 530, ang: -28, len: 110 },
    { x: 290, y: 540, ang: 12, len: 105 },
    { x: 350, y: 585, ang: -8, len: 120 },
    { x: 260, y: 585, ang: -26, len: 115 },
    { x: 420, y: 580, ang: -32, len: 100 },
  ]
  for (const lts of leftTableSites) {
    const d = angledStroke(lts.x, lts.y, lts.len, lts.ang + randRange(-5, 5), randRange(-3, 3), rand)
    batch3.push(makeMark('table-umber-stroke', d, randChoice(umberTableColors), randRange(24, 32), randRange(0.9, 0.98), 'oil', 7))
  }

  // 2. Right table wing underpainting polygon:
  batch3.push(makeFilledFacet('table-ochre-base', 'M 460 535 L 870 510 L 780 595 L 440 610 Z', '#ba8341', 0.96, 'oil', 6))
  // Multi-directional layered oil strokes over right wing (15 marks)
  const rightTableSites = [
    { x: 770, y: 535, ang: 25, len: 140 },
    { x: 690, y: 520, ang: 15, len: 130 },
    { x: 610, y: 525, ang: 35, len: 125 },
    { x: 800, y: 550, ang: 10, len: 120 },
    { x: 720, y: 555, ang: 30, len: 145 },
    { x: 630, y: 550, ang: 20, len: 135 },
    { x: 570, y: 545, ang: 40, len: 110 },
    { x: 750, y: 575, ang: -5, len: 130 },
    { x: 670, y: 575, ang: 22, len: 140 },
    { x: 590, y: 570, len: 125, ang: 15 },
    { x: 820, y: 530, ang: 28, len: 110 },
    { x: 700, y: 540, ang: -12, len: 105 },
    { x: 640, y: 585, ang: 8, len: 120 },
    { x: 730, y: 585, ang: 26, len: 115 },
    { x: 570, y: 580, ang: 32, len: 100 },
  ]
  for (const rts of rightTableSites) {
    const d = angledStroke(rts.x, rts.y, rts.len, rts.ang + randRange(-5, 5), randRange(-3, 3), rand)
    batch3.push(makeMark('table-ochre-stroke', d, randChoice(ochreTableColors), randRange(24, 32), randRange(0.9, 0.98), 'oil', 7))
  }

  // 3. Seam passage between umber and ochre wings (6 marks)
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const px = 435 + t * 85 + randRange(-5, 5)
    const py = 530 + t * 25 + randRange(-5, 5)
    const col = t < 0.4 ? randChoice(umberTableColors) : t > 0.6 ? randChoice(ochreTableColors) : randChoice([...umberTableColors, ...ochreTableColors])
    const d = angledStroke(px, py, randRange(75, 110), 8 + randRange(-8, 8), randRange(-3, 3), rand)
    batch3.push(makeMark('table-seam', d, col, 24, 0.92, 'oil', 8))
  }

  // 4. Front table curved apron edge (3 marks)
  const apronColors = ['#1f160e', '#362416', '#4e341f']
  for (let i = 0; i < 3; i++) {
    const t = i / 2
    const px = 250 + t * 500
    const py = 598 + Math.sin(t * Math.PI) * 18
    const d = angledStroke(px, py, 140, 2 + randRange(-4, 4), 5, rand)
    batch3.push(makeMark('table-apron', d, randChoice(apronColors), 26, 0.96, 'oil', 8))
  }

  // 5. Sturdy Pedestal Column & Tripod Footing (4 marks, anchoring down to y=685)
  batch3.push(makeMark('pedestal-shaft', curvedStroke(495, 600, 495, 685, 0, rand), '#15100b', 28, 0.98, 'oil', 9))
  batch3.push(makeMark('pedestal-foot-l', curvedStroke(485, 650, 430, 685, 4, rand), '#18120c', 24, 0.98, 'oil', 9))
  batch3.push(makeMark('pedestal-foot-r', curvedStroke(515, 650, 570, 685, -4, rand), '#241a12', 24, 0.98, 'oil', 9))
  batch3.push(makeMark('pedestal-base', curvedStroke(415, 685, 585, 685, 0, rand), '#0f0a06', 22, 0.98, 'oil', 9))

  // =========================================================================
  // BATCH 4: Collage Grounds - Faux-bois Wallpaper, Newsprint & Music Paper (40 marks)
  // Solid opaque paper grounds layered with textured paper strokes.
  // =========================================================================
  const batch4: Mark[] = []
  // 1. Blue/slate wallpaper panel behind the guitar neck
  batch4.push(makeFilledFacet('wallpaper-base', 'M 350 180 L 430 190 L 415 345 L 340 335 Z', '#3d5065', 0.96, 'gouache', 8))
  const bluePalette = ['#384858', '#45596e', '#566e85', '#2a3744', '#647e96', '#4a6078']
  for (let i = 0; i < 12; i++) {
    const t = i / 11
    const y = 195 + t * 140
    const x = 385 + randRange(-8, 8)
    const d = angledStroke(x, y, randRange(65, 85), 78 + randRange(-8, 8), randRange(-3, 3), rand)
    batch4.push(makeMark('wallpaper-stroke', d, randChoice(bluePalette), 20, randRange(0.88, 0.96), 'gouache', 9))
  }

  // 2. Antique newsprint collage paper facet
  batch4.push(makeFilledFacet('newsprint-base', 'M 606 175 L 724 170 L 716 325 L 606 320 Z', '#f5efe0', 0.98, 'gouache', 8))
  const newsprintPalette = ['#ede5cc', '#ded5bd', '#fff9ed', '#f0e8d5']
  for (let i = 0; i < 12; i++) {
    const t = i / 11
    const y = 195 + t * 120
    const x = 660 + randRange(-8, 8)
    const d = angledStroke(x, y, randRange(85, 110), -10 + randRange(-6, 6), randRange(-3, 3), rand)
    batch4.push(makeMark('newsprint-stroke', d, randChoice(newsprintPalette), 20, randRange(0.88, 0.96), 'gouache', 9))
  }

  // 3. Aged sheet music collage paper facet
  batch4.push(makeFilledFacet('music-base', 'M 246 375 L 360 355 L 374 515 L 260 535 Z', '#ede6d4', 0.98, 'gouache', 8))
  const musicPaperPalette = ['#e2d9c2', '#f6f0e2', '#d5ccb4', '#ebe4d0']
  for (let i = 0; i < 13; i++) {
    const t = i / 12
    const y = 390 + t * 125
    const x = 308 + randRange(-8, 8)
    const d = angledStroke(x, y, randRange(85, 110), 16 + randRange(-6, 6), randRange(-3, 3), rand)
    batch4.push(makeMark('music-stroke', d, randChoice(musicPaperPalette), 20, randRange(0.88, 0.96), 'gouache', 9))
  }

  // =========================================================================
  // BATCH 5: Guitar Soundboard & Voluptuous Side Bouts (46 marks)
  // Radiant golden ochre upper soundboard, terracotta right bout, and walnut
  // left bout, with Cézanne passage dissolving boundaries into adjoining planes.
  // =========================================================================
  const batch5: Mark[] = []
  // 1. Soundboard upper underpainting polygon
  batch5.push(makeFilledFacet('soundboard-base', 'M 445 210 L 555 215 L 565 365 L 435 365 Z', '#d99738', 0.96, 'oil', 10))

  const soundboardOchre = ['#d4983b', '#e2a94a', '#f0bb5d', '#be8129', '#e8b252', '#c98a2e', '#e0a444']

  // Multi-directional soundboard facet strokes (16 marks: varied angles 45°, 25°, 65°, -30°)
  const soundboardSites = [
    { x: 470, y: 235, ang: 42, len: 80, w: 22 },
    { x: 530, y: 235, ang: 25, len: 75, w: 20 },
    { x: 495, y: 260, ang: 58, len: 85, w: 24 },
    { x: 465, y: 280, ang: -25, len: 70, w: 18 },
    { x: 535, y: 280, ang: 35, len: 80, w: 22 },
    { x: 500, y: 300, ang: 48, len: 90, w: 24 },
    { x: 460, y: 320, ang: 65, len: 75, w: 20 },
    { x: 530, y: 320, ang: -15, len: 80, w: 22 },
    { x: 495, y: 340, ang: 38, len: 85, w: 22 },
    { x: 470, y: 355, ang: 20, len: 70, w: 18 },
    { x: 525, y: 355, ang: 50, len: 75, w: 20 },
    { x: 485, y: 250, ang: -35, len: 65, w: 18 },
    { x: 515, y: 265, ang: 15, len: 70, w: 20 },
    { x: 480, y: 295, ang: 45, len: 80, w: 22 },
    { x: 510, y: 325, ang: -28, len: 75, w: 20 },
    { x: 495, y: 360, ang: 30, len: 70, w: 18 },
  ]
  for (const ss of soundboardSites) {
    const d = angledStroke(ss.x, ss.y, ss.len, ss.ang + randRange(-5, 5), randRange(-3, 3), rand)
    batch5.push(makeMark('soundboard-stroke', d, randChoice(soundboardOchre), ss.w, randRange(0.88, 0.96), 'oil', 11))
  }

  // 2. Voluptuous right guitar bout facet (terracotta / raw sienna):
  batch5.push(makeFilledFacet('bout-right-base', 'M 555 225 C 610 270 615 340 575 375 L 560 480 L 540 365 Z', '#c46828', 0.96, 'oil', 10))
  const rightBoutColors = ['#b85e22', '#cb722e', '#a6501a', '#d67c38']
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const y = 250 + t * 150
    const x = 575 + Math.sin(t * Math.PI) * 15 + randRange(-5, 5)
    const d = angledStroke(x, y, randRange(45, 70), -35 + randRange(-6, 6), randRange(-2, 2), rand)
    batch5.push(makeMark('bout-right-stroke', d, randChoice(rightBoutColors), 20, 0.92, 'oil', 11))
  }

  // 3. Voluptuous left guitar bout facet (deep walnut / burnt umber):
  batch5.push(makeFilledFacet('bout-left-base', 'M 445 225 C 390 270 385 340 425 375 L 440 480 L 450 365 Z', '#3a2717', 0.96, 'oil', 10))
  const leftBoutColors = ['#2e1f13', '#46301d', '#543923', '#24180e']
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const y = 250 + t * 150
    const x = 415 - Math.sin(t * Math.PI) * 15 + randRange(-5, 5)
    const d = angledStroke(x, y, randRange(45, 70), 35 + randRange(-6, 6), randRange(-2, 2), rand)
    batch5.push(makeMark('bout-left-stroke', d, randChoice(leftBoutColors), 20, 0.92, 'oil', 11))
  }

  // Cézanne passage 1: Soundboard bleeding into newspaper panel on right (7 marks)
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const px = 545 + (620 - 545) * t + randRange(-4, 4)
    const py = 250 + (265 - 250) * t + randRange(-4, 4)
    const col = t < 0.4 ? randChoice(soundboardOchre) : t > 0.6 ? randChoice(newsprintPalette) : randChoice([...soundboardOchre, ...newsprintPalette])
    const d = angledStroke(px, py, randRange(65, 85), 8 + randRange(-6, 6), randRange(-3, 3), rand)
    batch5.push(makeMark('passage-sound-news', d, col, 18, 0.92, 'oil', 12))
  }

  // Cézanne passage 2: Soundboard bleeding into blue wallpaper on left (7 marks)
  for (let i = 0; i < 7; i++) {
    const t = i / 6
    const px = 415 + (465 - 415) * t + randRange(-4, 4)
    const py = 265 + (275 - 265) * t + randRange(-4, 4)
    const col = t < 0.4 ? randChoice(bluePalette) : t > 0.6 ? randChoice(soundboardOchre) : randChoice([...bluePalette, ...soundboardOchre])
    const d = angledStroke(px, py, randRange(65, 85), -22 + randRange(-6, 6), randRange(-3, 3), rand)
    batch5.push(makeMark('passage-blue-sound', d, col, 18, 0.92, 'oil', 12))
  }

  // =========================================================================
  // BATCH 6: Guitar Lower Bout & Deep Shadow Facets (40 marks)
  // Dark walnut, burnt umber, and black-brown planes providing volumetric depth.
  // =========================================================================
  const batch6: Mark[] = []
  // Lower dark bout underpainting polygon:
  batch6.push(makeFilledFacet('bout-dark-base', 'M 430 365 L 565 365 L 560 520 L 420 515 Z', '#22160d', 0.96, 'oil', 10))

  const shadowBoutPalette = ['#1d150e', '#2c1e13', '#3d2a1b', '#4e3724', '#150f0a']
  const warmShadowPalette = ['#5a3a1e', '#452b15', '#6b4524', '#7a4e28']

  // Lower dark bout strokes with varied angles (15 marks)
  const lowerBoutSites = [
    { x: 450, y: 400, ang: 75, len: 75 },
    { x: 500, y: 395, ang: -60, len: 70 },
    { x: 545, y: 405, ang: 65, len: 80 },
    { x: 440, y: 435, ang: 80, len: 80 },
    { x: 490, y: 430, ang: 45, len: 75 },
    { x: 535, y: 435, ang: -70, len: 70 },
    { x: 455, y: 465, ang: 70, len: 80 },
    { x: 495, y: 460, ang: -45, len: 75 },
    { x: 530, y: 465, ang: 75, len: 80 },
    { x: 445, y: 490, ang: 85, len: 75 },
    { x: 485, y: 485, ang: 60, len: 70 },
    { x: 525, y: 490, ang: -80, len: 75 },
    { x: 465, y: 510, ang: 75, len: 70 },
    { x: 505, y: 505, ang: 40, len: 65 },
    { x: 480, y: 415, ang: -30, len: 65 },
  ]
  for (const lbs of lowerBoutSites) {
    const d = angledStroke(lbs.x, lbs.y, lbs.len, lbs.ang + randRange(-5, 5), randRange(-3, 3), rand)
    batch6.push(makeMark('bout-dark-stroke', d, randChoice(shadowBoutPalette), 22, randRange(0.9, 0.98), 'oil', 11))
  }

  // Deep shadow wedge under right bout (12 marks, angle -38°)
  for (let i = 0; i < 12; i++) {
    const t = i / 11
    const y = 445 + t * 65
    const x = 580 + randRange(-6, 6)
    const d = angledStroke(x, y, randRange(65, 85), -38 + randRange(-6, 6), randRange(-3, 3), rand)
    batch6.push(makeMark('bout-shadow', d, randChoice(warmShadowPalette), 20, randRange(0.88, 0.96), 'oil', 11))
  }

  // Passage: Lower bout dissolving into left umber table wing (6 marks)
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const px = 410 + (450 - 410) * t + randRange(-4, 4)
    const py = 515 + (535 - 515) * t + randRange(-4, 4)
    const col = t < 0.4 ? randChoice(shadowBoutPalette) : randChoice(umberTableColors)
    const d = angledStroke(px, py, randRange(65, 85), 32 + randRange(-6, 6), randRange(-3, 3), rand)
    batch6.push(makeMark('passage-bout-table-l', d, col, 20, 0.92, 'oil', 12))
  }

  // Passage: Lower bout meeting right ochre table wing (6 marks)
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const px = 515 + (555 - 515) * t + randRange(-4, 4)
    const py = 525 + (535 - 525) * t + randRange(-4, 4)
    const col = t < 0.4 ? randChoice(shadowBoutPalette) : randChoice(ochreTableColors)
    const d = angledStroke(px, py, randRange(65, 85), -18 + randRange(-6, 6), randRange(-3, 3), rand)
    batch6.push(makeMark('passage-bout-table-r', d, col, 20, 0.92, 'oil', 12))
  }

  // =========================================================================
  // BATCH 7: Guitar Anatomy, Goblet Still Life & Fruit (42 marks)
  // Neck apex, tuning pegs, segmented strings, soundhole division,
  // faceted wine glass with ruby wine, and green fruit cluster.
  // =========================================================================
  const batch7: Mark[] = []
  // 1. Guitar neck at pyramid apex (4 marks)
  const neckPalette = ['#281e15', '#3d2e21', '#1f160e']
  for (let i = 0; i < 4; i++) {
    const nx = 478 + i * 7
    const d = curvedStroke(nx, 85, nx + 4, 215, 0, rand)
    batch7.push(makeMark('neck-fretboard', d, randChoice(neckPalette), 13, 0.96, 'oil', 13))
  }
  // Tuning pegs at apex (4 marks)
  batch7.push(makeMark('tuning-peg-tl', curvedStroke(450, 105, 474, 105, 0, rand), '#150f0a', 8, 0.96, 'oil', 13))
  batch7.push(makeMark('tuning-peg-bl', curvedStroke(450, 130, 476, 130, 0, rand), '#150f0a', 8, 0.96, 'oil', 13))
  batch7.push(makeMark('tuning-peg-tr', curvedStroke(506, 108, 530, 108, 0, rand), '#150f0a', 8, 0.96, 'oil', 13))
  batch7.push(makeMark('tuning-peg-br', curvedStroke(510, 132, 532, 132, 0, rand), '#150f0a', 8, 0.96, 'oil', 13))

  // 2. Soundhole: split cubist circle (half black cavity, half white/ochre rim) (2 marks)
  batch7.push(makeMark('soundhole-cavity', curvedStroke(485, 320, 485, 370, -20, rand), '#0f0a06', 16, 0.98, 'oil', 14))
  batch7.push(makeMark('soundhole-rim', curvedStroke(488, 320, 488, 370, 20, rand), '#fffbf0', 14, 0.96, 'oil', 14))

  // 3. Guitar bridge (1 mark)
  batch7.push(makeMark('bridge', curvedStroke(455, 515, 525, 515, 0, rand), '#0d0905', 13, 0.98, 'oil', 14))

  // 4. Fragmented guitar strings (10 marks)
  const stringPositions = [474, 481, 488, 495, 502]
  for (const sx of stringPositions) {
    batch7.push(makeMark('string-upper', curvedStroke(sx, 95, sx + 2, 215, 0, rand), '#2a221a', 2.5, 0.88, 'ink', 15))
    batch7.push(makeMark('string-lower', curvedStroke(sx + 3, 265, sx + 6, 512, 0, rand), '#1a140f', 2.5, 0.88, 'ink', 15))
  }

  // 5. Faceted Wine Goblet / Glass Still Life (11 marks)
  batch7.push(makeFilledFacet('glass-base', 'M 610 375 L 655 375 L 645 430 L 620 430 Z', '#e2e5e8', 0.85, 'gouache', 13))
  const glassFacetColors = ['#f5f5f5', '#cad2d9', '#a9b4bf', '#ffffff']
  for (let i = 0; i < 5; i++) {
    const t = i / 4
    const y = 390 + t * 35
    const x = 632 + randRange(-4, 4)
    const d = angledStroke(x, y, randRange(35, 48), -50 + randRange(-6, 6), randRange(-2, 2), rand)
    batch7.push(makeMark('glass-facet', d, randChoice(glassFacetColors), 12, randRange(0.8, 0.92), 'gouache', 14))
  }
  // Glowing ruby wine accent in glass!
  batch7.push(makeMark('glass-wine', curvedStroke(618, 412, 646, 414, 2, rand), '#9e1b28', 16, 0.94, 'oil', 14))
  // Goblet rim, stem, foot & shadow (4 marks)
  batch7.push(makeMark('glass-rim', curvedStroke(608, 375, 656, 375, 1, rand), '#ffffff', 4, 0.96, 'gouache', 15))
  batch7.push(makeMark('glass-stem', curvedStroke(632, 430, 633, 465, 0, rand), '#ffffff', 5, 0.94, 'oil', 14))
  batch7.push(makeMark('glass-foot', curvedStroke(618, 465, 648, 465, 0, rand), '#ffffff', 5, 0.94, 'oil', 14))
  batch7.push(makeMark('glass-shadow', curvedStroke(616, 468, 650, 468, 0, rand), '#3d2b1c', 4, 0.8, 'charcoal', 14))

  // 6. Still Life Pears / Fruit on table edge (10 marks)
  // Faceted fruit cluster (pear + apple):
  batch7.push(makeFilledFacet('pear-base', 'M 325 538 C 325 520 365 520 365 538 C 365 565 325 565 325 538 Z', '#859b32', 0.94, 'oil', 13))
  batch7.push(makeFilledFacet('apple-base', 'M 355 540 C 355 525 390 525 390 540 C 390 565 355 565 355 540 Z', '#a8782a', 0.94, 'oil', 13))
  const pearPalette = ['#9bb33e', '#738628', '#b4cb46', '#879e35']
  for (let i = 0; i < 6; i++) {
    const t = i / 5
    const x = 335 + t * 45 + randRange(-4, 4)
    const y = 540 + randRange(-6, 6)
    const d = angledStroke(x, y, randRange(25, 40), 20 + randRange(-10, 10), randRange(-2, 2), rand)
    batch7.push(makeMark('fruit-stroke', d, randChoice(pearPalette), 14, randRange(0.88, 0.96), 'oil', 14))
  }
  // Pear & apple stems:
  batch7.push(makeMark('pear-stem', curvedStroke(345, 524, 348, 514, 2, rand), '#3d2b1c', 3, 0.95, 'charcoal', 15))
  batch7.push(makeMark('apple-stem', curvedStroke(372, 525, 375, 516, -2, rand), '#3d2b1c', 3, 0.95, 'charcoal', 15))

  // =========================================================================
  // BATCH 8: Typographic & Collage Details - "LE JOU", Staves & Notes (38 marks)
  // Authentic Synthetic Cubist collage lettering, newsprint rules, and music notation.
  // =========================================================================
  const batch8: Mark[] = []
  // Masthead lettering "LE JOU" with crisp, authentic stencil geometry (11 marks)
  // 'L' (2 strokes)
  batch8.push(makeMark('jou-l-stem', curvedStroke(616, 208, 616, 238, 0, rand), '#151310', 4.5, 0.96, 'charcoal', 15))
  batch8.push(makeMark('jou-l-foot', curvedStroke(616, 238, 628, 238, 0, rand), '#151310', 4.5, 0.96, 'charcoal', 15))
  // 'E' (4 strokes)
  batch8.push(makeMark('jou-e-stem', curvedStroke(634, 208, 634, 238, 0, rand), '#151310', 4.5, 0.96, 'charcoal', 15))
  batch8.push(makeMark('jou-e-top', curvedStroke(634, 208, 646, 208, 0, rand), '#151310', 4, 0.96, 'charcoal', 15))
  batch8.push(makeMark('jou-e-mid', curvedStroke(634, 223, 643, 223, 0, rand), '#151310', 4, 0.96, 'charcoal', 15))
  batch8.push(makeMark('jou-e-bot', curvedStroke(634, 238, 646, 238, 0, rand), '#151310', 4, 0.96, 'charcoal', 15))
  // 'J' (1 stroke)
  batch8.push(makeMark('jou-j', curvedStroke(660, 208, 648, 234, 10, rand), '#151310', 4.5, 0.96, 'charcoal', 15))
  // 'O' (2 arcs)
  batch8.push(makeMark('jou-o-l', curvedStroke(674, 208, 674, 238, -12, rand), '#151310', 4.5, 0.96, 'charcoal', 15))
  batch8.push(makeMark('jou-o-r', curvedStroke(674, 208, 674, 238, 12, rand), '#151310', 4.5, 0.96, 'charcoal', 15))
  // 'U' (2 strokes)
  batch8.push(makeMark('jou-u-l', curvedStroke(694, 208, 704, 238, 8, rand), '#151310', 4.5, 0.96, 'charcoal', 15))
  batch8.push(makeMark('jou-u-r', curvedStroke(714, 208, 704, 238, -8, rand), '#151310', 4.5, 0.96, 'charcoal', 15))

  // Newspaper rule line separating masthead from columns
  batch8.push(makeMark('jou-rule', curvedStroke(612, 246, 715, 246, 0, rand), '#24201a', 2.5, 0.9, 'ink', 15))

  // Newspaper column text lines (small fractured horizontal dashes) (6 marks)
  for (let i = 0; i < 6; i++) {
    const y = 256 + i * 8
    const d = curvedStroke(616, y, 695 + randRange(-12, 8), y, 0, rand)
    batch8.push(makeMark('news-text', d, '#322f2b', 2.2, 0.82, 'ink', 15))
  }

  // Musical staves on sheet music facet (5 lines, angled at 12°)
  for (let i = 0; i < 5; i++) {
    const y = 415 + i * 11
    const d = curvedStroke(265, y, 350, y + 18, 0, rand)
    batch8.push(makeMark('music-stave', d, '#25211b', 2.5, 0.88, 'ink', 15))
  }

  // Musical notes and stems on staves (8 marks: 4 heads + 4 stems)
  const notePositions = [
    { x: 278, y: 426 },
    { x: 296, y: 440 },
    { x: 314, y: 430 },
    { x: 332, y: 450 },
  ]
  for (const n of notePositions) {
    batch8.push(makeMark('note-head', curvedStroke(n.x, n.y, n.x + 3, n.y + 1, 0, rand), '#120f0b', 7, 0.96, 'charcoal', 16))
    batch8.push(makeMark('note-stem', curvedStroke(n.x + 3, n.y, n.x + 3, n.y - 18, 0, rand), '#120f0b', 2.6, 0.92, 'ink', 16))
  }

  // Beamed eighth-note bar connecting note 1 and 2
  batch8.push(makeMark('note-beam', curvedStroke(281, 408, 299, 422, 0, rand), '#120f0b', 3.5, 0.95, 'ink', 16))

  // Faux-bois woodgrain wavy marks on guitar bouts and table (6 marks)
  const grainCurves = [
    { x1: 570, y1: 490, x2: 690, y2: 500, c: 7 },
    { x1: 580, y1: 515, x2: 710, y2: 525, c: 8 },
    { x1: 270, y1: 545, x2: 370, y2: 550, c: -7 },
    { x1: 250, y1: 570, x2: 360, y2: 575, c: -8 },
    { x1: 460, y1: 445, x2: 515, y2: 455, c: 5 },
    { x1: 470, y1: 475, x2: 520, y2: 485, c: 5 },
  ]
  for (const gc of grainCurves) {
    batch8.push(makeMark('woodgrain', curvedStroke(gc.x1, gc.y1, gc.x2, gc.y2, gc.c, rand), '#402a15', 3.8, 0.75, 'charcoal', 14))
  }

  // =========================================================================
  // BATCH 9: Broken Charcoal Structural Accents (32 marks)
  // Broken, discontinuous, chiseled charcoal accents that define
  // pivotal facet breaks and guitar contours without floating cartoon outlines.
  // =========================================================================
  const batch9: Mark[] = []
  const charcoalLines = [
    // Pyramid apex & neck edges
    { x1: 470, y1: 85, x2: 465, y2: 175, c: 0 },
    { x1: 512, y1: 85, x2: 518, y2: 165, c: 0 },
    // Guitar waist C-curves
    { x1: 435, y1: 305, x2: 428, y2: 375, c: 8 },
    { x1: 572, y1: 305, x2: 578, y2: 375, c: -8 },
    // Guitar shoulder breaks
    { x1: 435, y1: 305, x2: 470, y2: 280, c: 0 },
    { x1: 572, y1: 305, x2: 535, y2: 280, c: 0 },
    // Lower bout curves (broken)
    { x1: 428, y1: 375, x2: 430, y2: 505, c: -16 },
    { x1: 578, y1: 375, x2: 572, y2: 510, c: 16 },
    // Voluptuous outer bout contour breaks
    { x1: 388, y1: 300, x2: 410, y2: 390, c: -10 },
    { x1: 612, y1: 300, x2: 590, y2: 390, c: 10 },
    // Table perimeter & apron facets
    { x1: 150, y1: 512, x2: 285, y2: 565, c: 0 },
    { x1: 285, y1: 565, x2: 430, y2: 605, c: 0 },
    { x1: 560, y1: 608, x2: 715, y2: 565, c: 0 },
    { x1: 715, y1: 565, x2: 850, y2: 512, c: 0 },
    // Newsprint collage paper edges (crisp cut paper boundary)
    { x1: 606, y1: 175, x2: 606, y2: 320, c: 0 },
    { x1: 606, y1: 320, x2: 716, y2: 325, c: 0 },
    { x1: 724, y1: 170, x2: 716, y2: 325, c: 0 },
    // Sheet music paper edges (crisp cut paper boundary)
    { x1: 246, y1: 375, x2: 360, y2: 355, c: 0 },
    { x1: 360, y1: 355, x2: 374, y2: 515, c: 0 },
    { x1: 246, y1: 375, x2: 260, y2: 535, c: 0 },
    { x1: 260, y1: 535, x2: 374, y2: 515, c: 0 },
    // Goblet facet structural lines
    { x1: 610, y1: 375, x2: 654, y2: 375, c: 0 },
    { x1: 610, y1: 375, x2: 622, y2: 430, c: 0 },
    { x1: 654, y1: 375, x2: 645, y2: 430, c: 0 },
    // Soundboard interior facet breaks
    { x1: 472, y1: 285, x2: 472, y2: 395, c: 0 },
    { x1: 535, y1: 285, x2: 535, y2: 395, c: 0 },
    // Pedestal base contours
    { x1: 475, y1: 605, x2: 475, y2: 685, c: 0 },
    { x1: 525, y1: 605, x2: 525, y2: 685, c: 0 },
    { x1: 420, y1: 685, x2: 475, y2: 685, c: 0 },
    { x1: 525, y1: 685, x2: 580, y2: 685, c: 0 },
    // Fruit facet divide
    { x1: 355, y1: 530, x2: 360, y2: 560, c: 3 },
    // Architectural plane boundary accent
    { x1: 580, y1: 80, x2: 660, y2: 340, c: 0 },
  ]
  for (const cl of charcoalLines) {
    const d = curvedStroke(cl.x1, cl.y1, cl.x2, cl.y2, cl.c, rand)
    batch9.push(makeMark('charcoal-line', d, '#1b1713', randRange(3.6, 5.2), randRange(0.88, 0.98), 'charcoal', 17))
  }

  // =========================================================================
  // BATCH 10: Impasto Highlights & Radiant Paint Ridges (36 marks)
  // Radiant white and cream oil/gouache impasto ridges that catch light on
  // facet corners, soundhole, strings, and the pyramid apex.
  // =========================================================================
  const batch10: Mark[] = []
  const impastoHighlights = [
    // Soundboard shoulder highlight ridges
    { x1: 442, y1: 282, x2: 478, y2: 282, c: 0 },
    { x1: 528, y1: 282, x2: 565, y2: 282, c: 0 },
    // Soundhole bright crescent accent
    { x1: 492, y1: 325, x2: 492, y2: 365, c: 14 },
    // Bridge white bone saddle
    { x1: 458, y1: 512, x2: 518, y2: 512, c: 0 },
    // Sheet music crisp white top corner
    { x1: 248, y1: 378, x2: 300, y2: 368, c: 0 },
    // Newsprint crisp corner highlight
    { x1: 698, y1: 176, x2: 724, y2: 176, c: 0 },
    // Glass rim highlight
    { x1: 614, y1: 374, x2: 650, y2: 374, c: 0 },
    { x1: 628, y1: 420, x2: 640, y2: 420, c: 0 },
    // Fretboard ivory markers / frets
    { x1: 472, y1: 130, x2: 508, y2: 130, c: 0 },
    { x1: 473, y1: 155, x2: 510, y2: 155, c: 0 },
    { x1: 474, y1: 180, x2: 512, y2: 180, c: 0 },
    // Left bout edge sharp white facet cut
    { x1: 430, y1: 375, x2: 424, y2: 415, c: 0 },
    // Right bout edge sharp white facet cut
    { x1: 574, y1: 375, x2: 586, y2: 415, c: 0 },
    // Tabletop apex intersection highlight
    { x1: 460, y1: 540, x2: 520, y2: 535, c: 0 },
    // Table rim white chalk line
    { x1: 280, y1: 565, x2: 380, y2: 590, c: 0 },
    { x1: 620, y1: 590, x2: 720, y2: 565, c: 0 },
    // Pear yellow-green light catch
    { x1: 345, y1: 535, x2: 365, y2: 540, c: 0 },
    // Headstock apex peak white point
    { x1: 480, y1: 83, x2: 502, y2: 83, c: 0 },
    // Subtle cross-hatch light dabs on soundboard
    { x1: 485, y1: 240, x2: 515, y2: 255, c: 0 },
    { x1: 470, y1: 440, x2: 500, y2: 455, c: 0 },
    { x1: 515, y1: 435, x2: 545, y2: 450, c: 0 },
    // Collage paper white corner lifts
    { x1: 260, y1: 530, x2: 285, y2: 536, c: 0 },
    { x1: 610, y1: 322, x2: 635, y2: 324, c: 0 },
    // Wine goblet bowl reflection
    { x1: 622, y1: 390, x2: 626, y2: 415, c: 0 },
    // Table apron highlight
    { x1: 450, y1: 602, x2: 540, y2: 604, c: 0 },
    // Lower pedestal light accent
    { x1: 485, y1: 645, x2: 505, y2: 645, c: 0 },
    // Voluptuous bout highlight curves
    { x1: 600, y1: 270, x2: 610, y2: 330, c: 6 },
    { x1: 395, y1: 270, x2: 390, y2: 330, c: -6 },
    // Additional delicate highlight touches
    { x1: 465, y1: 315, x2: 475, y2: 335, c: 0 },
    { x1: 520, y1: 315, x2: 512, y2: 335, c: 0 },
    { x1: 495, y1: 485, x2: 510, y2: 485, c: 0 },
    { x1: 660, y1: 206, x2: 675, y2: 206, c: 0 },
    { x1: 335, y1: 415, x2: 350, y2: 425, c: 0 },
    { x1: 445, y1: 685, x2: 475, y2: 685, c: 0 },
    { x1: 525, y1: 685, x2: 555, y2: 685, c: 0 },
    { x1: 710, y1: 170, x2: 730, y2: 190, c: 0 },
  ]
  for (const hl of impastoHighlights) {
    const d = curvedStroke(hl.x1, hl.y1, hl.x2, hl.y2, hl.c, rand)
    batch10.push(makeMark('impasto-ridge', d, '#fffef7', randRange(3.5, 6), randRange(0.88, 0.98), 'oil', 18))
  }

  return {
    slug: 'cubist-guitar',
    title: 'Still Life with Guitar and Guéridon',
    brief: 'An analytic and synthetic cubist composition on a guéridon pedestal table, rendered with painterly oil and gouache facets, Cézanne passage, rich texture, and charcoal accents.',
    style: 'Analytic and Synthetic Cubism (Picasso, Braque, Gris, 1911–1914). Muted palette of yellow ochre, raw umber, burnt sienna, slate grey, linen buff, and Prussian blue. Faceted interlocking planes, Cézanne-style passage (open contours, dissolved edges between facets), tactile oil and gouache brushwork with variable stroke length, angle, and impasto; faux-bois woodgrain, newsprint collage fragments ("LE JOU"), musical staves, fractured wine goblet, and broken chiseled charcoal structural accents.',
    batches: [
      { label: 'Toned Imprimatura & Scumbled Grey-Ochre Field', marks: batch1 },
      { label: 'Architectural Space Facets - Top-Right & Flanks', marks: batch2 },
      { label: 'The Guéridon Table & Sturdy Pedestal Base', marks: batch3 },
      { label: 'Collage Grounds - Faux-bois Wallpaper, Newsprint & Music Paper', marks: batch4 },
      { label: 'Guitar Soundboard & Voluptuous Side Bouts', marks: batch5 },
      { label: 'Guitar Lower Bout & Deep Shadow Facets', marks: batch6 },
      { label: 'Guitar Anatomy, Goblet Still Life & Fruit', marks: batch7 },
      { label: 'Typographic & Collage Details - "LE JOU", Staves & Notes', marks: batch8 },
      { label: 'Broken Charcoal Structural Accents', marks: batch9 },
      { label: 'Impasto Highlights & Radiant Paint Ridges', marks: batch10 },
    ],
  }
}

// Self-executing CLI generator
if (process.argv[1]?.endsWith('generate-cubist.ts')) {
  const p = createCubistGuitar()
  const stats = validatePiece(p)
  renderPiece(p, path.resolve('renders/cubist-guitar.png'))
  console.log(`Cubist Guitar Rendered: ${stats.totalMarks} marks in ${stats.batchCount} batches`)
  fs.writeFileSync('src/studio/examples/cubist-guitar.json', JSON.stringify(p, null, 2), 'utf8')
}
