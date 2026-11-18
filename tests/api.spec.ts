import { test, expect } from '@playwright/test'
test('public SVG export returns 404 for unknown room and auth rejects anonymous agent writes', async ({
  request,
}) => {
  const missing = await request.get('/api/studios/unknown/view.svg')
  expect(missing.status()).toBe(404)
  const response = await request.post(
    '/_deepspace/agent/tools/studio_comment',
    { data: { roomId: 'unknown', body: 'hi' } },
  )
  expect(response.status()).toBe(401)
})
