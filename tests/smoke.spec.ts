import { test, expect } from '@playwright/test'

test('sign-in provider labels remain readable on normal and hovered buttons', async ({ page }) => {
  await page.goto('/home')
  await page.getByRole('button', { name: 'New studio', exact: true }).click()
  for (const name of ['Continue with GitHub', 'Continue with Google']) {
    const button = page.getByRole('button', { name, exact: true })
    for (const hovered of [false, true]) {
      if (hovered) await button.hover()
      const contrast = await button.evaluate(element => {
        const style = getComputedStyle(element)
        const luminance = (color: string) => {
          const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(value => {
            const s = Number(value) / 255
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
          })
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        }
        const foreground = luminance(style.color)
        const background = luminance(style.backgroundColor)
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
      })
      expect(contrast, `${name}, hover=${hovered}`).toBeGreaterThanOrEqual(4.5)
    }
  }
  await page.getByRole('button', { name: 'Sign in with email', exact: true }).click()
  await expect(page.getByPlaceholder('Email', { exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('Password', { exact: true })).toBeVisible()
  await page.getByTestId('auth-overlay-close').click()
  await expect(page.getByTestId('auth-overlay')).toHaveCount(0)
})
test('public landing and studio home render without signing in', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.getByRole('link', { name: 'Enter the studio' }).first().click()
  await expect(page.getByRole('heading', { name: 'Drawing studios' })).toBeVisible()
  await page.getByRole('button', { name: 'New studio', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Enter the studio' }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
test('mobile layout fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: 'Drawing studios' })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
})
