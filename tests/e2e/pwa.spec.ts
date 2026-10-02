import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

test('serves a standalone manifest with correctly sized butterfly icons', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest')
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toMatch(/application\/(?:manifest\+json|json)/)
  const manifest = await response.json()
  expect(manifest).toMatchObject({ name: 'PennyWings', short_name: 'PennyWings', id: '/', start_url: '/dashboard', scope: '/', display: 'standalone', theme_color: '#c94466', background_color: '#fffafd' })
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(['192x192', '512x512'])
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src)
    expect(image.ok()).toBe(true)
    const png = await image.body()
    const [width, height] = icon.sizes.split('x').map(Number)
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect(png.readUInt32BE(16)).toBe(width)
    expect(png.readUInt32BE(20)).toBe(height)
    expect(icon.purpose).toBe('any')
  }
})

test('browser theme color follows saved app theme, toggles, and public light mode', async ({ page }) => {
  await setupAuthenticatedMocks(page)
  await page.emulateMedia({ colorScheme: 'light' })
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/dashboard')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('meta[name="theme-color"][media="all"]')).toHaveAttribute('content', '#020617')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'default')
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'PennyWings')
  await page.getByRole('button', { name: 'Open more navigation' }).click()
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('meta[name="theme-color"][media="all"]')).toHaveAttribute('content', '#c94466')
  await page.goto('/forgot-password')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.locator('meta[name="theme-color"][media="all"]')).toHaveAttribute('content', '#c94466')
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
})

test('signed-out standalone start follows the existing login guard', async ({ page }) => {
  await page.route('**/auth/v1/**', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toHaveCount(0)
})

test('standalone layout clears top and landscape safe areas', async ({ page }) => {
  await setupAuthenticatedMocks(page)
  await page.setViewportSize({ width: 667, height: 320 })
  await page.goto('/dashboard')
  await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeVisible()
  // Browser emulation cannot install a PWA. Activate the shipped CSS media rule
  // itself, rather than injecting a duplicate that could conceal a missing rule.
  const activated = await page.evaluate(() => {
    let count = 0
    const visit = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes('display-mode: standalone')) {
          rule.media.mediaText = 'all'
          count += 1
        }
        if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules)
      }
    }
    for (const sheet of Array.from(document.styleSheets)) visit(sheet.cssRules)
    return count
  })
  expect(activated).toBeGreaterThan(0)
  await page.locator('.app-layout').evaluate((element) => {
    const style = (element as HTMLElement).style
    style.setProperty('--mobile-safe-top', '24px')
    style.setProperty('--mobile-safe-left', '44px')
    style.setProperty('--mobile-safe-right', '44px')
  })
  const content = await page.locator('.app-content').evaluate((element) => {
    const style = getComputedStyle(element)
    return { top: style.paddingTop, left: style.paddingLeft, right: style.paddingRight }
  })
  expect(content).toEqual({ top: '48px', left: '44px', right: '44px' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(667)
})
