import { expect, test } from '@playwright/test'

test.describe('Public Navigation & Informational Pages', () => {
  test('loads home landing page and navigation header', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/PennyWings/i)
  })

  test('loads terms and conditions page', async ({ page }) => {
    await page.goto('/terms-and-conditions')
    await expect(page.locator('body')).toContainText(/terms/i)
  })

  test('displays 404 Not Found for non-existent routes', async ({ page }) => {
    await page.goto('/some-random-route-that-does-not-exist')
    await expect(page.locator('body')).toContainText(/not found|404/i)
  })
})
