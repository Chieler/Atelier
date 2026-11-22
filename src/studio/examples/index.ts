import { markSchema, type Mark, type StudioRoom } from '../model'

export type Example = StudioRoom & {
  slug: string
  batches: { label: string; marks: Mark[] }[]
}

const files = import.meta.glob<Example>('./*.json', { eager: true, import: 'default' })
const order = [
  'hibiscus',
  'lemons',
  'harbor',
  'koi',
  'monet-poplars',
  'cubist-guitar',
  'shan-shui',
  'starry-cypress',
  'kandinsky-harmony',
  'art-nouveau-peacock',
]

/** Curated showcase pieces, validated at load so a bad file fails loudly in dev. */
export const examples: Example[] = Object.values(files)
  .map((file) => ({
    ...file,
    batches: file.batches.map((b) => ({ ...b, marks: b.marks.map((m) => markSchema.parse(m)) })),
  }))
  .sort((a, b) => (order.indexOf(a.slug) + 1 || 99) - (order.indexOf(b.slug) + 1 || 99))

/** Pre-rendered by scripts/render-thumbs.ts; live SVG is too slow for a grid of these. */
export const exampleImage = (example: Example) => `/examples/${example.slug}.jpg`
