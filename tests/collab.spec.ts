import { test, expect, loadAllTestAccounts } from 'deepspace/testing'
test.skip(
  loadAllTestAccounts().length < 2,
  'Requires two dedicated DeepSpace test accounts',
)
test('two contributors create, draw, discuss, replay and reload a studio', async ({
  browser,
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
  await b.page.getByRole('tab', { name: 'Brief' }).click()
  await expect(
    b.page.getByText('An observatory above the clouds'),
  ).toBeVisible()
  await b.page.getByRole('tab', { name: 'Conversation' }).click()
  await b.page
    .getByLabel('Feedback', { exact: true })
    .fill('Keep the moon above the dome.')
  await b.page.getByRole('button', { name: 'Send feedback' }).click()
  await expect(a.page.getByText('Keep the moon above the dome.')).toBeVisible()
  await a.page
    .getByRole('button', { name: 'Invite an agent', exact: true })
    .click()
  const invite = a.page.getByRole('dialog', { name: 'Invite an agent' })
  await expect(invite.getByText(/^Join my Atelier drawing room\. Read https?:\/\/\S+\/agent\.md\?key=\S+ and follow it\.$/)).toBeVisible()
  await expect(invite.getByRole('button', { name: 'Copy prompt' })).toBeEnabled()
  await invite.getByRole('button', { name: 'Close agent invite' }).click()
  await a.page.reload()
  await expect(a.page.getByText('Keep the moon above the dome.')).toBeVisible()
  const svg = await a.page.request.get(
    `/api/studios/${roomUrl.split('/').pop()}/view.svg`,
  )
  expect(svg.status()).toBe(200)
  expect(await svg.text()).toContain('viewBox="0 0 1000 700"')
  await a.page.goto('/home')
  await a.page
    .getByRole('button', { name: 'Open example', exact: true })
    .click()
  await expect(a.page).toHaveURL(/\/studio\//)
  await expect(a.page.getByText('17 marks · 3 revisions')).toBeVisible()
  const guest = await browser.newPage()
  try {
    await guest.goto(a.page.url())
    await guest.getByRole('button', { name: 'Clear canvas', exact: true }).click()
    await expect(guest.getByText('Sign in to clear the canvas', { exact: true })).toBeVisible()
  } finally {
    await guest.close()
  }
  await a.page.getByLabel('Drawing revision').fill('0')
  await expect(a.page.getByText('Room for a first mark.')).toBeVisible()
  await a.page.getByRole('button', { name: 'Return to live', exact: true }).click()
  await expect(a.page.getByText('17 marks · 3 revisions')).toBeVisible()
  await b.page.goto(a.page.url())
  await expect(b.page.getByText('17 marks · 3 revisions')).toBeVisible()
  await a.page.getByLabel('Drawing revision').fill('0')
  const clear = a.page.getByRole('button', { name: 'Clear canvas', exact: true })
  await expect(clear).toBeDisabled()
  await expect(clear).toHaveAttribute('title', 'Return to live to clear')
  await a.page.getByRole('button', { name: 'Return to live', exact: true }).click()
  await expect(clear).toBeEnabled()
  a.page.once('dialog', dialog => dialog.accept())
  await clear.click()
  await expect(a.page.getByText('0 marks · 4 revisions')).toBeVisible()
  await expect(b.page.getByText('0 marks · 4 revisions')).toBeVisible()
  await a.page.getByRole('tab', { name: 'History' }).click()
  await a.page.getByRole('button', { name: 'Restore', exact: true }).click()
  await expect(a.page.getByText('17 marks · 5 revisions')).toBeVisible()
  await expect(b.page.getByText('17 marks · 5 revisions')).toBeVisible()
  await a.page.screenshot({ path: '/tmp/atelier-studio.png', fullPage: true })
  const exampleUrl = a.page.url()
  await expect(b.page.getByRole('button', { name: 'Delete studio', exact: true })).toHaveCount(0)
  await a.page.goto('/home')
  const deleteExample = a.page.getByRole('button', { name: 'Delete Peach hibiscus', exact: true }).first()
  a.page.once('dialog', dialog => dialog.dismiss())
  await deleteExample.click()
  await expect(deleteExample).toBeVisible()
  a.page.once('dialog', dialog => dialog.accept())
  await deleteExample.click()
  await expect(b.page.getByRole('heading', { name: 'Room not found' })).toBeVisible()
  const deletedSvg = await b.page.request.get(`/api/studios/${exampleUrl.split('/').pop()}/view.svg`)
  expect(deletedSvg.status()).toBe(404)
})
