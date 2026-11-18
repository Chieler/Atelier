import { test, expect } from '@playwright/test'
test('public landing and studio home render without signing in', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.getByRole('link', { name: 'Enter the studio' }).first().click()
  await expect(page.getByRole('heading', { name: /Good work/ })).toBeVisible()
  await page.getByRole('button', { name: 'New studio', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Enter the studio' }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
test('mobile layout fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: /Good work/ })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
})
