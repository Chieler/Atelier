import type { Context, Hono } from 'hono'
import { z } from 'zod'
import type { AppContext, Env } from '../../worker'
import { MAX_ENCODED_PAINT_LENGTH, studioCommentSchema, studioPaintSchema } from '../ai/tools'
import { ordered, type Envelope, type Message, type StudioRoom } from '../studio/model'
import { resolveAuth } from './http-routes'
import { studioRecordTools } from './studio-routes'

const encoder = new TextEncoder()
const hmac = { name: 'HMAC', hash: 'SHA-256' }

export async function agentInviteSigningKey(env: Pick<Env, 'AGENT_INVITE_SECRET' | 'APP_IDENTITY_TOKEN'>) {
  const secret = env.AGENT_INVITE_SECRET ?? env.APP_IDENTITY_TOKEN
  if (!secret) return null

  const source = await crypto.subtle.importKey('raw', encoder.encode(secret), hmac, false, ['sign'])
  const derived = await crypto.subtle.sign('HMAC', source, encoder.encode('atelier-agent-invite-v1'))
  return crypto.subtle.importKey('raw', derived, hmac, false, ['sign', 'verify'])
}

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export async function signAgentInvite(key: CryptoKey, roomId: string, inviterUserId: string) {
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${roomId}:${inviterUserId}`))
  return `${inviterUserId}.${base64url(new Uint8Array(signature))}`
}

export async function verifyAgentInvite(key: CryptoKey, roomId: string, invite: string) {
  // A colon-free user ID makes the room and user unambiguous in the signed payload.
  const match = /^([^:\s]+)\.([\w-]{43})$/.exec(invite)
  if (!match) return null
  const [, inviterUserId, encoded] = match
  const signature = Uint8Array.from(atob(encoded.replaceAll('-', '+').replaceAll('_', '/')), (byte) => byte.charCodeAt(0))
  if (base64url(signature) !== encoded) return null

  const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(`${roomId}:${inviterUserId}`))
  return valid ? inviterUserId : null
}

type StudioRecords = ReturnType<typeof studioRecordTools>

async function findStudio(records: StudioRecords, roomId: string) {
  const result = await records<{ record?: Envelope<StudioRoom> }>('records.get', {
    collection: 'studios',
    recordId: roomId,
  })
  return result.success ? result.data?.record : undefined
}

function studioApiUrl(requestUrl: string, roomId: string) {
  return `${new URL(requestUrl).origin}/api/studios/${encodeURIComponent(roomId)}`
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function quoteMarkdown(value: string) {
  return value.split(/\r\n?|\n/).map((line) => `> ${line}`).join('\n')
}

function agentMarkdown(room: StudioRoom, messages: Envelope<Message>[], baseUrl: string, invite: string) {
  const authHeader = shellQuote(`Authorization: Bearer ${invite}`)
  const paint = {
    label: 'First watercolor study',
    operations: [{
      op: 'put',
      mark: { id: 'myagent-study-1', type: 'ellipse', layer: 1, x: 500, y: 350,
        width: 60, height: 36, fill: '#758a71', brush: { preset: 'wet-wash', seed: 42 } },
    }],
  }
  const comment = { body: 'I added a small watercolor study. How does it fit the composition?' }
  const feedback = ordered(messages).map((message) => quoteMarkdown(message.data.body)).join('\n\n')

  return `# Draw in Atelier

${quoteMarkdown(room.title)}

## Brief

${quoteMarkdown(room.brief)}

## Style notes

${quoteMarkdown(room.style)}

## Recent feedback (up to 20 messages, oldest first)

${feedback || 'No messages yet.'}

## Drawing workflow

The canvas is 1000 × 700. Higher layers draw over lower layers. Inspect the [public SVG](${baseUrl}/view.svg) before painting and between passes. Re-fetch this Markdown to read new feedback.

Use small, labelled batches and stable mark IDs with your own agent prefix. Reuse an ID to revise your own mark and preserve other contributors’ work. The invite already authorizes these curl requests.

### Paint schema

- Send a \`label\` of 1–120 characters and \`operations\` with 1–50 entries. The encoded operations can total up to ${MAX_ENCODED_PAINT_LENGTH} characters, including defaults.
- Use \`{"op":"put","mark":{...}}\` to create or replace a mark, and \`{"op":"delete","id":"myagent-study-1"}\` to remove one.
- Each mark requires an \`id\` of 1–80 ASCII letters, digits, underscores or hyphens, a \`type\` of \`path\`, \`rect\`, \`ellipse\`, \`line\` or \`text\`, and a numeric \`layer\` from 0 to 99.
- \`x\`, \`y\`, \`x2\` and \`y2\` range from −2000 to 3000. \`width\` and \`height\` range from 0 to 2000. All default to 0. Rectangles use top-left \`x\`, \`y\` and dimensions. Ellipses use center \`x\`, \`y\` and radii \`width\`, \`height\`. Lines use both coordinate pairs.
- \`fill\` and \`stroke\` accept 3-, 4-, 6- or 8-digit hex colors with a leading #, or \`none\` (the default). \`strokeWidth\` ranges from 0 to 100 (default 1) and \`opacity\` from 0 to 1 (default 1).
- Paths use SVG \`d\` up to 12000 characters with M, L, H, V, C, S, Q, T, A and Z commands in either case. Text marks use \`text\` up to 300 characters valid in XML and \`fontSize\` from 4 to 150 (default 24). Both \`d\` and \`text\` default to empty strings.
- Optional \`brush\` takes a \`preset\` of \`wet-wash\`, \`dry-brush\`, \`pigment-bleed\`, \`oil\`, \`gouache\`, \`ink\` or \`pastel\` and an integer \`seed\` from 0 to 2147483647. Vary seeds across marks and keep a mark's seed when revising it.

\`\`\`sh
curl -sS ${shellQuote(`${baseUrl}/paint`)} \\
  -H ${authHeader} \\
  -H 'Content-Type: application/json' \\
  --data ${shellQuote(JSON.stringify(paint))}
\`\`\`

### Leave a comment

Send a \`body\` of 1–2000 characters to share a plan, question or response to feedback.

\`\`\`sh
curl -sS ${shellQuote(`${baseUrl}/comment`)} \\
  -H ${authHeader} \\
  -H 'Content-Type: application/json' \\
  --data ${shellQuote(JSON.stringify(comment))}
\`\`\`
`
}

function withAgentInvite(
  readInvite: (c: Context<AppContext>) => string | undefined,
  handle: (c: Context<AppContext>, roomId: string, records: StudioRecords, room: StudioRoom, invite: string) => Promise<Response>,
) {
  return async (c: Context<AppContext>) => {
    const signingKey = await agentInviteSigningKey(c.env)
    if (!signingKey) return c.json({ error: 'Agent invites not configured' }, 503)

    const { roomId } = c.req.param()
    const invite = readInvite(c) ?? ''
    const userId = await verifyAgentInvite(signingKey, roomId, invite)
    if (!userId) return c.json({ error: 'Invalid agent invite key' }, 403)

    const records = studioRecordTools(c.env, userId)
    const room = await findStudio(records, roomId)
    if (!room) return c.json({ error: 'Room not found' }, 404)
    return handle(c, roomId, records, room.data, invite)
  }
}

function bearerInvite(c: Context<AppContext>) {
  return /^Bearer (\S+)$/i.exec(c.req.header('Authorization') ?? '')?.[1]
}

export function registerAgentApi(app: Hono<AppContext>) {
  app.post('/api/studios/:roomId/invite', async (c) => {
    const auth = await resolveAuth(c.req.raw, c.env)
    if (!auth) return c.json({ error: 'Sign in to invite an agent' }, 401)

    const signingKey = await agentInviteSigningKey(c.env)
    if (!signingKey) return c.json({ error: 'Agent invites not configured' }, 503)

    const roomId = c.req.param('roomId')
    const room = await findStudio(studioRecordTools(c.env, auth.userId), roomId)
    if (!room) return c.json({ error: 'Room not found' }, 404)

    const key = await signAgentInvite(signingKey, roomId, auth.userId)
    const url = `${studioApiUrl(c.req.url, roomId)}/agent.md?key=${encodeURIComponent(key)}`
    c.header('Cache-Control', 'no-store')
    return c.json({ key, url })
  })

  app.get('/api/studios/:roomId/agent.md', withAgentInvite((c) => c.req.query('key'), async (c, roomId, records, room, key) => {
    const result = await records<{ records: Envelope<Message>[] }>('records.query', {
      collection: 'studio-messages',
      where: { roomId },
      orderBy: 'createdAt',
      orderDir: 'desc',
      limit: 20,
    })
    if (!result.success) return c.json({ error: 'Unable to load feedback' }, 500)

    return new Response(agentMarkdown(room, result.data?.records ?? [], studioApiUrl(c.req.url, roomId), key), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }))

  // ponytail: No rate limit beyond the batch size and payload caps.
  app.post('/api/studios/:roomId/paint', withAgentInvite(bearerInvite, async (c, roomId, records) => {
    const parsed = studioPaintSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: z.prettifyError(parsed.error) }, 400)

    const { label, operations } = parsed.data
    const encoded = JSON.stringify(operations)
    if (encoded.length > MAX_ENCODED_PAINT_LENGTH) {
      return c.json({ error: 'Batch too large; use fewer, simpler paths' }, 400)
    }

    const result = await records<{ recordId: string }>('records.create', {
      collection: 'drawing-batches',
      data: { roomId, label, operations: encoded },
    })
    if (!result.success || !result.data?.recordId) return c.json({ error: 'Unable to save drawing batch' }, 500)
    return c.json({ ok: true, recordId: result.data.recordId, viewUrl: `${studioApiUrl(c.req.url, roomId)}/view.svg` })
  }))

  app.post('/api/studios/:roomId/comment', withAgentInvite(bearerInvite, async (c, roomId, records) => {
    const parsed = studioCommentSchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: z.prettifyError(parsed.error) }, 400)

    const result = await records<{ recordId: string }>('records.create', {
      collection: 'studio-messages',
      data: { roomId, body: parsed.data.body },
    })
    if (!result.success || !result.data?.recordId) return c.json({ error: 'Unable to save comment' }, 500)
    return c.json({ ok: true, recordId: result.data.recordId })
  }))
}
