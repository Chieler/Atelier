import { z } from 'zod'

const number = z.number().finite().min(-2000).max(3000)
const color = z
  .string()
  .regex(
    /^(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|none)$/,
  )
export const markSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
    type: z.enum(['path', 'rect', 'ellipse', 'line', 'text']),
    layer: z.number().finite().min(0).max(99),
    fill: color.default('none'),
    stroke: color.default('none'),
    strokeWidth: z.number().min(0).max(100).default(1),
    opacity: z.number().min(0).max(1).default(1),
    brush: z.object({
      preset: z.enum([
        'wet-wash',
        'dry-brush',
        'pigment-bleed',
        'oil',
        'gouache',
        'ink',
        'pastel',
        'charcoal',
      ]),
      seed: z.number().int().min(0).max(2147483647),
    }).strict().optional(),
    x: number.default(0),
    y: number.default(0),
    width: z.number().min(0).max(2000).default(0),
    height: z.number().min(0).max(2000).default(0),
    x2: number.default(0),
    y2: number.default(0),
    d: z
      .string()
      .max(12000)
    .regex(/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+ \t\r\n-]*$/)
      .default(''),
  text: z.string().max(300).refine(value => Array.from(value).every(char => {
    const point = char.codePointAt(0)!
    return point === 9 || point === 10 || point === 13 ||
      (point >= 32 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) && point !== 0xfffe && point !== 0xffff)
  }), 'Text must contain valid XML characters').default(''),
    fontSize: z.number().min(4).max(150).default(24),
  })
  .strict()
export type Mark = z.infer<typeof markSchema>
const put = z.object({ op: z.literal('put'), mark: markSchema }).strict()
const remove = z.object({ op: z.literal('delete'), id: z.string().max(80) }).strict()
const clear = z.object({ op: z.literal('clear') }).strict()
const restore = z.object({ op: z.literal('restore'), clearId: z.string().min(1).max(100) }).strict()
export const paintBatchSchema = z.array(z.discriminatedUnion('op', [put, remove])).min(1).max(50)
export const operationSchema = z.discriminatedUnion('op', [put, remove, clear, restore])
export const batchSchema = z.array(operationSchema).min(1).max(50).refine(
  operations => operations.length === 1 || operations.every(op => op.op === 'put' || op.op === 'delete'),
  'A clear or restore must be its own revision',
)
export type Operation = z.infer<typeof operationSchema>
export type StudioRoom = { title: string; brief: string; style: string }
export type DrawingBatch = { roomId: string; label: string; operations: string }
export type Message = { roomId: string; body: string }
export type Envelope<T> = {
  recordId: string
  data: T
  createdAt: string | number
  createdBy?: string
}

export function readOperations(batch: Envelope<DrawingBatch>): Operation[] {
  try {
    const parsed = batchSchema.safeParse(JSON.parse(batch.data.operations))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export function historyOperation(batch: Envelope<DrawingBatch>) {
  const [operation] = readOperations(batch)
  if (operation?.op === 'clear' || operation?.op === 'restore') return operation
}

export function ordered<T>(records: Envelope<T>[]): Envelope<T>[] {
  return [...records].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
      a.recordId.localeCompare(b.recordId),
  )
}
export function replay(
  batches: Envelope<DrawingBatch>[],
  count = batches.length,
  visibleOperations?: ReadonlyMap<string, number>,
): Mark[] {
  const marks = new Map<string, Mark>()
  const cleared = new Map<string, Map<string, Mark>>()
  for (const batch of ordered(batches).slice(0, count)) {
    const operations = readOperations(batch)
    const limit = visibleOperations ? visibleOperations.get(batch.recordId) ?? 0 : operations.length
    for (const operation of operations.slice(0, limit)) {
      switch (operation.op) {
        case 'put':
          marks.set(operation.mark.id, operation.mark)
          break
        case 'delete':
          marks.delete(operation.id)
          for (const snapshot of cleared.values()) snapshot.delete(operation.id)
          break
        case 'clear':
          cleared.set(batch.recordId, new Map(marks))
          marks.clear()
          break
        case 'restore':
          for (const [id, mark] of cleared.get(operation.clearId) ?? []) {
            if (!marks.has(id)) marks.set(id, mark)
          }
          break
      }
    }
  }
  return [...marks.values()].sort(
    (a, b) => a.layer - b.layer || a.id.localeCompare(b.id),
  )
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[char]!,
  )
export function svg(marks: Mark[]): string {
  const definedFilters = new Set<string>()
  // Each filter use rasterizes the whole canvas, so consecutive media-brush marks with the
  // same preset and layer share one filtered group instead of one pass per stroke.
  const out: string[] = []
  type Group = { key: string; brush: NonNullable<Mark['brush']>; shapes: string[] }
  let group = null as Group | null
  const flush = () => {
    if (group) out.push(mediaFilter(group.brush, group.shapes.join(''), definedFilters))
    group = null
  }
  for (const mark of marks) {
    const m = markSchema.parse(mark)
    const shape = markShape(m)
    if (m.brush && !watercolorPresets.has(m.brush.preset)) {
      const key = `${m.brush.preset}:${m.layer}`
      if ((group as Group | null)?.key !== key) flush()
      group ??= { key, brush: m.brush, shapes: [] }
      group.shapes.push(shape)
      continue
    }
    flush()
    out.push(m.brush ? watercolor(m.id, m.brush, shape) : shape)
  }
  flush()
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><rect width="1000" height="700" fill="#f8f3e8"/>${out.join('')}</svg>`
}

const watercolorPresets = new Set(['wet-wash', 'dry-brush', 'pigment-bleed'])

function markShape(m: Mark): string {
  const common = `fill="${m.fill}" stroke="${m.stroke}" stroke-width="${m.strokeWidth}" opacity="${m.opacity}" stroke-linecap="round" stroke-linejoin="round"`
  switch (m.type) {
    case 'path': return `<path ${common} d="${m.d}"/>`
    case 'rect': return `<rect ${common} x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}"/>`
    case 'ellipse': return `<ellipse ${common} cx="${m.x}" cy="${m.y}" rx="${m.width / 2}" ry="${m.height / 2}"/>`
    case 'line': return `<line ${common} x1="${m.x}" y1="${m.y}" x2="${m.x2}" y2="${m.y2}"/>`
    case 'text': return `<text ${common} x="${m.x}" y="${m.y}" font-size="${m.fontSize}" font-family="serif">${escape(m.text)}</text>`
  }
}

function watercolor(id: string, brush: NonNullable<Mark['brush']>, shape: string) {
  const filterId = `watercolor-${id}`
  const seed = (brush.seed % 2147483646) + 1
  const dry = brush.preset === 'dry-brush'
  const bleed = brush.preset === 'pigment-bleed'
  const scale = dry ? 3 : bleed ? 16 : 8
  const pigment = dry
    ? '<feComponentTransfer in="noise" result="tooth"><feFuncA type="linear" slope="4" intercept="-1.5"/></feComponentTransfer><feComposite in="edge" in2="tooth" operator="in"/>'
    : `<feGaussianBlur in="edge" stdDeviation="${bleed ? 2.4 : 1.2}" result="spread"/><feComponentTransfer in="spread" result="wash"><feFuncA type="linear" slope="${bleed ? 0.72 : 0.5}"/></feComponentTransfer><feBlend in="edge" in2="wash" mode="multiply"/>`
  return `<defs><filter id="${filterId}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1040" height="740" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${dry ? '0.17 0.65' : '0.06'}" numOctaves="2" seed="${seed}" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="edge"/>${pigment}</filter></defs><g filter="url(#${filterId})" style="mix-blend-mode:multiply" opacity="${dry ? 0.92 : bleed ? 0.8 : 0.68}">${shape}</g>`
}

function mediaFilter(
  brush: NonNullable<Mark['brush']>,
  shape: string,
  definedFilters: Set<string>,
): string {
  const variant = (brush.seed % 16) + 1
  const filterId = `brush-${brush.preset}-${variant}`
  let defs = ''

  if (!definedFilters.has(filterId)) {
    definedFilters.add(filterId)
    const content = getMediaPresetFilter(brush.preset, variant)
    defs = `<defs><filter id="${filterId}" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1040" height="740" color-interpolation-filters="sRGB">${content}</filter></defs>`
  }

  return `${defs}<g filter="url(#${filterId})">${shape}</g>`
}

function getMediaPresetFilter(preset: string, seed: number): string {
  switch (preset) {
    case 'oil':
      return `<feTurbulence type="fractalNoise" baseFrequency="0.035 0.14" numOctaves="3" seed="${seed}" result="bristles"/><feDisplacementMap in="SourceGraphic" in2="bristles" scale="3.2" xChannelSelector="R" yChannelSelector="G" result="displaced"/><feColorMatrix in="bristles" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="bump"/><feDiffuseLighting in="bump" lighting-color="#ffffff" surfaceScale="2.4" diffuseConstant="1.1" result="diffuse"><feDistantLight azimuth="55" elevation="52"/></feDiffuseLighting><feSpecularLighting in="bump" lighting-color="#ffffff" surfaceScale="1.9" specularConstant="0.5" specularExponent="24" result="spec"><feDistantLight azimuth="55" elevation="52"/></feSpecularLighting><feComposite in="displaced" in2="diffuse" operator="arithmetic" k1="1.12" k2="0.03" k3="0" k4="0" result="lit"/><feComposite in="lit" in2="spec" operator="arithmetic" k1="0" k2="1" k3="0.30" k4="0" result="textured"/><feComposite in="textured" in2="displaced" operator="in"/>`

    case 'gouache':
      return `<feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="3" seed="${seed}" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="2.8" xChannelSelector="R" yChannelSelector="G" result="chalkEdge"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="chalkBump"/><feDiffuseLighting in="chalkBump" lighting-color="#ffffff" surfaceScale="0.75" diffuseConstant="0.95" result="matteLight"><feDistantLight azimuth="120" elevation="62"/></feDiffuseLighting><feComposite in="chalkEdge" in2="matteLight" operator="arithmetic" k1="0.88" k2="0.16" k3="0" k4="0" result="mattePaint"/><feComposite in="mattePaint" in2="chalkEdge" operator="in"/>`

    case 'ink':
      return `<feTurbulence type="fractalNoise" baseFrequency="0.025 0.32" numOctaves="3" seed="${seed}" result="hairStreaks"/><feColorMatrix in="hairStreaks" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="monoStreaks"/><feDisplacementMap in="SourceGraphic" in2="hairStreaks" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="streakDisplaced"/><feTurbulence type="fractalNoise" baseFrequency="0.22 0.22" numOctaves="2" seed="${seed + 1}" result="paperGrain"/><feDisplacementMap in="streakDisplaced" in2="paperGrain" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="roughEdge"/><feGaussianBlur in="roughEdge" stdDeviation="0.45" result="softBleed"/><feComponentTransfer in="monoStreaks" result="inkTone"><feFuncR type="linear" slope="0.88" intercept="0.12"/><feFuncG type="linear" slope="0.88" intercept="0.12"/><feFuncB type="linear" slope="0.88" intercept="0.12"/></feComponentTransfer><feComposite in="roughEdge" in2="inkTone" operator="arithmetic" k1="0.94" k2="0.06" k3="0" k4="0" result="tonedInk"/><feComponentTransfer in="paperGrain" result="washGrain"><feFuncA type="linear" slope="2.4" intercept="-0.28"/></feComponentTransfer><feComposite in="tonedInk" in2="washGrain" operator="in" result="sumiBody"/><feMerge><feMergeNode in="softBleed"/><feMergeNode in="sumiBody"/></feMerge>`

    case 'pastel':
    case 'charcoal':
      return `<feTurbulence type="fractalNoise" baseFrequency="0.16 0.36" numOctaves="3" seed="${seed}" result="toothNoise"/><feColorMatrix in="toothNoise" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="monoTooth"/><feDisplacementMap in="SourceGraphic" in2="toothNoise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="displacedChalk"/><feComponentTransfer in="monoTooth" result="paperPeaks"><feFuncA type="linear" slope="2.2" intercept="-0.12"/></feComponentTransfer><feComposite in="displacedChalk" in2="paperPeaks" operator="in" result="chalkOnPaper"/><feDiffuseLighting in="monoTooth" lighting-color="#ffffff" surfaceScale="0.7" diffuseConstant="1.0" result="ribShade"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting><feComposite in="chalkOnPaper" in2="ribShade" operator="arithmetic" k1="0.94" k2="0.08" k3="0" k4="0" result="shadedChalk"/><feGaussianBlur in="shadedChalk" stdDeviation="0.2" result="softChalk"/><feComposite in="softChalk" in2="chalkOnPaper" operator="in"/>`

    default:
      return ''
  }
}
