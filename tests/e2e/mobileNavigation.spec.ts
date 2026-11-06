import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

test.describe('Mobile bottom navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
    await page.goto('/dashboard')
    await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeVisible()
    // The shell paints before the lazy page chunk and its data; wait for the
    // page itself so scroll and height assertions see real content.
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('stays a fixed size on scroll and keeps accessible touch targets at 320px', async ({ page }, testInfo) => {
    const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
    const items = nav.locator('a, button')
    await expect(items).toHaveCount(5)
    await expect(nav.getByRole('link', { name: /Home/ })).toBeVisible()
    await expect(nav.locator('.mobile-dock-label')).toHaveCount(5)
    await expect(nav).not.toHaveAttribute('data-shrunk', 'true')
    await expect(nav.locator('.mobile-dock-indicator')).toHaveCount(1)
    await expect(nav.locator('.mobile-dock-indicator')).toHaveAttribute('aria-hidden', 'true')

    for (const width of [320, 390, 440, 767]) {
      await page.setViewportSize({ width, height: 667 })
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      const before = await nav.boundingBox()
      expect(before).not.toBeNull()
      // Five labeled destinations retain 44px targets on narrow phones.
      expect(before!.x).toBeCloseTo(0, 1)
      expect(before!.width).toBeCloseTo(width, 1)
      expect(before!.y + before!.height).toBeCloseTo(667, 1)
      expect(before!.height).toBe(68)
      for (const item of await items.all()) {
        const bounds = await item.boundingBox()
        expect(bounds!.width).toBeGreaterThanOrEqual(44)
        expect(bounds!.height).toBeGreaterThanOrEqual(44)
      }

      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
      await expect(nav).not.toHaveAttribute('data-shrunk', 'true')
      await expect.poll(async () => (await nav.boundingBox())?.height).toBeCloseTo(before!.height, 1)
      const scrolled = await nav.boundingBox()
      expect(scrolled!.y + scrolled!.height).toBeCloseTo(before!.y + before!.height, 1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await expect.poll(async () => (await nav.boundingBox())?.height).toBeCloseTo(before!.height, 1)
    }

    await page.setViewportSize({ width: 375, height: 667 })
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(async () => (await nav.locator('.mobile-dock-indicator').boundingBox())!.width)
      .toBeCloseTo((await items.first().boundingBox())!.width, 0)
    await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('mobile-dock-light.png') })
  })

  test('navigates to each destination and marks the current route', async ({ page }) => {
    const destinations = [
      ['Accounts', '/accounts'], ['Activity', '/transactions'], ['Reports', '/reports'],
      ['Dashboard', '/dashboard'],
    ]
    for (const [name, path] of destinations) {
      const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
      await nav.getByRole('link', { name: new RegExp(name) }).click()
      await expect(page).toHaveURL(new RegExp(`${path}(?:\\?.*)?$`))
      await expect(nav.getByRole('link', { name: new RegExp(name) })).toHaveAttribute('aria-current', 'page')
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
    }
  })


  test('More is a page with persistent tabs, history, and no scroll lock', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
    const more = nav.getByRole('link', { name: 'More', exact: true })
    await page.evaluate(() => window.scrollTo(0, 200))
    const dashboardScroll = await page.evaluate(() => scrollY)
    await more.click()
    await expect(page).toHaveURL(/\/more$/)
    await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeFocused()
    await expect(more).toHaveAttribute('aria-current', 'page')
    await expect(more).not.toHaveAttribute('aria-haspopup')
    await expect(nav.locator('[data-selected="true"]')).toHaveCount(1)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    await page.keyboard.press('Tab')
    await expect(page.locator('.more-profile')).toBeFocused()
    await page.goBack()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(dashboardScroll)
    await page.goForward()
    await expect(page).toHaveURL(/\/more$/)
    const entries = await page.evaluate(() => history.length)
    await more.click()
    expect(await page.evaluate(() => history.length)).toBe(entries)
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeVisible()
    for (const [label, path] of [['Debts', '/debts'], ['Monitoring', '/monitoring'], ['Profile & settings', '/profile']]) {
      await page.locator('.more-page').getByRole('link', { name: new RegExp(label) }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(more).toHaveAttribute('aria-current', 'location')
      await expect(more).toHaveAttribute('data-selected', 'true')
      await more.click()
      await expect(page).toHaveURL(/\/more$/)
    }
  })

  test('theme, assistant, and sign-out preserve the page and restore focus', async ({ page }) => {
    await page.goto('/more')
    const screen = page.locator('.more-page')
    await screen.getByRole('button', { name: 'Switch to dark mode' }).click()
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    const assistantTrigger = screen.getByRole('button', { name: /AI Assistant/ })
    await assistantTrigger.click()
    const assistant = page.getByRole('dialog')
    await expect(assistant).toBeVisible()
    await expect.poll(() => assistant.evaluate(el => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(assistant).not.toBeVisible()
    await expect(assistantTrigger).toBeFocused()
    const signOut = screen.getByRole('button', { name: 'Sign out' })
    await signOut.click()
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page).toHaveURL(/\/more$/)
    await expect(signOut).toBeFocused()
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  })

  test('fits phones, expanded help, dark mode, and desktop without hiding the route', async ({ page }, testInfo) => {
    await page.goto('/more')
    const screen = page.locator('.more-page')
    for (const [width, height] of [[375, 667], [390, 844], [430, 932], [667, 320], [768, 1024], [1280, 800]]) {
      await page.setViewportSize({ width, height })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(screen).toBeVisible()
      await expect(page).toHaveURL(/\/more$/)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
      if (width < 768) await expect(nav).toBeVisible()
      else await expect(nav).not.toBeVisible()
      for (const target of await screen.locator('a, button, summary').all()) {
        const box = await target.boundingBox()
        expect(box!.height).toBeGreaterThanOrEqual(44)
      }
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ animations: 'disabled', path: testInfo.outputPath(`more-${width}-light.png`), fullPage: true })
      await screen.getByRole('button', { name: 'Switch to dark mode' }).click()
      await page.screenshot({ animations: 'disabled', path: testInfo.outputPath(`more-${width}-dark.png`), fullPage: true })
      await screen.getByRole('button', { name: 'Switch to light mode' }).click()
    }
    await page.setViewportSize({ width: 375, height: 667 })
    await screen.getByText('Install on iPhone', { exact: true }).click()
    await expect(screen.getByText(/Turn on Open as Web App/)).toBeVisible()
    await screen.getByRole('button', { name: 'Sign out' }).scrollIntoViewIfNeeded()
    const row = await screen.getByRole('button', { name: 'Sign out' }).boundingBox()
    const dock = await page.getByRole('navigation', { name: 'Primary mobile navigation' }).boundingBox()
    expect(row!.y + row!.height).toBeLessThanOrEqual(dock!.y)
    await page.getByRole('link', { name: 'More', exact: true }).click()
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  })

  test('confirmed sign-out leaves the protected More page', async ({ page }) => {
    await page.route('**/auth/v1/logout*', route => route.fulfill({ status: 204 }))
    await page.goto('/more')
    await page.locator('.more-page').getByRole('button', { name: 'Sign out' }).click()
    await page.getByRole('button', { name: 'Yes, Log Me Out' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('.more-page')).toHaveCount(0)
  })

  test('broken avatars fall back and long profile names stay contained', async ({ page }) => {
    await page.route('**/rest/v1/profiles*', route => route.fulfill({ json: {
      id: 'test-user-id', full_name: 'A very long name '.repeat(12), avatar_url: 'https://avatar.invalid/missing.png',
    } }))
    await page.route('https://avatar.invalid/**', route => route.abort())
    await page.goto('/more')
    await expect(page.locator('.more-avatar')).toHaveText('A')
    expect(await page.locator('.more-page').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  })

  test('More text doubles at 200% and keyboard focus stays above the tabs', async ({ page }) => {
    await page.goto('/more')
    const screen = page.locator('.more-page')
    const label = screen.getByRole('link', { name: 'Debts', exact: true }).locator('.more-row-copy')
    const originalSize = await label.evaluate(el => parseFloat(getComputedStyle(el).fontSize))
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    expect(await label.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeCloseTo(originalSize * 2)
    await screen.locator('summary').click()
    await expect(screen.getByText(/Turn on Open as Web App/)).toBeVisible()
    await screen.getByRole('heading', { level: 1 }).focus()

    for (const control of await screen.locator('a, button, summary').all()) {
      await page.keyboard.press('Tab')
      await expect(control).toBeFocused()
      await expect.poll(async () => (await control.boundingBox())!.y).toBeGreaterThanOrEqual(0)
      await expect.poll(async () => {
        const bounds = await control.boundingBox()
        const dock = await page.getByRole('navigation', { name: 'Primary mobile navigation' }).boundingBox()
        return bounds!.y + bounds!.height - dock!.y
      }).toBeLessThanOrEqual(0)
      const bounds = await control.boundingBox()
      expect(bounds!.height).toBeGreaterThanOrEqual(44)
      expect(await control.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  })
})

test('unauthenticated More links return to More after signing in', async ({ page }) => {
  await page.goto('/more')
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => sessionStorage.getItem('pennywings:return'))).toBe('/more')
  await setupAuthenticatedMocks(page)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/more$/)
  await expect(page.getByRole('heading', { name: 'More', exact: true })).toBeVisible()
})
