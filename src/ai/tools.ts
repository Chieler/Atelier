import { tool, type ToolSet } from 'ai'
import { z } from 'zod'
import type { UserToolExecutor } from 'deepspace/worker'
import { batchSchema } from '../studio/model'
const roomId = z.string().min(1).max(100)
export function buildSystemPrompt(..._context: unknown[]): string {
  return 'You draw in Atelier. Read the brief and feedback first. Submit small labelled batches, inspect the image between passes, preserve other contributors’ work, and report what you actually verified.'
}
export function buildTools(executor: UserToolExecutor): ToolSet {
  async function requireRoom(id: string) {
    const result = (await executor('records.get', {
      collection: 'studios',
      recordId: id,
    })) as { success: boolean; error?: string }
    if (!result.success) throw new Error(result.error || 'Room not found')
    return result
  }
  return {
    studio_create: tool({
      description:
        'Create a public illustration room with a brief and style guide. Returns its recordId, used as roomId by the other studio tools. All app members can contribute.',
      inputSchema: z.object({
        title: z.string().min(1).max(100),
        brief: z.string().min(1).max(3000),
        style: z.string().min(1).max(3000),
      }),
      execute: async (data) =>
        executor('records.create', { collection: 'studios', data }),
    }),
    studio_read: tool({
      description:
        'Read a public drawing room brief and recent feedback. Canvas is 1000x700. Inspect /api/studios/{roomId}/view.svg visually before and after painting. Higher layers cover lower layers. Room IDs are public; access uses authenticated DeepSpace identity.',
      inputSchema: z.object({ roomId }),
      execute: async ({ roomId: id }) => ({
        room: await requireRoom(id),
        messages: await executor('records.query', {
          collection: 'studio-messages',
          where: { roomId: id },
          orderBy: 'createdAt',
          orderDir: 'desc',
          limit: 20,
        }),
        viewPath: `/api/studios/${encodeURIComponent(id)}/view.svg`,
        size: { width: 1000, height: 700 },
      }),
    }),
    studio_paint: tool({
      description:
        'Append 1–50 validated SVG operations as one revision. put creates or replaces a stable mark ID; delete removes it. Use agent-prefixed IDs to avoid overwriting collaborators. Paths use SVG d syntax. No raw markup, URLs or images. Solid hex colors only. Layer 0 is behind layer 99. Label each batch by intent and inspect the view after each pass.',
      inputSchema: z.object({
        roomId,
        label: z.string().min(1).max(120),
        operations: batchSchema,
      }),
      execute: async ({ roomId: id, label, operations }) => {
        await requireRoom(id)
        const encoded = JSON.stringify(operations)
        if (encoded.length > 60000)
          throw new Error('Batch too large; use fewer or simpler paths')
        return executor('records.create', {
          collection: 'drawing-batches',
          data: { roomId: id, label, operations: encoded },
        })
      },
    }),
    studio_comment: tool({
      description:
        'Post a question, plan or response to feedback in the room conversation.',
      inputSchema: z.object({ roomId, body: z.string().min(1).max(2000) }),
      execute: async ({ roomId: id, body }) => {
        await requireRoom(id)
        return executor('records.create', {
          collection: 'studio-messages',
          data: { roomId: id, body },
        })
      },
    }),
    studio_history: tool({
      description:
        'Read a page of drawing batches with stable IDs and source operations. Follow nextOffset for additional pages. The SVG view contains the current full composition.',
      inputSchema: z.object({
        roomId,
        offset: z.number().int().min(0).default(0),
      }),
      execute: async ({ roomId: id, offset }) => {
        await requireRoom(id)
        return executor('records.query', {
          collection: 'drawing-batches',
          where: { roomId: id },
          orderBy: 'createdAt',
          orderDir: 'asc',
          limit: 10,
          offset,
        })
      },
    }),
  }
}
