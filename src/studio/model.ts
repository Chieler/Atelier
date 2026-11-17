import { z } from 'zod'

const number = z.number().finite().min(-2000).max(3000)
const color = z.string().regex(/^(#[0-9a-fA-F]{3,8}|none)$/)
export const markSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  type: z.enum(['path', 'rect', 'ellipse', 'line', 'text']),
  layer: z.number().int().min(0).max(99),
  fill: color.default('none'), stroke: color.default('none'),
  strokeWidth: z.number().min(0).max(100).default(1),
  opacity: z.number().min(0).max(1).default(1),
  x: number.default(0), y: number.default(0),
  width: z.number().min(0).max(2000).default(0),
  height: z.number().min(0).max(2000).default(0),
  x2: number.default(0), y2: number.default(0),
  d: z.string().max(12000).regex(/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\s-]*$/).default(''),
  text: z.string().max(300).default(''),
  fontSize: z.number().min(4).max(150).default(24),
}).strict()
export type Mark = z.infer<typeof markSchema>
export const operationSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('put'), mark: markSchema }).strict(),
  z.object({ op: z.literal('delete'), id: z.string().max(80) }).strict(),
])
export const batchSchema = z.array(operationSchema).min(1).max(50)
export type Operation = z.infer<typeof operationSchema>
export type StudioRoom = { title: string; brief: string; style: string }
export type DrawingBatch = { roomId: string; label: string; operations: string }
export type Message = { roomId: string; body: string }
export type Envelope<T> = { recordId: string; data: T; createdAt: number; ownerId?: string }

export function ordered<T>(records: Envelope<T>[]): Envelope<T>[] {
  return [...records].sort((a,b) => a.createdAt - b.createdAt || a.recordId.localeCompare(b.recordId))
}
export function replay(batches: Envelope<DrawingBatch>[], count = batches.length): Mark[] {
  const marks = new Map<string, Mark>()
  for (const batch of ordered(batches).slice(0,count)) {
    try {
      const result = batchSchema.safeParse(JSON.parse(batch.data.operations))
      if (!result.success) continue
      for (const operation of result.data) {
        if (operation.op === 'delete') marks.delete(operation.id)
        else marks.set(operation.mark.id, operation.mark)
      }
    } catch { /* Untrusted records never become markup. */ }
  }
  return [...marks.values()].sort((a,b) => a.layer-b.layer || a.id.localeCompare(b.id))
}
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!))
export function svg(marks: Mark[]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><rect width="1000" height="700" fill="#f8f3e8"/>${marks.map(mark => {
    const m = markSchema.parse(mark)
    const common = `fill="${m.fill}" stroke="${m.stroke}" stroke-width="${m.strokeWidth}" opacity="${m.opacity}" stroke-linecap="round" stroke-linejoin="round"`
    if(m.type==='path') return `<path ${common} d="${m.d}"/>`
    if(m.type==='rect') return `<rect ${common} x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}"/>`
    if(m.type==='ellipse') return `<ellipse ${common} cx="${m.x}" cy="${m.y}" rx="${m.width/2}" ry="${m.height/2}"/>`
    if(m.type==='line') return `<line ${common} x1="${m.x}" y1="${m.y}" x2="${m.x2}" y2="${m.y2}"/>`
    return `<text ${common} x="${m.x}" y="${m.y}" font-size="${m.fontSize}" font-family="serif">${escape(m.text)}</text>`
  }).join('')}</svg>`
}
