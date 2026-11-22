import type { Hono } from 'hono'
import type { AppContext, Env } from '../../worker'
import { replay, svg, type DrawingBatch, type Envelope } from '../studio/model'

export function studioRecordTools(env: Env, userId: string) {
  const stub = env.RECORD_ROOMS.get(env.RECORD_ROOMS.idFromName(`app:${env.DEEPSPACE_APP_ID}`))
  return async function execute<T>(tool: string, params: Record<string, unknown>) {
    const response = await stub.fetch(
      new Request('https://internal/api/tools/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-App-Action': 'true',
        },
        body: JSON.stringify({ tool, params }),
      }),
    )
    return response.json() as Promise<{ success: boolean; data?: T; error?: string }>
  }
}
/** Public read surface; never forwards request-supplied identity. */
export function registerStudioRoutes(app: Hono<AppContext>) {
  app.get('/api/studios/:roomId/view.svg', async (c) => {
    const roomId = c.req.param('roomId')
    const query = studioRecordTools(c.env, 'public-studio-reader')
    const room = await query<{ record?: unknown }>('records.get', {
      collection: 'studios',
      recordId: roomId,
    })
    if (!room.success || !room.data?.record)
      return c.json({ error: 'Room not found' }, 404)
    const batches: Envelope<DrawingBatch>[] = []
    let offset = 0
    for (let page = 0; page < 100; page++) {
      const result = await query<{ records: Envelope<DrawingBatch>[]; nextOffset?: number }>('records.query', {
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
