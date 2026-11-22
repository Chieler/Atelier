import fs from 'node:fs'
import path from 'node:path'
import { renderPiece, validatePiece, type Piece } from './render-piece.ts'
import type { Mark } from '../src/studio/model.ts'

export function createShanShui(): Piece {
  // Batch 1: Ground - Atmospheric silk tone, misty void & distant mountain silhouettes
  const batch1: Mark[] = [
    {
      id: 'shanshui-silk-wash',
      type: 'rect',
      layer: 1,
      x: 0, y: 0, width: 1000, height: 700,
      fill: '#f4efe4',
      stroke: 'none', strokeWidth: 0, opacity: 0.65,
      brush: { preset: 'wet-wash', seed: 33101 },
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    },
    {
      id: 'shanshui-far-peak-left',
      type: 'path',
      layer: 2,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 140 320 L 170 190 L 210 110 L 240 130 L 270 220 L 320 180 L 360 250 L 410 330 C 310 350 200 340 140 320 Z',
      fill: '#bcb8ad',
      stroke: 'none', strokeWidth: 0, opacity: 0.45,
      brush: { preset: 'pigment-bleed', seed: 33102 },
    },
    {
      id: 'shanshui-far-peak-center',
      type: 'path',
      layer: 2,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 350 290 L 410 150 L 440 70 L 470 90 L 510 180 L 550 140 L 590 230 L 640 320 C 530 340 430 320 350 290 Z',
      fill: '#aba69a',
      stroke: 'none', strokeWidth: 0, opacity: 0.5,
      brush: { preset: 'pigment-bleed', seed: 33103 },
    },
    {
      id: 'shanshui-mist-belt',
      type: 'path',
      layer: 3,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 0 280 C 260 240 520 310 780 260 C 890 240 960 260 1000 250 L 1000 420 C 720 460 380 400 0 440 Z',
      fill: '#f6f1e6',
      stroke: 'none', strokeWidth: 0, opacity: 0.75,
      brush: { preset: 'pigment-bleed', seed: 33104 },
    },
  ]

  // Batch 2: Big Shapes - Towering Mid-ground Crags, Cleft Ravine & Cascading Waterfall
  const batch2: Mark[] = [
    {
      id: 'shanshui-cliff-left-mass',
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 120 540 L 150 410 L 200 310 L 240 280 L 270 340 L 310 440 L 280 550 Z',
      fill: '#5e5a52',
      stroke: 'none', strokeWidth: 0, opacity: 0.8,
      brush: { preset: 'pigment-bleed', seed: 33105 },
    },
    {
      id: 'shanshui-central-karst-mass',
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 280 520 L 320 360 L 350 240 L 380 200 L 410 240 L 440 380 L 430 510 Z',
      fill: '#4f4b43',
      stroke: 'none', strokeWidth: 0, opacity: 0.85,
      brush: { preset: 'pigment-bleed', seed: 33106 },
    },
    {
      id: 'shanshui-right-karst-mass',
      type: 'path',
      layer: 6,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 460 510 L 480 320 L 510 210 L 540 180 L 570 230 L 610 350 L 640 490 Z',
      fill: '#46423a',
      stroke: 'none', strokeWidth: 0, opacity: 0.85,
      brush: { preset: 'pigment-bleed', seed: 33107 },
    },
    // Waterfall cascades
    {
      id: 'shanshui-cascade-thread-1',
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 440 250 Q 444 310 442 360 Q 446 410 443 470',
      fill: 'none', stroke: '#fcfaf2', strokeWidth: 3.5, opacity: 0.95,
    },
    {
      id: 'shanshui-cascade-thread-2',
      type: 'path',
      layer: 8,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 445 270 Q 448 330 447 390 Q 450 430 448 475',
      fill: 'none', stroke: '#fcfaf2', strokeWidth: 2.5, opacity: 0.95,
    },
    {
      id: 'shanshui-pool-spray',
      type: 'ellipse',
      layer: 9,
      x: 446, y: 475, width: 70, height: 26,
      fill: '#fcfbf7', stroke: 'none', strokeWidth: 0, opacity: 0.85,
      brush: { preset: 'pigment-bleed', seed: 33108 },
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    },
  ]

  // Batch 3: Midtones - Foreground Rocky Bluff, Rock Contours & Scholar Pavilion
  const batch3: Mark[] = [
    {
      id: 'shanshui-fore-bluff-mass',
      type: 'path',
      layer: 12,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 540 700 L 550 560 C 570 510 630 495 700 500 C 760 505 800 465 850 470 L 930 500 L 1000 520 L 1000 700 Z',
      fill: '#2b2924',
      stroke: 'none', strokeWidth: 0, opacity: 0.92,
    },
    {
      id: 'shanshui-fore-left-shore',
      type: 'path',
      layer: 12,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: 'M 0 630 C 130 620 250 635 340 670 L 360 700 L 0 700 Z',
      fill: '#38352e',
      stroke: 'none', strokeWidth: 0, opacity: 0.88,
    },
  ]

  const rockContourLines = [
    { d: 'M 350 240 L 375 205 L 405 240 L 415 310 L 435 380', w: 3 },
    { d: 'M 320 360 L 345 320 L 370 340 L 390 420', w: 2.5 },
    { d: 'M 510 210 L 535 185 L 565 225 L 585 310', w: 3 },
    { d: 'M 480 320 L 505 280 L 535 305 L 555 400', w: 2.5 },
    { d: 'M 550 560 L 595 520 L 655 535 L 700 490', w: 3.5 },
    { d: 'M 700 490 L 755 480 L 800 455 L 850 460', w: 3.5 },
    { d: 'M 600 580 L 650 630', w: 3 },
    { d: 'M 680 550 L 740 600', w: 3 },
    { d: 'M 760 520 L 820 570', w: 3 },
  ]
  rockContourLines.forEach((rc, rIdx) => {
    batch3.push({
      id: `shanshui-rock-contour-${rIdx + 1}`,
      type: 'path',
      layer: 14,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: rc.d,
      fill: 'none', stroke: '#151412', strokeWidth: rc.w, opacity: 0.95,
    })
  })

  // Pavilion nestled on the cliff ledge
  batch3.push({
    id: 'shanshui-pavilion-roof',
    type: 'path',
    layer: 16,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 830 455 C 845 450 865 437 875 430 C 885 437 905 450 920 455 L 910 460 C 895 457 875 455 875 455 C 875 455 855 457 840 460 Z',
    fill: '#1c1b18', stroke: '#151412', strokeWidth: 1.5, opacity: 0.95,
  })
  batch3.push({
    id: 'shanshui-pavilion-pillar-1',
    type: 'line',
    layer: 16,
    x: 855, y: 457, x2: 855, y2: 477,
    stroke: '#151412', strokeWidth: 2, opacity: 0.95,
    fill: 'none', width: 0, height: 0, d: '', text: '', fontSize: 24,
  })
  batch3.push({
    id: 'shanshui-pavilion-pillar-2',
    type: 'line',
    layer: 16,
    x: 895, y: 457, x2: 895, y2: 477,
    stroke: '#151412', strokeWidth: 2, opacity: 0.95,
    fill: 'none', width: 0, height: 0, d: '', text: '', fontSize: 24,
  })
  batch3.push({
    id: 'shanshui-pavilion-floor',
    type: 'line',
    layer: 16,
    x: 845, y: 477, x2: 905, y2: 477,
    stroke: '#151412', strokeWidth: 2.5, opacity: 0.95,
    fill: 'none', width: 0, height: 0, d: '', text: '', fontSize: 24,
  })

  // Batch 4: Details - Ancient Gnarled Pine Leaning over Ravine & Calligraphic Needles
  const batch4: Mark[] = []
  // Pine roots grasping the crag and trunk reaching out over the ravine
  batch4.push({
    id: 'shanshui-pine-roots',
    type: 'path',
    layer: 19,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 720 520 L 680 495 L 650 515 M 680 495 L 670 540',
    fill: 'none', stroke: '#151411', strokeWidth: 6, opacity: 0.96,
  })
  // Trunk ascends with jagged, vigorous calligraphic twists
  batch4.push({
    id: 'shanshui-pine-trunk-seg1',
    type: 'path',
    layer: 20,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 680 495 Q 640 460 590 445',
    fill: 'none', stroke: '#151411', strokeWidth: 11, opacity: 0.96,
  })
  batch4.push({
    id: 'shanshui-pine-trunk-seg2',
    type: 'path',
    layer: 20,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 590 445 Q 560 410 575 365',
    fill: 'none', stroke: '#151411', strokeWidth: 8.5, opacity: 0.96,
  })
  batch4.push({
    id: 'shanshui-pine-trunk-seg3',
    type: 'path',
    layer: 20,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 575 365 Q 610 330 655 305',
    fill: 'none', stroke: '#151411', strokeWidth: 6.5, opacity: 0.96,
  })

  // Sweeping branches
  batch4.push({
    id: 'shanshui-branch-droop-left',
    type: 'path',
    layer: 21,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 590 445 Q 520 440 450 460 Q 390 475 340 500',
    fill: 'none', stroke: '#181613', strokeWidth: 5, opacity: 0.94,
  })
  batch4.push({
    id: 'shanshui-branch-mid-canopy',
    type: 'path',
    layer: 21,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 575 365 Q 515 350 460 365',
    fill: 'none', stroke: '#181613', strokeWidth: 4.5, opacity: 0.94,
  })
  batch4.push({
    id: 'shanshui-branch-top-canopy',
    type: 'path',
    layer: 21,
    x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
    d: 'M 655 305 Q 710 300 760 320',
    fill: 'none', stroke: '#181613', strokeWidth: 4, opacity: 0.94,
  })

  // Needle fan clusters
  const needleClusters = [
    { cx: 340, cy: 500, w: 46, h: 24 }, { cx: 390, cy: 475, w: 50, h: 26 }, { cx: 450, cy: 455, w: 54, h: 28 },
    { cx: 510, cy: 440, w: 56, h: 28 }, { cx: 460, cy: 365, w: 52, h: 26 }, { cx: 515, cy: 350, w: 56, h: 28 },
    { cx: 565, cy: 335, w: 60, h: 30 }, { cx: 615, cy: 310, w: 62, h: 32 }, { cx: 665, cy: 295, w: 62, h: 32 },
    { cx: 720, cy: 305, w: 58, h: 30 }, { cx: 765, cy: 320, w: 52, h: 26 },
  ]
  needleClusters.forEach((cl, cIdx) => {
    batch4.push({
      id: `shanshui-pine-fan-${cIdx + 1}`,
      type: 'ellipse',
      layer: 23,
      x: cl.cx, y: cl.cy, width: cl.w, height: cl.h,
      fill: '#1a1f18', stroke: '#11150f', strokeWidth: 1.5, opacity: 0.94,
      brush: { preset: 'dry-brush', seed: 33140 + cIdx },
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    })
  })

  // Wild geese
  const geese = [
    { x: 190, y: 140 }, { x: 215, y: 132 }, { x: 235, y: 142 }, { x: 255, y: 135 }, { x: 275, y: 146 }
  ]
  geese.forEach((g, gIdx) => {
    batch4.push({
      id: `shanshui-wild-goose-${gIdx + 1}`,
      type: 'path',
      layer: 25,
      x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0, text: '', fontSize: 24,
      d: `M ${g.x - 7} ${g.y + 2} Q ${g.x - 3} ${g.y - 4} ${g.x} ${g.y} Q ${g.x + 3} ${g.y - 4} ${g.x + 7} ${g.y + 2}`,
      fill: 'none', stroke: '#2e2c26', strokeWidth: 1.6, opacity: 0.8,
    })
  })

  // Batch 5: Accents - Calligraphic Moss Dots & Vermilion Seal Mark
  const batch5: Mark[] = []
  const mossDots = [
    { x: 550, y: 550, s: 8 }, { x: 570, y: 535, s: 9 }, { x: 590, y: 540, s: 7 },
    { x: 640, y: 500, s: 9 }, { x: 660, y: 495, s: 10 }, { x: 690, y: 485, s: 8 },
    { x: 750, y: 472, s: 9 }, { x: 775, y: 468, s: 10 }, { x: 800, y: 465, s: 8 },
    { x: 825, y: 472, s: 9 }, { x: 850, y: 480, s: 8 },
  ]
  mossDots.forEach((md, mIdx) => {
    batch5.push({
      id: `shanshui-moss-dot-${mIdx + 1}`,
      type: 'ellipse',
      layer: 26,
      x: md.x, y: md.y, width: md.s, height: md.s * 0.75,
      fill: '#0f0e0b', stroke: 'none', strokeWidth: 0, opacity: 0.96,
      x2: 0, y2: 0, d: '', text: '', fontSize: 24,
    })
  })

  // Vermilion red artist seal
  batch5.push({
    id: 'shanshui-seal-border',
    type: 'rect',
    layer: 30,
    x: 885, y: 55, width: 60, height: 60,
    fill: '#b82323', stroke: '#851212', strokeWidth: 2, opacity: 0.94,
    x2: 0, y2: 0, d: '', text: '', fontSize: 24,
  })
  batch5.push({
    id: 'shanshui-seal-text-top',
    type: 'text',
    layer: 31,
    x: 893, y: 82,
    text: '松濤',
    fontSize: 20,
    fill: '#fcfaf2',
    stroke: 'none', strokeWidth: 0, opacity: 0.96,
    width: 0, height: 0, x2: 0, y2: 0, d: '',
  })
  batch5.push({
    id: 'shanshui-seal-text-bot',
    type: 'text',
    layer: 31,
    x: 893, y: 106,
    text: '山水',
    fontSize: 20,
    fill: '#fcfaf2',
    stroke: 'none', strokeWidth: 0, opacity: 0.96,
    width: 0, height: 0, x2: 0, y2: 0, d: '',
  })

  return {
    slug: 'shan-shui',
    title: 'Misty Peaks and Gnarled Mountain Pine',
    brief: 'A classical Chinese ink-wash shan shui landscape featuring towering jagged karst crags, a cascading waterfall, a scholar pavilion, an ancient twisted pine, and a vermilion seal.',
    style: 'Traditional Chinese Shan Shui ink-and-wash painting (山水画). Five ink tones (五墨), expansive misty negative space (留白), axe-cut rock fractures (斧劈皴), calligraphic pine needle fans, moss dotting (苔点), and a carved vermilion seal mark.',
    batches: [
      { label: 'Atmospheric mist and distant mountain washes', marks: batch1 },
      { label: 'Jagged karst crags and cascading waterfall', marks: batch2 },
      { label: 'Foreground bluff, axe-cut rock and pavilion', marks: batch3 },
      { label: 'Ancient gnarled pine and calligraphic needles', marks: batch4 },
      { label: 'Calligraphic moss dots and vermilion seal', marks: batch5 },
    ],
  }
}

const p = createShanShui()
const stats = validatePiece(p)
renderPiece(p, path.resolve('renders/shan-shui.png'))
console.log(`Shan Shui Final: ${stats.totalMarks} marks in ${stats.batchCount} batches`)
fs.writeFileSync('src/studio/examples/shan-shui.json', JSON.stringify(p, null, 2), 'utf8')
