import { describe, it, expect } from 'vitest'
import { batchSchema, markSchema, replay, svg } from './model'
describe('drawing protocol', () => {
  it('clears atomically and restores without replacing later strokes', () => {
    const put = (id: string, fill: string) => ({ op: 'put', mark: { id, fill, type: 'rect', layer: 0 } })
    const event = (recordId: string, createdAt: number, operations: unknown[]) => ({
      recordId, createdAt, data: { roomId: 'room', label: recordId, operations: JSON.stringify(operations) },
    })
    const history = [
      event('paint', 1, [put('a', '#123'), put('b', '#456')]),
      event('clear', 2, [{ op: 'clear' }]),
      event('new', 3, [put('a', '#987')]),
      event('undo', 4, [{ op: 'restore', clearId: 'clear' }]),
    ]
    expect(replay(history, 2)).toEqual([])
    expect(replay(history, 3).map(mark => mark.fill)).toEqual(['#987'])
    expect(replay(history).map(mark => mark.fill)).toEqual(['#987', '#456'])
    expect(batchSchema.safeParse([{ op: 'clear' }, put('c', '#fff')]).success).toBe(false)
  })

  it('exports deterministic watercolor with distinct seeded brush effects', () => {
    const base = { id: 'wash', type: 'path', layer: 1, stroke: '#456', d: 'M10 20 L80 90' }
    const wet = markSchema.parse({ ...base, brush: { preset: 'wet-wash', seed: 42 } })
    const dry = markSchema.parse({ ...base, brush: { preset: 'dry-brush', seed: 42 } })
    expect(svg([wet])).toBe(svg([markSchema.parse(wet)]))
    expect(svg([wet])).toContain('feDisplacementMap')
    expect(svg([wet])).not.toBe(svg([dry]))
    expect(svg([wet])).not.toBe(svg([{ ...wet, brush: { preset: 'wet-wash', seed: 43 } }]))
  })

  it('keeps legacy watercolor presets output 100% byte-for-byte unchanged', () => {
    const base = { id: 'test', type: 'path', layer: 1, stroke: '#336699', d: 'M10 20 L80 90' }
    const wet = markSchema.parse({ ...base, brush: { preset: 'wet-wash', seed: 42 } })
    const dry = markSchema.parse({ ...base, brush: { preset: 'dry-brush', seed: 42 } })
    const bleed = markSchema.parse({ ...base, brush: { preset: 'pigment-bleed', seed: 42 } })

    expect(svg([wet])).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><rect width="1000" height="700" fill="#f8f3e8"/><defs><filter id="watercolor-test" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1040" height="740" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="43" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" result="edge"/><feGaussianBlur in="edge" stdDeviation="1.2" result="spread"/><feComponentTransfer in="spread" result="wash"><feFuncA type="linear" slope="0.5"/></feComponentTransfer><feBlend in="edge" in2="wash" mode="multiply"/></filter></defs><g filter="url(#watercolor-test)" style="mix-blend-mode:multiply" opacity="0.68"><path fill="none" stroke="#336699" stroke-width="1" opacity="1" stroke-linecap="round" stroke-linejoin="round" d="M10 20 L80 90"/></g></svg>',
    )
    expect(svg([dry])).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><rect width="1000" height="700" fill="#f8f3e8"/><defs><filter id="watercolor-test" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1040" height="740" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.17 0.65" numOctaves="2" seed="43" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" result="edge"/><feComponentTransfer in="noise" result="tooth"><feFuncA type="linear" slope="4" intercept="-1.5"/></feComponentTransfer><feComposite in="edge" in2="tooth" operator="in"/></filter></defs><g filter="url(#watercolor-test)" style="mix-blend-mode:multiply" opacity="0.92"><path fill="none" stroke="#336699" stroke-width="1" opacity="1" stroke-linecap="round" stroke-linejoin="round" d="M10 20 L80 90"/></g></svg>',
    )
    expect(svg([bleed])).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700"><rect width="1000" height="700" fill="#f8f3e8"/><defs><filter id="watercolor-test" filterUnits="userSpaceOnUse" x="-20" y="-20" width="1040" height="740" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="43" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G" result="edge"/><feGaussianBlur in="edge" stdDeviation="2.4" result="spread"/><feComponentTransfer in="spread" result="wash"><feFuncA type="linear" slope="0.72"/></feComponentTransfer><feBlend in="edge" in2="wash" mode="multiply"/></filter></defs><g filter="url(#watercolor-test)" style="mix-blend-mode:multiply" opacity="0.8"><path fill="none" stroke="#336699" stroke-width="1" opacity="1" stroke-linecap="round" stroke-linejoin="round" d="M10 20 L80 90"/></g></svg>',
    )
  })

  it('renders opaque media presets (oil, gouache, ink, pastel) deterministically with filters', () => {
    const base = { id: 'm1', type: 'path', layer: 1, stroke: '#c83827', strokeWidth: 12, d: 'M10 20 Q50 60 90 20' }
    const oil = markSchema.parse({ ...base, brush: { preset: 'oil', seed: 42 } })
    const gouache = markSchema.parse({ ...base, brush: { preset: 'gouache', seed: 42 } })
    const ink = markSchema.parse({ ...base, brush: { preset: 'ink', seed: 42 } })
    const pastel = markSchema.parse({ ...base, brush: { preset: 'pastel', seed: 42 } })

    const oilSvg = svg([oil])
    expect(oilSvg).toContain('feSpecularLighting')
    expect(oilSvg).toContain('feDiffuseLighting')
    expect(oilSvg).toContain('bristles')
    expect(oilSvg).not.toContain('mix-blend-mode:multiply')
    expect(oilSvg).toBe(svg([markSchema.parse(oil)]))

    const gouacheSvg = svg([gouache])
    expect(gouacheSvg).toContain('chalkEdge')
    expect(gouacheSvg).toContain('baseFrequency="0.32"')
    expect(gouacheSvg).not.toContain('mix-blend-mode:multiply')

    const inkSvg = svg([ink])
    expect(inkSvg).toContain('hairStreaks')
    expect(inkSvg).toContain('washGrain')
    expect(inkSvg).toContain('monoStreaks')
    expect(inkSvg).not.toContain('mix-blend-mode:multiply')

    const pastelSvg = svg([pastel])
    expect(pastelSvg).toContain('toothNoise')
    expect(pastelSvg).toContain('paperPeaks')
    expect(pastelSvg).toContain('chalkOnPaper')

    // Presets produce distinct SVG outputs
    expect(oilSvg).not.toBe(gouacheSvg)
    expect(gouacheSvg).not.toBe(inkSvg)
    expect(inkSvg).not.toBe(pastelSvg)
  })

  it('batches consecutive same-preset, same-layer media marks into one filtered group', () => {
    const m1 = markSchema.parse({ id: 's1', type: 'path', layer: 1, stroke: '#123', d: 'M0 0 L10 10', brush: { preset: 'oil', seed: 1 } })
    const m2 = markSchema.parse({ id: 's2', type: 'path', layer: 1, stroke: '#456', d: 'M20 20 L30 30', brush: { preset: 'oil', seed: 17 } }) // 17 % 16 == 1
    const rendered = svg([m1, m2])

    // Should define filter id brush-oil-2 exactly once in <defs>
    const matches = rendered.match(/<filter id="brush-oil-2"/g)
    expect(matches?.length).toBe(1)

    // One filter pass covers both strokes; a layer change starts a new group
    expect(rendered.match(/filter="url\(#brush-oil-2\)"/g)?.length).toBe(1)
    const m3 = markSchema.parse({ ...m2, id: 's3', layer: 2 })
    expect(svg([m1, m2, m3]).match(/filter="url\(#brush-oil-/g)?.length).toBe(2)
  })
  it('rejects XML-invalid control characters in text and paths', () => {
    for (const patch of [{text:'hello\u0001'}, {text:'\ud800'}, {text:'\ufffe'}, {d:'M0\u000b0'}]) {
      expect(markSchema.safeParse({id:'x',type:'text',layer:1,...patch}).success).toBe(false)
    }
    expect(markSchema.safeParse({id:'x',type:'text',layer:1,text:'A fox 🦊\nNext pass'}).success).toBe(true)
  })
  it('replays replacements and deletion deterministically', () => {
    const mark = markSchema.parse({
      id: 'fox',
      type: 'rect',
      layer: 2,
      fill: '#BA4B35',
    })
    const event = (
      recordId: string,
      createdAt: number,
      operations: unknown[],
    ) => ({
      recordId,
      createdAt,
      data: {
        roomId: 'room',
        label: 'pass',
        operations: JSON.stringify(operations),
      },
    })
    const batches = [
      event('b', 2, [{ op: 'delete', id: 'fox' }]),
      event('a', 1, [{ op: 'put', mark }]),
    ]
    expect(replay(batches, 1)).toEqual([mark])
    expect(replay(batches)).toEqual([])
  })
  it('rejects markup, remote paint URLs, unbounded batches and nonfinite values', () => {
    for (const patch of [
      { fill: 'url(https://evil)' },
      { d: '<script/>' },
      { onload: 'alert(1)' },
      { x: Infinity },
    ]) {
      expect(
        markSchema.safeParse({ id: 'x', type: 'path', layer: 1, ...patch })
          .success,
      ).toBe(false)
    }
    expect(
      batchSchema.safeParse(Array(51).fill({ op: 'delete', id: 'x' })).success,
    ).toBe(false)
  })
  it('escapes text and ignores malformed persisted events', () => {
    expect(
      svg([
        markSchema.parse({
          id: 'x',
          type: 'text',
          layer: 1,
          text: '<script>&',
        }),
      ]),
    ).toContain('&lt;script&gt;&amp;')
    expect(
      replay([
        {
          recordId: 'x',
          createdAt: 1,
          data: { roomId: 'r', label: 'x', operations: 'bad json' },
        },
      ]),
    ).toEqual([])
  })
})
