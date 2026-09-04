import { expect, test } from '@playwright/test'

test.describe('Public Navigation & Informational Pages', () => {
  test('uses the PNG logo in the initial loader before React mounts', async ({
    page,
  }) => {
    await page.route('**/src/main.tsx*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await page.goto('/', { waitUntil: 'commit' })

    const loader = page.getByLabel('Loading PennyWings')
    await expect(loader).toBeVisible()
    await expect(loader.locator('img')).toHaveAttribute(
      'src',
      '/pennywings-logo.png',
    )
    await expect(loader.locator('svg')).toHaveCount(0)
  })

  test('loads home landing page and navigation header', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Penny Wings/i)
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
