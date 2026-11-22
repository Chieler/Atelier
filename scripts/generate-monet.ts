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

// Generate an individual curved horizontal stroke (or slight angle)
function makeStrokePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curveAmount: number = 0,
): string {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const cx = mx + nx * curveAmount
  const cy = my + ny * curveAmount
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

// Vertical flickering comma stroke (virgule)
function makeVerticalComma(
  x: number,
  y: number,
  len: number,
  tiltX: number = 0,
  curve: number = 2,
): string {
  const x1 = x - tiltX / 2
  const y1 = y - len / 2
  const x2 = x + tiltX / 2
  const y2 = y + len / 2
  const cx = x + curve
  const cy = y
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

export function createMonetPoplars(): Piece {
  const rand = makeRandom(18910415)
  let markCounter = 0
  const nextId = (prefix: string) => `${prefix}-${++markCounter}`

  // 4 Stately Poplars along the Epte river bank
  const trees = [
    { x: 175, base: 412, top: 22, w: 140, sway: -16 },
    { x: 315, base: 402, top: 32, w: 125, sway: -10 },
    { x: 560, base: 422, top: 52, w: 110, sway: 14 },
    { x: 815, base: 414, top: 82, w: 92, sway: -8 },
  ]

  // =========================================================================
  // BATCH 1: Toned Imprimatura Ground & Atmospheric Value Block-in (30 marks)
  // =========================================================================
  const batch1: Mark[] = []

  // Warm toned canvas ground
  batch1.push({
    id: nextId('monet-ground-imprimatura'),
    type: 'rect',
    layer: 1,
    x: 0, y: 0, width: 1000, height: 700,
    fill: '#f5eee4',
    stroke: 'none', strokeWidth: 0, opacity: 0.98,
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  // Sky underpainting wash
  batch1.push({
    id: nextId('monet-sky-wash-zenith'),
    type: 'rect',
    layer: 2,
    x: 0, y: 0, width: 1000, height: 260,
    fill: '#b2d2f0',
    stroke: 'none', strokeWidth: 0, opacity: 0.88,
    brush: { preset: 'gouache', seed: 101 },
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })
  batch1.push({
    id: nextId('monet-sky-wash-horizon'),
    type: 'rect',
    layer: 2,
    x: 0, y: 220, width: 1000, height: 195,
    fill: '#f6e4cc',
    stroke: 'none', strokeWidth: 0, opacity: 0.85,
    brush: { preset: 'gouache', seed: 102 },
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  // River base wash
  batch1.push({
    id: nextId('monet-river-wash-base'),
    type: 'rect',
    layer: 2,
    x: 0, y: 405, width: 1000, height: 295,
    fill: '#1a3556',
    stroke: 'none', strokeWidth: 0, opacity: 0.92,
    brush: { preset: 'gouache', seed: 103 },
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })

  // Broad directional blending strokes
  const skyBlendTones = ['#9ec2ea', '#b4d2f0', '#cac2e5', '#f0dcbe', '#e2c6d4']
  for (let i = 0; i < 26; i++) {
    const y = 25 + (i / 26) * 360 + (rand() - 0.5) * 15
    const x = rand() * 860
    const len = 70 + rand() * 90
    batch1.push({
      id: nextId('monet-sky-blend-stroke'),
      type: 'path',
      layer: 3,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeStrokePath(x, y, x + len, y + (rand() - 0.5) * 6, (rand() - 0.5) * 4),
      fill: 'none',
      stroke: skyBlendTones[i % skyBlendTones.length],
      strokeWidth: 20 + rand() * 8,
      opacity: 0.85,
      brush: { preset: 'oil', seed: 110 + i },
    })
  }
  // Total Batch 1: 30 marks

  // Helper for generating edge-to-edge staggered brick impasto tiling
  function generateBrickTiling(
    layer: number,
    yMin: number,
    yMax: number,
    rows: number,
    cols: number,
    palette: string[],
    strokeW: number,
    strokeLenBase: number,
    subpathsPerMark: number,
    seedOffset: number,
    prefix: string,
  ): Mark[] {
    const marks: Mark[] = []
    const rowHeight = (yMax - yMin) / rows
    const colWidth = 1040 / cols
    for (let r = 0; r < rows; r++) {
      const rowY = yMin + r * rowHeight + rowHeight * 0.5
      // Stagger odd rows like bricks by half a column
      const rowXOffset = (r % 2 === 1 ? colWidth * 0.5 : 0) - 20
      for (let c = 0; c < cols; c++) {
        const cx = rowXOffset + c * colWidth + (rand() - 0.5) * (colWidth * 0.3)
        const cy = rowY + (rand() - 0.5) * (rowHeight * 0.3)
        const parts: string[] = []
        for (let s = 0; s < subpathsPerMark; s++) {
          const sx = cx + (rand() - 0.5) * (colWidth * 0.7)
          const sy = cy + (s - (subpathsPerMark - 1) / 2) * (rowHeight * 0.35) + (rand() - 0.5) * 4
          const len = strokeLenBase + rand() * (strokeLenBase * 0.5)
          const curve = (rand() - 0.5) * 3
          parts.push(makeStrokePath(sx - len / 2, sy, sx + len / 2, sy + (rand() - 0.5) * 3, curve))
        }
        marks.push({
          id: nextId(prefix),
          type: 'path',
          layer,
          x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
          d: parts.join(' '),
          fill: 'none',
          stroke: palette[Math.floor(rand() * palette.length)],
          strokeWidth: strokeW + rand() * 3.5,
          opacity: 0.93,
          brush: { preset: 'oil', seed: seedOffset + r * cols + c },
        })
      }
    }
    return marks
  }

  // =========================================================================
  // BATCH 2: Dense River Water Base Tiling (48 marks)
  // 6 rows x 8 cols = 48 marks. Completely coats y=415..700 in dense oil strokes.
  // =========================================================================
  const riverBaseTones = ['#152e4e', '#1c395f', '#244570', '#2d5382', '#366194', '#424a74', '#2d3862', '#385782', '#1a3052', '#4b5585']
  const batch2 = generateBrickTiling(
    4,
    416, 700,
    6, 8,
    riverBaseTones,
    14.0,
    55,
    5,
    200,
    'monet-water-tile',
  )
  // Total Batch 2: 48 marks

  // =========================================================================
  // BATCH 3: Dense Sky Zenith Tiling (48 marks)
  // 6 rows x 8 cols = 48 marks. Completely tiles upper sky y=0..165 edge-to-edge.
  // =========================================================================
  const zenithColors = ['#5a8dc4', '#6c9ed8', '#7faee0', '#8ebde6', '#9ea3d0', '#8eb3d8', '#b8cff0', '#ded6ee', '#b0c4de', '#a2bce2']
  const batch3 = generateBrickTiling(
    5,
    0, 165,
    6, 8,
    zenithColors,
    12.0,
    50,
    5,
    300,
    'monet-sky-zenith-tile',
  )
  // Total Batch 3: 48 marks

  // =========================================================================
  // BATCH 4: Dense Sky Mid-Atmosphere Tiling (48 marks)
  // 6 rows x 8 cols = 48 marks. Completely tiles mid-sky y=150..295 edge-to-edge.
  // =========================================================================
  const midSkyColors = ['#9ec0e6', '#b0c4ea', '#c2b8e2', '#d0bcdc', '#dfc4dc', '#ebd0dc', '#d8c8e8', '#e8d2e0', '#f0dcde', '#c6cee8']
  const batch4 = generateBrickTiling(
    6,
    150, 295,
    6, 8,
    midSkyColors,
    12.0,
    50,
    5,
    400,
    'monet-sky-mid-tile',
  )
  // Total Batch 4: 48 marks

  // =========================================================================
  // BATCH 5: Dense Sky Horizon Warm Radiance Tiling (48 marks)
  // 6 rows x 8 cols = 48 marks. Completely tiles horizon sky y=280..416 edge-to-edge.
  // =========================================================================
  const horizonColors = ['#faedd8', '#f8e0bc', '#f6d2ae', '#f5c0b6', '#ead0dc', '#f7de94', '#fdf5e4', '#f5cc98', '#ded2ee', '#f8e8ce']
  const batch5 = generateBrickTiling(
    7,
    280, 416,
    6, 8,
    horizonColors,
    12.0,
    50,
    5,
    500,
    'monet-sky-horizon-tile',
  )
  // Total Batch 5: 48 marks

  // =========================================================================
  // BATCH 6: Distant Misty Hills & Meadow Shoreline (48 marks)
  // =========================================================================
  const batch6: Mark[] = []
  // Distant low misty hills along horizon
  const hillTones = ['#756f91', '#627096', '#827ea0', '#566682', '#6b7968', '#897c94']
  for (let i = 0; i < 16; i++) {
    const x = (i / 16) * 1040 - 20
    const y = 370 + Math.sin(i * 0.45) * 12 + rand() * 8
    const len = 70 + rand() * 50
    batch6.push({
      id: nextId('monet-distant-hill'),
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeStrokePath(x, y, x + len, y + (rand() - 0.5) * 6, (rand() - 0.5) * 5),
      fill: 'none',
      stroke: hillTones[i % hillTones.length],
      strokeWidth: 18 + rand() * 8,
      opacity: 0.9,
      brush: { preset: 'oil', seed: 600 + i },
    })
  }

  // Riverbank meadow turf & wild grasses
  const bankTones = ['#44582d', '#5a6e35', '#71833c', '#897e42', '#524328', '#382f1e', '#a38d45', '#7a8e48']
  for (let i = 0; i < 18; i++) {
    const x = (i / 18) * 1040 - 20
    const curve = Math.sin((x / 1000) * Math.PI) * 14
    const y = 406 + curve + (rand() - 0.5) * 6
    const len = 65 + rand() * 45
    batch6.push({
      id: nextId('monet-shore-mass'),
      type: 'path',
      layer: 9,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeStrokePath(x, y, x + len, y + (rand() - 0.5) * 5, (rand() - 0.5) * 4),
      fill: 'none',
      stroke: bankTones[i % bankTones.length],
      strokeWidth: 16 + rand() * 8,
      opacity: 0.94,
      brush: { preset: 'oil', seed: 620 + i },
    })
  }

  // Wildflower accents
  const flowerTones = ['#b83828', '#c94a32', '#d99432', '#f2d64e', '#3c5825']
  for (let i = 0; i < 8; i++) {
    const x = 60 + i * 115 + (rand() - 0.5) * 40
    const curve = Math.sin((x / 1000) * Math.PI) * 14
    const y = 408 + curve + (rand() - 0.5) * 4
    batch6.push({
      id: nextId('monet-bank-wildflower'),
      type: 'path',
      layer: 10,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeStrokePath(x, y, x + 8 + rand() * 10, y - 4 - rand() * 5, 2),
      fill: 'none',
      stroke: flowerTones[i % flowerTones.length],
      strokeWidth: 5.0,
      opacity: 0.95,
      brush: { preset: 'oil', seed: 640 + i },
    })
  }

  // Shoreline water-edge shadow cut line
  for (let i = 0; i < 6; i++) {
    const x = i * 175 - 10
    const curve = Math.sin((x / 1000) * Math.PI) * 14
    batch6.push({
      id: nextId('monet-shore-shadow-cut'),
      type: 'path',
      layer: 10,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeStrokePath(x, 415 + curve, x + 190, 416 + curve, 0),
      fill: 'none',
      stroke: i % 2 === 0 ? '#1e141a' : '#162218',
      strokeWidth: 8 + rand() * 4,
      opacity: 0.92,
      brush: { preset: 'oil', seed: 650 + i },
    })
  }
  // Total Batch 6: 48 marks

  // =========================================================================
  // BATCH 7: Poplar Trunks & Structural Branches (36 marks)
  // =========================================================================
  const batch7: Mark[] = []
  const barkColors = ['#281e18', '#382b20', '#4a3828', '#5c4832', '#6e563e', '#7c6448', '#3e2e24']

  trees.forEach((t, tIdx) => {
    const trunkSegments = 7
    for (let s = 0; s < trunkSegments; s++) {
      const frac1 = s / trunkSegments
      const frac2 = (s + 1) / trunkSegments
      const y1 = t.base - frac1 * (t.base - t.top) * 0.72
      const y2 = t.base - frac2 * (t.base - t.top) * 0.72
      const sway1 = Math.sin(frac1 * Math.PI * 0.8) * t.sway
      const sway2 = Math.sin(frac2 * Math.PI * 0.8) * t.sway
      const x1 = t.x + sway1
      const x2 = t.x + sway2
      const width = (16 - frac1 * 10) * (t.w / 100)

      batch7.push({
        id: nextId(`monet-trunk-${tIdx}-${s}`),
        type: 'path',
        layer: 11,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: makeStrokePath(x1, y1, x2, y2, (rand() - 0.5) * 2),
        fill: 'none',
        stroke: barkColors[(s + tIdx) % barkColors.length],
        strokeWidth: width,
        opacity: 0.95,
        brush: { preset: 'oil', seed: 700 + tIdx * 10 + s },
      })
    }

    // Branch accents
    for (let b = 0; b < 2; b++) {
      const bFrac = 0.35 + b * 0.25
      const by = t.base - bFrac * (t.base - t.top) * 0.72
      const bx = t.x + Math.sin(bFrac * Math.PI * 0.8) * t.sway
      const side = b % 2 === 0 ? 1 : -1
      batch7.push({
        id: nextId(`monet-branch-${tIdx}-${b}`),
        type: 'path',
        layer: 11,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: makeStrokePath(bx, by, bx + side * 24, by - 30, side * 3),
        fill: 'none',
        stroke: barkColors[(b * 2) % barkColors.length],
        strokeWidth: 5.0,
        opacity: 0.92,
        brush: { preset: 'oil', seed: 750 + tIdx * 5 + b },
      })
    }
  })
  // Total Batch 7: 4 * 9 = 36 marks

  // Foliage Generator Helper for Batches 8, 9, 10
  function createFoliageBatch(
    layer: number,
    colorPalette: string[],
    xOffsetFactor: number,
    fracMin: number,
    fracMax: number,
    perTreeCount: number,
    lenBase: number,
    lenVar: number,
    subpathCount: number,
  ): Mark[] {
    const marks: Mark[] = []
    trees.forEach((t, tIdx) => {
      for (let i = 0; i < perTreeCount; i++) {
        const fracRaw = fracMin + (i / perTreeCount) * (fracMax - fracMin) + (rand() - 0.5) * 0.04
        const frac = Math.max(0.01, Math.min(0.99, fracRaw))
        const cy = t.base - frac * (t.base - t.top)
        const spineSway = Math.sin(frac * Math.PI * 0.8) * t.sway
        const spineX = t.x + spineSway

        // Stately, full tapering spire profile
        const widthProfile = Math.sin(frac * Math.PI * 0.9) * Math.pow(1 - frac * 0.75, 0.45)
        const localW = t.w * Math.max(0.12, widthProfile)
        const cx = spineX + xOffsetFactor * localW * 0.4 + (rand() - 0.5) * localW * 0.4

        const parts: string[] = []
        for (let s = 0; s < subpathCount; s++) {
          const px = cx + (rand() - 0.5) * (localW * 0.45)
          const py = cy + (rand() - 0.5) * 16
          const len = lenBase + rand() * lenVar
          const tilt = (rand() - 0.5) * 5
          const curve = (rand() - 0.5) * 4
          parts.push(makeVerticalComma(px, py, len, tilt, curve))
        }

        marks.push({
          id: nextId(`monet-foliage-L${layer}-${tIdx}-${i}`),
          type: 'path',
          layer,
          x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
          d: parts.join(' '),
          fill: 'none',
          stroke: colorPalette[Math.floor(rand() * colorPalette.length)],
          strokeWidth: 7.5 + rand() * 2.5,
          opacity: 0.95,
          brush: { preset: 'oil', seed: 800 + layer * 20 + tIdx * 15 + i },
        })
      }
    })
    return marks
  }

  // =========================================================================
  // BATCH 8: Poplar Foliage - Deep Shadow Spire Masses (48 marks)
  // =========================================================================
  const shadowFoliageColors = ['#0e2d1d', '#143823', '#192b31', '#20291a', '#281a2e', '#112720', '#16331d']
  const batch8 = createFoliageBatch(
    12,
    shadowFoliageColors,
    -0.35,
    0.01,
    0.85,
    12,
    20,
    8.0,
    6,
  )
  // Total Batch 8: 48 marks

  // =========================================================================
  // BATCH 9: Poplar Foliage - Midtone Billowing Comma Masses (48 marks)
  // =========================================================================
  const midtoneFoliageColors = ['#28521d', '#366327', '#457133', '#35582c', '#486f50', '#527734', '#63813e', '#325321']
  const batch9 = createFoliageBatch(
    13,
    midtoneFoliageColors,
    0.05,
    0.01,
    0.88,
    12,
    18,
    7.0,
    6,
  )
  // Total Batch 9: 48 marks

  // =========================================================================
  // BATCH 10: Poplar Foliage - Sunlit Apex & Golden Leaf Crowns (48 marks)
  // =========================================================================
  const sunlitFoliageColors = ['#e6cd32', '#9cc630', '#b4d33e', '#f2d860', '#ebb648', '#f2c583', '#d2e460', '#fce278']
  const batch10 = createFoliageBatch(
    14,
    sunlitFoliageColors,
    0.40,
    0.005,
    0.94,
    12,
    15,
    6.0,
    6,
  )
  // Total Batch 10: 48 marks

  // =========================================================================
  // BATCH 11: River Deep Poplar Tree Reflections (48 marks)
  // Vertical broken reflections in greens, viridians, and golds
  // =========================================================================
  const batch11: Mark[] = []
  const reflColors = ['#112e20', '#183c28', '#204630', '#2d522b', '#162a34', '#665625', '#3c6032', '#827228']
  trees.forEach((t, tIdx) => {
    for (let r = 0; r < 12; r++) {
      const frac = r / 12
      const cy = 418 + frac * 240 + (rand() - 0.5) * 10
      const cx = t.x + (rand() - 0.5) * t.w * (0.6 + frac * 0.7)
      const parts: string[] = []
      for (let d = 0; d < 6; d++) {
        const px = cx + (rand() - 0.5) * (t.w * 0.4)
        const py = cy + (rand() - 0.5) * 16
        parts.push(makeVerticalComma(px, py, 24 + rand() * 14, (rand() - 0.5) * 8, 5))
      }
      batch11.push({
        id: nextId(`monet-refl-spire-${tIdx}-${r}`),
        type: 'path',
        layer: 15,
        x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
        d: parts.join(' '),
        fill: 'none',
        stroke: reflColors[Math.floor(rand() * reflColors.length)],
        strokeWidth: 10.0 + rand() * 3.5,
        opacity: 0.94,
        brush: { preset: 'oil', seed: 900 + tIdx * 15 + r },
      })
    }
  })
  // Total Batch 11: 48 marks

  // =========================================================================
  // BATCH 12: River Horizontal Surface Ripples & Wave Sparkles (48 marks)
  // Slicing across reflections in blues, violets, rose, cream & impasto sparkles
  // =========================================================================
  const batch12: Mark[] = []
  const riverRippleColors = ['#366792', '#4979a5', '#6792b6', '#8ab0cc', '#c29cae', '#dec08d', '#f6edd0', '#e0c8d8', '#a8c2dc']
  for (let i = 0; i < 32; i++) {
    const y = 422 + (i / 32) * 265 + (rand() - 0.5) * 8
    const x = rand() * 860
    const len = 50 + rand() * 85
    batch12.push({
      id: nextId('monet-water-ripple'),
      type: 'path',
      layer: 16,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeStrokePath(x, y, x + len, y + (rand() - 0.5) * 3, (rand() - 0.5) * 2),
      fill: 'none',
      stroke: riverRippleColors[Math.floor(rand() * riverRippleColors.length)],
      strokeWidth: 8.0 + rand() * 3.0,
      opacity: 0.94,
      brush: { preset: 'oil', seed: 1000 + i },
    })
  }

  // Fluttering individual leaf flecks dancing into sky
  const fleckColors = ['#e8d23e', '#b8dd44', '#f8e06c', '#f5c688', '#9cd236']
  for (let i = 0; i < 10; i++) {
    const t = trees[i % trees.length]
    const fx = t.x + (t.w * 0.45) + (rand() - 0.5) * 25
    const fy = t.top + rand() * (t.base - t.top) * 0.6
    batch12.push({
      id: nextId('monet-leaf-fleck'),
      type: 'path',
      layer: 18,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeStrokePath(fx, fy, fx + 8 + rand() * 6, fy - 6 - rand() * 8, 3),
      fill: 'none',
      stroke: fleckColors[i % fleckColors.length],
      strokeWidth: 4.5,
      opacity: 0.95,
      brush: { preset: 'oil', seed: 1040 + i },
    })
  }

  // Brilliant wave-crest sparkles
  const sparkleColors = ['#ffffff', '#fff9e6', '#fef2cb', '#eff8ff']
  for (let i = 0; i < 6; i++) {
    const y = 435 + rand() * 240
    const x = 90 + rand() * 820
    const len = 16 + rand() * 22
    batch12.push({
      id: nextId('monet-water-sparkle-crest'),
      type: 'path',
      layer: 20,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: makeStrokePath(x, y, x + len, y, 0),
      fill: 'none',
      stroke: sparkleColors[i % sparkleColors.length],
      strokeWidth: 4.5,
      opacity: 0.98,
      brush: { preset: 'oil', seed: 1060 + i },
    })
  }
  // Total Batch 12: 48 marks

  const batches = [
    { label: 'Toned Ground & Washes', marks: batch1 },
    { label: 'Dense River Water Tiling', marks: batch2 },
    { label: 'Dense Sky Zenith Tiling', marks: batch3 },
    { label: 'Dense Sky Mid Tiling', marks: batch4 },
    { label: 'Dense Sky Horizon Tiling', marks: batch5 },
    { label: 'Distant Hills & Shoreline Meadow', marks: batch6 },
    { label: 'Poplar Trunks & Branches', marks: batch7 },
    { label: 'Poplar Foliage - Shadow Spire Masses', marks: batch8 },
    { label: 'Poplar Foliage - Midtone Billowing Masses', marks: batch9 },
    { label: 'Poplar Foliage - Sunlit Apex Crowns', marks: batch10 },
    { label: 'River Poplar Tree Reflections', marks: batch11 },
    { label: 'River Surface Ripples & Wave Sparkles', marks: batch12 },
  ]

  return {
    title: 'Poplars on the Epte',
    slug: 'monet-poplars',
    artist: 'Claude Monet (Impressionism, 1891)',
    brief: 'A shimmering plein-air impressionist study of tall poplars on the Epte curving along the riverbank in morning light, rendered with thousands of broken-color vertical comma strokes, optical color mixing, and rippling water reflections.',
    style: 'French Impressionism in the manner of Claude Monet. Broken color technique with small comma-like virgules, shimmering natural light, optical mixing of complementary tones, soft atmospheric envelope, and vertical poplar spires with rippling water reflections.',
    description: 'Four stately poplars on the Epte river bank in dense shimmering morning light with vertical flickering comma strokes and broken water reflections.',
    batches,
  }
}

if (process.argv[1]?.endsWith('generate-monet.ts')) {
  const piece = createMonetPoplars()
  const stats = validatePiece(piece)
  const jsonPath = path.resolve('src/studio/examples/monet-poplars.json')
  fs.writeFileSync(jsonPath, JSON.stringify(piece, null, 2))
  const renderPath = path.resolve('renders/monet-poplars.png')
  renderPiece(piece, renderPath)
  console.log(`Monet Poplars: ${stats.totalMarks} marks in ${stats.batchCount} batches`)
}
