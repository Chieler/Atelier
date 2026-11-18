import type { Hono } from 'hono'
import type { AppContext } from '../../worker'
import { replay, svg, type DrawingBatch, type Envelope } from '../studio/model'
/** Public read surface; never forwards request-supplied identity. */
export function registerStudioRoutes(app: Hono<AppContext>) {
  app.get('/api/studios/:roomId/view.svg', async (c) => {
    const roomId = c.req.param('roomId')
    const stub = c.env.RECORD_ROOMS.get(
      c.env.RECORD_ROOMS.idFromName(`app:${c.env.DEEPSPACE_APP_ID}`),
    )
    async function query(tool: string, params: Record<string, unknown>) {
      const response = await stub.fetch(
        new Request('https://internal/api/tools/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': 'public-studio-reader',
            'X-App-Action': 'true',
          },
          body: JSON.stringify({ tool, params }),
        }),
      )
      return response.json() as Promise<{
        success: boolean
        data?: {
          record?: unknown
          records?: Envelope<DrawingBatch>[]
          nextOffset?: number
        }
        error?: string
      }>
    }
    const room = await query('records.get', {
      collection: 'studios',
      recordId: roomId,
    })
    if (!room.success || !room.data?.record)
      return c.json({ error: 'Room not found' }, 404)
    const batches: Envelope<DrawingBatch>[] = []
    let offset = 0
    for (let page = 0; page < 100; page++) {
      const result = await query('records.query', {
        collection: 'drawing-batches',
        where: { roomId },
        orderBy: 'createdAt',
        orderDir: 'asc',
        limit: 100,
        offset,
      })
      if (!result.success)
        return c.json({ error: 'Unable to load drawing' }, 500)
      const records = result.data?.records ?? []
      batches.push(...records)
      if (result.data?.nextOffset === undefined) break
      offset = result.data.nextOffset
      if (page === 99)
        return c.json({ error: 'Drawing exceeds export limit' }, 413)
    }
    return new Response(svg(replay(batches)), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store',
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })
}
