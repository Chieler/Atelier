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

// Generate an individual curved dash tangent to an angle
function makeFlowDash(
  x: number,
  y: number,
  len: number,
  angleRad: number,
  curveAmount: number = 2.5,
): string {
  const dx = Math.cos(angleRad) * (len / 2)
  const dy = Math.sin(angleRad) * (len / 2)
  const x1 = x - dx
  const y1 = y - dy
  const x2 = x + dx
  const y2 = y + dy
  const nx = -Math.sin(angleRad) * curveAmount
  const ny = Math.cos(angleRad) * curveAmount
  const cx = x + nx
  const cy = y + ny
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

// Smooth vector field for the Saint-Rémy nocturnal sky
function computeSkyVector(
  x: number,
  y: number,
  stars: { x: number; y: number; r: number }[],
  moon: { x: number; y: number },
): { angle: number; curvature: number } {
  const normX = x / 1000
  // Big sweeping S-current across the sky
  const waveSlope = -0.55 * Math.cos(normX * Math.PI * 2 - 0.4) + 0.25 * Math.sin(normX * Math.PI * 3.5)
  let vx = 1.0
  let vy = waveSlope

  // Primary spiral vortex at (480, 195)
  const dx1 = x - 480
  const dy1 = y - 195
  const dist1 = Math.hypot(dx1, dy1)
  if (dist1 < 230) {
    const w1 = Math.exp(-Math.pow(dist1 / 115, 2)) * 4.2
    const phi1 = Math.atan2(dy1, dx1)
    const v1x = -Math.sin(phi1) - 0.28 * Math.cos(phi1)
    const v1y = Math.cos(phi1) - 0.28 * Math.sin(phi1)
    vx += v1x * w1
    vy += v1y * w1
  }

  // Secondary counter-spiral at (625, 220)
  const dx2 = x - 625
  const dy2 = y - 220
  const dist2 = Math.hypot(dx2, dy2)
  if (dist2 < 170) {
    const w2 = Math.exp(-Math.pow(dist2 / 85, 2)) * 3.2
    const phi2 = Math.atan2(dy2, dx2)
    const v2x = -Math.sin(phi2) + 0.22 * Math.cos(phi2)
    const v2y = Math.cos(phi2) + 0.22 * Math.sin(phi2)
    vx += v2x * w2
    vy += v2y * w2
  }

  // Concentric rotational fields around the stars
  for (const st of stars) {
    const sdx = x - st.x
    const sdy = y - st.y
    const sdist = Math.hypot(sdx, sdy)
    if (sdist < st.r * 2.8) {
      const sw = Math.exp(-Math.pow(sdist / (st.r * 1.3), 2)) * 4.5
      const sphi = Math.atan2(sdy, sdx)
      vx += -Math.sin(sphi) * sw
      vy += Math.cos(sphi) * sw
    }
  }

  // Concentric rotational field around the moon
  const mdx = x - moon.x
  const mdy = y - moon.y
  const mdist = Math.hypot(mdx, mdy)
  if (mdist < 190) {
    const mw = Math.exp(-Math.pow(mdist / 100, 2)) * 4.8
    const mphi = Math.atan2(mdy, mdx)
    vx += -Math.sin(mphi) * mw
    vy += Math.cos(mphi) * mw
  }

  const angle = Math.atan2(vy, vx)
  return { angle, curvature: 2.8 }
}

export function createStarryCypress(): Piece {
  const rand = makeRandom(18890618)
  let markCounter = 0
  const nextId = (prefix: string) => `${prefix}-${++markCounter}`

  const stars = [
    { x: 275, y: 135, r: 42 },
    { x: 395, y: 80, r: 36 },
    { x: 675, y: 105, r: 44 },
    { x: 805, y: 220, r: 38 },
    { x: 345, y: 250, r: 35 },
    { x: 745, y: 60, r: 34 },
  ]
  const moon = { x: 885, y: 118 }

  // =========================================================================
  // BATCH 1: Toned Ground & Foundation Washes (32 marks)
  // =========================================================================
  const batch1: Mark[] = []

  // Deep indigo/Prussian blue toned ground
  batch1.push({
    id: nextId('vangogh-ground-prussian'),
    type: 'rect',
    layer: 1,
    x: 0, y: 0, width: 1000, height: 700,
    fill: '#081024',
    stroke: 'none', strokeWidth: 0, opacity: 0.98,
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  // Deep sky underpainting wash
  batch1.push({
    id: nextId('vangogh-sky-base-wash'),
    type: 'rect',
    layer: 2,
    x: 0, y: 0, width: 1000, height: 425,
    fill: '#0c1b3a',
    stroke: 'none', strokeWidth: 0, opacity: 0.95,
    brush: { preset: 'gouache', seed: 101 },
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  // Horizon cobalt atmospheric mist wash
  batch1.push({
    id: nextId('vangogh-horizon-mist-wash'),
    type: 'path',
    layer: 2,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 0 320 C 300 290 600 340 1000 300 L 1000 450 L 0 450 Z',
    fill: '#1c3e72',
    stroke: 'none', strokeWidth: 0, opacity: 0.85,
    brush: { preset: 'gouache', seed: 102 },
  })

  // Valley base wash (filling down to y=700)
  batch1.push({
    id: nextId('vangogh-valley-base-wash'),
    type: 'rect',
    layer: 2,
    x: 0, y: 440, width: 1000, height: 260,
    fill: '#0e1814',
    stroke: 'none', strokeWidth: 0, opacity: 0.95,
    brush: { preset: 'gouache', seed: 103 },
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  // Broad directional sky base strokes (28 marks)
  const skyBaseTones = ['#102248', '#162e5c', '#1b376c', '#20427c', '#142954']
  for (let i = 0; i < 28; i++) {
    const y = 25 + (i / 28) * 360 + (rand() - 0.5) * 15
    const x = rand() * 880
    const { angle, curvature } = computeSkyVector(x, y, stars, moon)
    batch1.push({
      id: nextId('vangogh-sky-base-stroke'),
      type: 'path',
      layer: 3,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeFlowDash(x, y, 65 + rand() * 40, angle, curvature),
      fill: 'none',
      stroke: skyBaseTones[i % skyBaseTones.length],
      strokeWidth: 22 + rand() * 8,
      opacity: 0.9,
      brush: { preset: 'oil', seed: 110 + i },
    })
  }
  // Total Batch 1: 32 marks

  // Helper for generating dense sky flow-field tiling in staggered brick layout
  function generateSkyFlowTiling(
    layer: number,
    yMin: number,
    yMax: number,
    rows: number,
    cols: number,
    palette: string[],
    strokeW: number,
    dashLen: number,
    subpathsPerMark: number,
    seedOffset: number,
    prefix: string,
  ): Mark[] {
    const marks: Mark[] = []
    const rowHeight = (yMax - yMin) / rows
    const colWidth = 1040 / cols
    for (let r = 0; r < rows; r++) {
      const rowY = yMin + r * rowHeight + rowHeight * 0.5
      const rowXOffset = (r % 2 === 1 ? colWidth * 0.5 : 0) - 20
      for (let c = 0; c < cols; c++) {
        const cx = rowXOffset + c * colWidth + (rand() - 0.5) * (colWidth * 0.3)
        const cy = rowY + (rand() - 0.5) * (rowHeight * 0.3)
        const parts: string[] = []
        for (let s = 0; s < subpathsPerMark; s++) {
          const sx = cx + (rand() - 0.5) * (colWidth * 0.7)
          const sy = cy + (s - (subpathsPerMark - 1) / 2) * (rowHeight * 0.38) + (rand() - 0.5) * 4
          const { angle, curvature } = computeSkyVector(sx, sy, stars, moon)
          const len = dashLen + rand() * (dashLen * 0.4)
          parts.push(makeFlowDash(sx, sy, len, angle, curvature))
        }
        marks.push({
          id: nextId(prefix),
          type: 'path',
          layer,
          x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
          d: parts.join(' '),
          fill: 'none',
          stroke: palette[Math.floor(rand() * palette.length)],
          strokeWidth: strokeW + rand() * 3.0,
          opacity: 0.94,
          brush: { preset: 'oil', seed: seedOffset + r * cols + c },
        })
      }
    }
    return marks
  }

  // =========================================================================
  // BATCH 2: Dense Upper Sky Flow-Field Tiling (48 marks)
  // Completely tiles y=0..220 with directional flow dashes (no bare ground!)
  // =========================================================================
  const upperSkyTones = ['#0e1e3e', '#142c58', '#1c3b74', '#22498d', '#183262', '#12254c', '#20437e', '#295499']
  const batch2 = generateSkyFlowTiling(
    4,
    0, 220,
    6, 8,
    upperSkyTones,
    12.0,
    42,
    5,
    200,
    'vangogh-sky-upper-tile',
  )
  // Total Batch 2: 48 marks

  // =========================================================================
  // BATCH 3: Dense Lower Sky Flow-Field Tiling (48 marks)
  // Completely tiles y=200..425 with directional flow dashes down to the mountains
  // =========================================================================
  const lowerSkyTones = ['#122852', '#1a376c', '#214582', '#2b5398', '#1e3860', '#254b8a', '#305fa6', '#1b325c']
  const batch3 = generateSkyFlowTiling(
    5,
    200, 425,
    6, 8,
    lowerSkyTones,
    12.0,
    42,
    5,
    300,
    'vangogh-sky-lower-tile',
  )
  // Total Batch 3: 48 marks

  // =========================================================================
  // BATCH 4: Primary & Secondary Cosmic Swirl Vortices (48 marks)
  // The churning spiral stream across the sky
  // =========================================================================
  const batch4: Mark[] = []
  const swirlColors = [
    '#2d72b8', '#408cd4', '#5da5e8', '#7ebdf2', '#a6d5fa',
    '#cce8fd', '#ecf6fe', '#ffffff', '#82bfee', '#4d94dc',
  ]
  for (let i = 0; i < 48; i++) {
    const t = i / 48
    let sx = 0
    let sy = 0
    if (t < 0.5) {
      // Primary vortex spiral at (480, 195)
      const u = t / 0.5
      const theta = u * Math.PI * 4.2 - 0.5
      const rad = 25 + u * 155
      sx = 480 + Math.cos(theta) * rad
      sy = 195 + Math.sin(theta) * (rad * 0.72)
    } else {
      // Secondary swirl at (625, 220) and bridge to upper right
      const u = (t - 0.5) / 0.5
      const theta = u * Math.PI * 3.4 + 1.2
      const rad = 20 + u * 170
      sx = 625 + Math.cos(theta) * rad + u * 120
      sy = 220 + Math.sin(theta) * (rad * 0.65) - u * 80
    }
    const { angle, curvature } = computeSkyVector(sx, sy, stars, moon)
    const parts: string[] = []
    for (let s = -1; s <= 1; s++) {
      const px = sx + s * 6 * Math.cos(angle + Math.PI / 2)
      const py = sy + s * 6 * Math.sin(angle + Math.PI / 2)
      parts.push(makeFlowDash(px, py, 34 + rand() * 18, angle, curvature * 1.2))
    }
    batch4.push({
      id: nextId('vangogh-vortex-stream'),
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: parts.join(' '),
      fill: 'none',
      stroke: swirlColors[i % swirlColors.length],
      strokeWidth: 9.0 + rand() * 3.5,
      opacity: 0.95,
      brush: { preset: 'oil', seed: 400 + i },
    })
  }
  // Total Batch 4: 48 marks

  // =========================================================================
  // BATCH 5: Stars & Moon Radiance (48 marks)
  // Warm golden dashed concentric orbits orbiting glowing cores
  // =========================================================================
  const batch5: Mark[] = []
  const starColors = ['#fff5be', '#ffdf52', '#ffc82a', '#ffaa18', '#ff880e', '#7ab2e8', '#a8d2f8']

  // 6 Stars: solid core + 5 concentric orbital dashed rings (6 * 6 = 36 marks)
  stars.forEach((st, sIdx) => {
    // Solid glowing core
    batch5.push({
      id: nextId(`vangogh-star-core-${sIdx}`),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeFlowDash(st.x, st.y, st.r * 0.5, 0, 0),
      fill: 'none',
      stroke: '#ffffff',
      strokeWidth: st.r * 0.65,
      opacity: 0.98,
      brush: { preset: 'oil', seed: 500 + sIdx },
    })

    // 5 Concentric orbital dashed rings
    for (let ring = 1; ring <= 5; ring++) {
      const radius = (st.r * 0.42) + ring * (st.r * 0.35)
      const parts: string[] = []
      const dashCount = 8 + ring * 3
      for (let d = 0; d < dashCount; d++) {
        const phi = (d / dashCount) * Math.PI * 2
        const dx = st.x + Math.cos(phi) * radius
        const dy = st.y + Math.sin(phi) * radius
        const tangent = phi + Math.PI / 2
        parts.push(makeFlowDash(dx, dy, 14 + ring * 2.5, tangent, 3))
      }
      batch5.push({
        id: nextId(`vangogh-star-orbit-${sIdx}-${ring}`),
        type: 'path',
        layer: 7,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: parts.join(' '),
        fill: 'none',
        stroke: starColors[(ring - 1 + sIdx) % starColors.length],
        strokeWidth: 6.5 + rand() * 2.0,
        opacity: 0.94,
        brush: { preset: 'oil', seed: 510 + sIdx * 6 + ring },
      })
    }
  })

  // Crescent Moon at (885, 118): glowing core + radiant halos (12 marks)
  batch5.push({
    id: nextId('vangogh-moon-crescent-body'),
    type: 'path',
    layer: 8,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 870 75 Q 925 115 885 165 Q 905 125 870 75 Z',
    fill: '#ffcf36',
    stroke: '#ff9812',
    strokeWidth: 4.5,
    opacity: 0.98,
    brush: { preset: 'oil', seed: 560 },
  })
  batch5.push({
    id: nextId('vangogh-moon-inner-glow'),
    type: 'path',
    layer: 8,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 875 88 Q 915 118 888 152 Q 900 125 875 88 Z',
    fill: '#ffffff',
    stroke: '#fff4b8',
    strokeWidth: 3.5,
    opacity: 0.98,
    brush: { preset: 'oil', seed: 561 },
  })
  for (let ring = 1; ring <= 10; ring++) {
    const radius = 32 + ring * 12
    const parts: string[] = []
    const dashCount = 10 + ring * 2
    for (let d = 0; d < dashCount; d++) {
      const phi = (d / dashCount) * Math.PI * 2
      const dx = moon.x + Math.cos(phi) * radius
      const dy = moon.y + Math.sin(phi) * radius
      const tangent = phi + Math.PI / 2
      parts.push(makeFlowDash(dx, dy, 16 + ring * 2, tangent, 3))
    }
    batch5.push({
      id: nextId(`vangogh-moon-orbit-${ring}`),
      type: 'path',
      layer: 7,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: parts.join(' '),
      fill: 'none',
      stroke: starColors[(ring - 1) % starColors.length],
      strokeWidth: 6.5,
      opacity: 0.94,
      brush: { preset: 'oil', seed: 570 + ring },
    })
  }
  // Total Batch 5: 48 marks

  // =========================================================================
  // BATCH 6: Alpilles Mountains - Deep Undulating Ridges (46 marks)
  // Sweeping rhythmic curves following mountain contours y=380..490
  // =========================================================================
  const batch6: Mark[] = []
  const mountainTones = ['#1a3258', '#22406e', '#2c5087', '#1c3660', '#355f9e', '#162b4c', '#274b7d', '#3d6db0']
  for (let i = 0; i < 46; i++) {
    const x = (i / 46) * 1040 - 20
    const peakCurve = Math.sin((x / 1000) * Math.PI * 2.6) * 44 + Math.cos((x / 1000) * Math.PI * 4.4) * 22
    const y = 415 + peakCurve + (rand() - 0.5) * 6
    const angle = Math.cos((x / 1000) * Math.PI * 2.6) * 0.48
    const parts: string[] = []
    for (let s = -1; s <= 1; s++) {
      parts.push(makeFlowDash(x, y + s * 10, 44 + rand() * 16, angle, 3.5))
    }
    batch6.push({
      id: nextId('vangogh-alpilles-peak-ridge'),
      type: 'path',
      layer: 9,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: parts.join(' '),
      fill: 'none',
      stroke: mountainTones[i % mountainTones.length],
      strokeWidth: 11.0 + rand() * 3.0,
      opacity: 0.95,
      brush: { preset: 'oil', seed: 600 + i },
    })
  }
  // Total Batch 6: 46 marks

  // =========================================================================
  // BATCH 7: Rolling Foothills & Harvest Ochre Fields (48 marks)
  // Densely packed blue-green hills and warm ochre fields tiling y=470..620
  // =========================================================================
  const batch7: Mark[] = []
  const foothillTones = [
    '#1e4436', '#285845', '#356a52', '#447d60', '#568f6f',
    '#786b2b', '#968234', '#b59e3e', '#d2b64a', '#8a6c25', '#52431c', '#3c3016',
  ]
  // 6 rows x 8 cols = 48 marks in staggered brick pattern
  for (let r = 0; r < 6; r++) {
    const rowY = 470 + r * 25 + 12
    const rowXOffset = (r % 2 === 1 ? 65 : 0) - 20
    for (let c = 0; c < 8; c++) {
      const cx = rowXOffset + c * 130 + (rand() - 0.5) * 35
      const cy = rowY + (rand() - 0.5) * 6
      const rollSlope = Math.sin((cx / 1000) * Math.PI * 3.0) * 0.35
      const angle = Math.atan(rollSlope)
      const parts: string[] = []
      for (let s = 0; s < 4; s++) {
        const sx = cx + (rand() - 0.5) * 60
        const sy = cy + (s - 1.5) * 9 + (rand() - 0.5) * 4
        parts.push(makeFlowDash(sx, sy, 42 + rand() * 20, angle, 2.5))
      }
      batch7.push({
        id: nextId('vangogh-foothill-ochre-tile'),
        type: 'path',
        layer: 10,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: parts.join(' '),
        fill: 'none',
        stroke: foothillTones[Math.floor(rand() * foothillTones.length)],
        strokeWidth: 11.0 + rand() * 3.0,
        opacity: 0.94,
        brush: { preset: 'oil', seed: 700 + r * 8 + c },
      })
    }
  }
  // Total Batch 7: 48 marks

  // =========================================================================
  // BATCH 8: Olive Groves & Valley Floor Tiling (48 marks)
  // Billowing silver-green foliage & valley earth tiling all the way to y=700!
  // =========================================================================
  const batch8: Mark[] = []
  const olivePalette = ['#2b4830', '#3d6342', '#58805a', '#78a277', '#98bf96', '#32422a', '#4a5b3a']
  const groundEarthPalette = ['#1e2c1e', '#2a3a28', '#384832', '#4a3824', '#32281a', '#221e16']

  // 24 Olive grove clumps (y=520..630)
  for (let i = 0; i < 24; i++) {
    const cx = 180 + (i / 24) * 800 + (rand() - 0.5) * 30
    const cy = 535 + Math.sin(i * 0.7) * 35 + rand() * 30
    const parts: string[] = []
    for (let f = 0; f < 6; f++) {
      const phi = (f / 6) * Math.PI * 2 + rand() * 0.5
      const rad = 10 + rand() * 16
      const px = cx + Math.cos(phi) * rad
      const py = cy + Math.sin(phi) * rad
      parts.push(makeFlowDash(px, py, 20 + rand() * 12, phi + Math.PI / 2, 3))
    }
    batch8.push({
      id: nextId('vangogh-olive-grove-clump'),
      type: 'path',
      layer: 11,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: parts.join(' '),
      fill: 'none',
      stroke: olivePalette[i % olivePalette.length],
      strokeWidth: 8.5 + rand() * 2.5,
      opacity: 0.95,
      brush: { preset: 'oil', seed: 800 + i },
    })
  }

  // 24 Valley floor & road ground strokes covering y=620..700 edge-to-edge!
  for (let i = 0; i < 24; i++) {
    const x = (i % 8) * 130 + 30 + (rand() - 0.5) * 30
    const y = 630 + Math.floor(i / 8) * 24 + (rand() - 0.5) * 8
    const parts: string[] = []
    for (let s = 0; s < 4; s++) {
      const sx = x + (rand() - 0.5) * 50
      const sy = y + (s - 1.5) * 8
      const len = 40 + rand() * 25
      parts.push(makeFlowDash(sx, sy, len, (rand() - 0.5) * 0.2, 1))
    }
    batch8.push({
      id: nextId('vangogh-valley-floor-tile'),
      type: 'path',
      layer: 11,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: parts.join(' '),
      fill: 'none',
      stroke: groundEarthPalette[i % groundEarthPalette.length],
      strokeWidth: 12.0 + rand() * 3.0,
      opacity: 0.94,
      brush: { preset: 'oil', seed: 850 + i },
    })
  }
  // Total Batch 8: 24 + 24 = 48 marks

  // =========================================================================
  // BATCH 9: Saint-Rémy Village Architecture & Solid Church Spire (46 marks)
  // Real body for church spire, masonry nave & glowing amber windows
  // =========================================================================
  const batch9: Mark[] = []

  // Church of Saint-Martin: Nave and prominent gothic spire
  // 1) Nave stone walls
  batch9.push({
    id: nextId('vangogh-church-nave-mass'),
    type: 'path',
    layer: 12,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 445 645 L 445 598 L 498 588 L 498 645 Z',
    fill: '#182436',
    stroke: '#101a28',
    strokeWidth: 4.0,
    opacity: 0.98,
    brush: { preset: 'oil', seed: 900 },
  })
  // 2) Church pitched roof
  batch9.push({
    id: nextId('vangogh-church-roof'),
    type: 'path',
    layer: 12,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 440 600 L 472 576 L 502 590 Z',
    fill: '#3a2b38',
    stroke: '#281c26',
    strokeWidth: 3.5,
    opacity: 0.98,
    brush: { preset: 'oil', seed: 901 },
  })
  // 3) Tower belfry body
  batch9.push({
    id: nextId('vangogh-church-belfry-tower'),
    type: 'path',
    layer: 13,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 460 590 L 460 525 L 484 525 L 484 590 Z',
    fill: '#1c283c',
    stroke: '#121c2c',
    strokeWidth: 4.5,
    opacity: 0.98,
    brush: { preset: 'oil', seed: 902 },
  })
  // 4) Tower belfry arched window louvers
  batch9.push({
    id: nextId('vangogh-church-belfry-arches'),
    type: 'path',
    layer: 14,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 467 558 L 467 538 M 477 558 L 477 538',
    fill: 'none',
    stroke: '#080d16',
    strokeWidth: 3.0,
    opacity: 0.98,
    brush: { preset: 'oil', seed: 903 },
  })
  // 5) Impressive tapering gothic spire body (reaching y=418 against the sky)
  batch9.push({
    id: nextId('vangogh-church-spire-body'),
    type: 'path',
    layer: 14,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 458 525 L 472 418 L 486 525 Z',
    fill: '#18263a',
    stroke: '#0e1826',
    strokeWidth: 4.5,
    opacity: 0.98,
    brush: { preset: 'oil', seed: 904 },
  })
  // 6) Spire moonlit highlight ridge
  batch9.push({
    id: nextId('vangogh-church-spire-ridge'),
    type: 'path',
    layer: 15,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 472 418 L 472 525',
    fill: 'none',
    stroke: '#7aa0d0',
    strokeWidth: 3.5,
    opacity: 0.95,
    brush: { preset: 'oil', seed: 905 },
  })

  // Clustered cottages: 20 cottage roofs + masonry (20 marks)
  const roofTones = ['#4a2a22', '#64352a', '#783c2e', '#362b3a', '#523a48', '#2e2632']
  for (let i = 0; i < 20; i++) {
    const hx = 320 + (i % 7) * 45 + Math.floor(i / 7) * 25 + (rand() - 0.5) * 12
    const hy = 612 + Math.floor(i / 7) * 26 + (rand() - 0.5) * 8
    const w = 24 + rand() * 10
    const h = 14 + rand() * 6
    batch9.push({
      id: nextId(`vangogh-cottage-roof-${i}`),
      type: 'path',
      layer: 12,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: `M ${hx} ${hy} L ${hx + w / 2} ${hy - h} L ${hx + w} ${hy} Z`,
      fill: roofTones[i % roofTones.length],
      stroke: '#1e1418',
      strokeWidth: 2.5,
      opacity: 0.96,
      brush: { preset: 'oil', seed: 910 + i },
    })
  }

  // Glowing warm amber windows (20 marks)
  const amberGlows = ['#f59818', '#ffbf2e', '#ffe066', '#ff8410', '#ffd84e']
  for (let i = 0; i < 20; i++) {
    const wx = 330 + (i % 7) * 45 + Math.floor(i / 7) * 25 + (rand() - 0.5) * 10
    const wy = 620 + Math.floor(i / 7) * 26 + (rand() - 0.5) * 6
    batch9.push({
      id: nextId(`vangogh-window-amber-${i}`),
      type: 'path',
      layer: 13,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: `M ${wx} ${wy} L ${wx + 5} ${wy}`,
      fill: 'none',
      stroke: amberGlows[i % amberGlows.length],
      strokeWidth: 4.5,
      opacity: 0.98,
      brush: { preset: 'oil', seed: 935 + i },
    })
  }
  // Total Batch 9: 46 marks

  // Cypress Flame Generation Helper (Supporting double-flame colossal silhouette)
  function createCypressFlameBatch(
    layer: number,
    palette: string[],
    xOffsetFactor: number,
    lenBase: number,
    strokeW: number,
    count: number,
    seedOffset: number,
    prefix: string,
  ): Mark[] {
    const marks: Mark[] = []
    for (let i = 0; i < count; i++) {
      const isSecondaryProng = i % 4 === 0 // 25% of strokes form the right shoulder flame
      let cx = 0
      let cy = 0
      let flameW = 0
      let frac = 0

      if (isSecondaryProng) {
        // Right shoulder flame prong: base to y=190, centered at x=155
        frac = (i / count) * 1.5
        cy = 690 - Math.min(1.0, frac) * 500 // reaches y=190
        const flameSway = Math.sin(frac * Math.PI * 2.5) * 12
        cx = 150 + flameSway + xOffsetFactor * 25 + (rand() - 0.5) * 35
        flameW = 60 * Math.max(0.15, 1 - frac * 0.75)
      } else {
        // Main towering flame spire: reaches up to y=35, centered at x=110
        frac = i / count
        cy = 690 - frac * 655
        const flameSway = Math.sin(frac * Math.PI * 3.2) * 20 + Math.cos(frac * Math.PI * 4.8) * 10
        cx = 110 + flameSway + xOffsetFactor * 35 + (rand() - 0.5) * 45
        flameW = 110 * Math.max(0.12, 1 - frac * 0.72)
      }

      const parts: string[] = []
      for (let s = 0; s < 5; s++) {
        const px = cx + (rand() - 0.5) * (flameW * 0.45)
        const py = cy + (rand() - 0.5) * 18
        const len = lenBase + rand() * 16
        const angle = -Math.PI / 2 + (rand() - 0.5) * 0.35 + Math.sin(frac * Math.PI * 4) * 0.25
        parts.push(makeFlowDash(px, py, len, angle, 4.5))
      }
      marks.push({
        id: nextId(prefix),
        type: 'path',
        layer,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: parts.join(' '),
        fill: 'none',
        stroke: palette[Math.floor(rand() * palette.length)],
        strokeWidth: strokeW + rand() * 2.5,
        opacity: 0.96,
        brush: { preset: 'oil', seed: seedOffset + i },
      })
    }
    return marks
  }

  // =========================================================================
  // BATCH 10: Colossal Cypress - Deep Shadow Flame Mass (48 marks)
  // Overlapping dense tall wavy flame strokes in near-black green
  // =========================================================================
  const cypressShadowColors = ['#061408', '#0b2010', '#102814', '#0d1e18', '#142212', '#08170c']
  const batch10 = createCypressFlameBatch(
    14,
    cypressShadowColors,
    -0.25,
    38,
    11.0,
    48,
    1000,
    'vangogh-cypress-shadow',
  )
  // Total Batch 10: 48 marks

  // =========================================================================
  // BATCH 11: Colossal Cypress - Midtone Flame & Twisting Spires (48 marks)
  // Viridian, forest green, and rich olive upward flames
  // =========================================================================
  const cypressMidColors = ['#15381e', '#1e4828', '#2b5832', '#22441c', '#356338', '#1c3e20', '#285024']
  const batch11 = createCypressFlameBatch(
    15,
    cypressMidColors,
    0.15,
    34,
    9.5,
    48,
    1100,
    'vangogh-cypress-mid',
  )
  // Total Batch 11: 48 marks

  // =========================================================================
  // BATCH 12: Cypress Highlights & Celestial Crest Sparkles (48 marks)
  // Amber-gold flame flickers, moonlit olive & brilliant sky crests
  // =========================================================================
  const batch12: Mark[] = []
  // Cypress highlights (32 marks)
  const cypressHighlightColors = ['#485c26', '#62762e', '#806e26', '#523e18', '#3a5424', '#726020']
  for (let i = 0; i < 32; i++) {
    const frac = i / 32
    const cy = 680 - frac * 625
    const flameSway = Math.sin(frac * Math.PI * 3.2) * 20 + Math.cos(frac * Math.PI * 4.8) * 10
    const trunkX = 110 + flameSway
    const flameW = 100 * Math.max(0.12, 1 - frac * 0.72)
    const cx = trunkX + flameW * 0.25 + (rand() - 0.5) * flameW * 0.35
    const parts: string[] = []
    for (let s = 0; s < 4; s++) {
      const px = cx + (rand() - 0.5) * (flameW * 0.3)
      const py = cy + (rand() - 0.5) * 14
      const len = 25 + rand() * 14
      const angle = -Math.PI / 2 + (rand() - 0.5) * 0.4
      parts.push(makeFlowDash(px, py, len, angle, 3.5))
    }
    batch12.push({
      id: nextId('vangogh-cypress-highlight'),
      type: 'path',
      layer: 16,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: parts.join(' '),
      fill: 'none',
      stroke: cypressHighlightColors[i % cypressHighlightColors.length],
      strokeWidth: 7.5 + rand() * 2.0,
      opacity: 0.95,
      brush: { preset: 'oil', seed: 1200 + i },
    })
  }

  // Brightest celestial swirl crest dashes (16 marks)
  const crestColors = ['#ffffff', '#f4faff', '#d8eeff', '#fffbdc']
  for (let i = 0; i < 16; i++) {
    const t = i / 16
    const theta = t * Math.PI * 3.8 + 0.3
    const rad = 45 + t * 140
    const sx = 480 + Math.cos(theta) * rad
    const sy = 195 + Math.sin(theta) * (rad * 0.68)
    const { angle, curvature } = computeSkyVector(sx, sy, stars, moon)
    batch12.push({
      id: nextId('vangogh-crest-sparkle'),
      type: 'path',
      layer: 17,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeFlowDash(sx, sy, 28 + rand() * 14, angle, curvature * 1.5),
      fill: 'none',
      stroke: crestColors[i % crestColors.length],
      strokeWidth: 8.0 + rand() * 2.5,
      opacity: 0.98,
      brush: { preset: 'oil', seed: 1240 + i },
    })
  }
  // Total Batch 12: 32 + 16 = 48 marks

  const batches = [
    { label: 'Toned Ground & Washes', marks: batch1 },
    { label: 'Dense Upper Sky Flow Tiling', marks: batch2 },
    { label: 'Dense Lower Sky Flow Tiling', marks: batch3 },
    { label: 'Cosmic Swirl Vortices', marks: batch4 },
    { label: 'Stars & Moon Radiance', marks: batch5 },
    { label: 'Alpilles Mountains Ridges', marks: batch6 },
    { label: 'Foothills & Ochre Fields', marks: batch7 },
    { label: 'Olive Groves & Valley Floor Tiling', marks: batch8 },
    { label: 'Village & Church Spire', marks: batch9 },
    { label: 'Cypress Shadow Flame Mass', marks: batch10 },
    { label: 'Cypress Midtone Flame & Spires', marks: batch11 },
    { label: 'Cypress Highlights & Sky Sparkles', marks: batch12 },
  ]

  return {
    title: 'Nocturne with Swirling Sky and Cypress',
    slug: 'starry-cypress',
    artist: 'Vincent van Gogh (Post-Impressionism, 1889)',
    brief: 'A post-impressionist nocturnal landscape rendered in thick, directional oil impasto. Energetic curved strokes follow the cosmic spiral currents, concentric planetary star halos, radiant crescent moon, undulating Alpilles ridges, and a flame-like cypress surging into the night.',
    style: 'Post-Impressionism in the manner of Vincent van Gogh. Rhythmic directional impasto brushwork, high-voltage complementary harmony of deep ultramarine, cobalt, and glowing chrome yellow, dynamic spiral vortex currents, and an expressive, surging cypress tree.',
    description: 'A colossal flame-like cypress rising into a tumultuous swirling night sky with eleven glowing stars, a crescent moon, and the village of Saint-Rémy nestled beneath the Alpilles.',
    batches,
  }
}

if (process.argv[1]?.endsWith('generate-vangogh.ts')) {
  const piece = createStarryCypress()
  const stats = validatePiece(piece)
  const jsonPath = path.resolve('src/studio/examples/starry-cypress.json')
  fs.writeFileSync(jsonPath, JSON.stringify(piece, null, 2))
  const renderPath = path.resolve('renders/starry-cypress.png')
  renderPiece(piece, renderPath)
  console.log(`Starry Cypress: ${stats.totalMarks} marks in ${stats.batchCount} batches`)
}
