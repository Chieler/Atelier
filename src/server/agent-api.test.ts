import { expect, it } from 'vitest'
import { agentInviteSigningKey, signAgentInvite, verifyAgentInvite } from './agent-api'

it('authenticates the inviter only for the signed room and an intact key', async () => {
  const signingKey = await agentInviteSigningKey({ APP_IDENTITY_TOKEN: 'test-app-token' })
  const invite = await signAgentInvite(signingKey!, 'room-one', 'inviter')

  expect(invite).toMatch(/^inviter\.[\w-]{43}$/)
  expect(await verifyAgentInvite(signingKey!, 'room-one', invite)).toBe('inviter')
  expect(await verifyAgentInvite(signingKey!, 'room-two', invite)).toBeNull()
  expect(await verifyAgentInvite(signingKey!, 'room-one', invite.replace('inviter', 'other'))).toBeNull()
  const tampered = invite.replace(/\.(.)/, (_, first) => `.${first === 'A' ? 'B' : 'A'}`)
  expect(await verifyAgentInvite(signingKey!, 'room-one', tampered)).toBeNull()
})
