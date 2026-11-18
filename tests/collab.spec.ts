import { test, expect, loadAllTestAccounts } from 'deepspace/testing'
test.skip(
  loadAllTestAccounts().length < 2,
  'Requires two dedicated DeepSpace test accounts',
)
test('two contributors create, draw, discuss, replay and reload a studio', async ({
  users,
}) => {
  const [a, b] = await users(2)
  await a.page.goto('/home')
  await a.page.getByRole('button', { name: 'New studio', exact: true }).click()
  await a.page
    .getByLabel('Studio name')
    .fill(`Collaboration check ${Date.now()}`)
  await a.page
    .getByLabel('The brief', { exact: true })
    .fill('An observatory above the clouds')
  await a.page
    .getByLabel('Style guide')
    .fill('Two colors, strong negative space')
  await a.page
    .getByRole('button', { name: 'Create studio', exact: true })
    .click()
  await expect(a.page).toHaveURL(/\/studio\//)
  const roomUrl = a.page.url()
  await b.page.goto(roomUrl)
  await expect(
    b.page.getByText('An observatory above the clouds'),
  ).toBeVisible()
  await b.page
    .getByLabel('Feedback', { exact: true })
    .fill('Keep the moon above the dome.')
  await b.page.getByRole('button', { name: 'Send feedback' }).click()
  await expect(a.page.getByText('Keep the moon above the dome.')).toBeVisible()
  await a.page
    .getByRole('button', { name: 'Invite an agent', exact: true })
    .click()
  await expect(a.page.getByRole('dialog')).toContainText('studio_read')
  await a.page.getByRole('button', { name: 'Close agent instructions' }).click()
  await a.page.reload()
  await expect(a.page.getByText('Keep the moon above the dome.')).toBeVisible()
  const svg = await a.page.request.get(
    `/api/studios/${roomUrl.split('/').pop()}/view.svg`,
  )
  expect(svg.status()).toBe(200)
  expect(await svg.text()).toContain('viewBox="0 0 1000 700"')
  await a.page.goto('/home')
  await a.page
    .getByRole('button', { name: 'Open the example', exact: true })
    .click()
  await expect(a.page).toHaveURL(/\/studio\//)
  await expect(a.page.getByText('46 marks · 3 revisions')).toBeVisible()
  await a.page.getByLabel('Drawing revision').fill('0')
  await expect(a.page.getByText('Room for a first mark.')).toBeVisible()
  await a.page.getByRole('button', { name: 'Latest', exact: true }).click()
  await expect(a.page.getByText('46 marks · 3 revisions')).toBeVisible()
  await a.page.screenshot({ path: '/tmp/atelier-studio.png', fullPage: true })
  console.log('VERIFIED_STUDIO_URL', a.page.url())
})
