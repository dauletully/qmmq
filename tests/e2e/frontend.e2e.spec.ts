import { expect, test } from '@playwright/test'

test.describe('Лендинг', () => {
  test('открывается по пути и показывает первый экран', async ({ page }) => {
    await page.goto('http://localhost:3000/contest-2026')
    await expect(page.locator('h1').first()).toContainText('XII')
    await expect(page.locator('[data-cta="hero"]')).toBeVisible()
  })
})
