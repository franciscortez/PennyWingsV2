import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

test.describe('Mobile bottom navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
    await page.goto('/dashboard')
    await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeVisible()
  })

  test('stays a fixed size on scroll and keeps accessible touch targets at 320px', async ({ page }, testInfo) => {
    const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
    const items = nav.locator('a, button')
    await expect(items).toHaveCount(6)
    await expect(nav.getByRole('link', { name: /Home/ })).toBeVisible()
    await expect(nav.getByRole('link', { name: /Monitor/ })).toBeVisible()
    await expect(nav.locator('.mobile-dock-label')).toHaveCount(0)
    await expect(nav).not.toHaveAttribute('data-shrunk', 'true')
    await expect(nav.locator('.mobile-dock-indicator')).toHaveCount(1)
    await expect(nav.locator('.mobile-dock-indicator')).toHaveAttribute('aria-hidden', 'true')

    for (const width of [320, 375, 430, 767]) {
      await page.setViewportSize({ width, height: 667 })
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      const before = await nav.boundingBox()
      expect(before).not.toBeNull()
      expect(before!.x).toBeGreaterThanOrEqual(12)
      expect(before!.y + before!.height).toBeLessThanOrEqual(656)
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
    await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('mobile-dock-light.png') })
  })

  test('navigates to each destination and marks the current route', async ({ page }) => {
    const destinations = [
      ['Accounts', '/accounts'], ['Activity', '/transactions'],
      ['Reports', '/reports'], ['Monitoring', '/monitoring'], ['Dashboard', '/dashboard'],
    ]
    for (const [name, path] of destinations) {
      const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
      await nav.getByRole('link', { name: new RegExp(name) }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(nav.getByRole('link', { name: new RegExp(name) })).toHaveAttribute('aria-current', 'page')
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)
    }
  })

  test('slides the active pill between tabs and never marks More as active', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
    const indicator = nav.locator('.mobile-dock-indicator')
    await expect(indicator).toHaveCount(1)
    await expect(indicator).toHaveAttribute('aria-hidden', 'true')

    const indicatorState = () => indicator.evaluate((element) => {
      const style = getComputedStyle(element)
      return `${style.transform}|${style.width}|${style.opacity}`
    })

    // The dock remounts on navigation and glides the pill from the previous
    // tab (360ms CSS transition after a rAF). Reading the transform
    // immediately after the URL changes can hit the detached old node
    // (empty computed style) or the glide start position, so wait for the
    // pill to settle before capturing a state for later comparison.
    const waitForSettledIndicator = async () => {
      await expect.poll(() => indicator.evaluate(
        (element) => `${element.isConnected}|${getComputedStyle(element).opacity}`,
      )).toBe('true|1')
      await expect.poll(async () => {
        const first = await indicatorState()
        if (first.split('|')[2] !== '1') return 'unsettled'
        await page.waitForTimeout(150)
        const second = await indicatorState()
        return first === second ? first : 'unsettled'
      }).not.toBe('unsettled')
    }

    await waitForSettledIndicator()
    const dashboardState = await indicatorState()

    await nav.getByRole('link', { name: /Accounts/ }).click()
    await expect(page).toHaveURL(/\/accounts$/)
    await waitForSettledIndicator()
    const accountsState = await indicatorState()
    expect(accountsState).not.toBe(dashboardState)

    await nav.getByRole('link', { name: /Activity/ }).click()
    await expect(page).toHaveURL(/\/transactions$/)
    await waitForSettledIndicator()
    const activityState = await indicatorState()
    expect(activityState).not.toBe(dashboardState)
    expect(activityState).not.toBe(accountsState)
    expect(activityState.split('|')[2]).toBe('1')

    const more = page.getByRole('button', { name: 'Open more navigation' })
    await expect(more).not.toHaveAttribute('data-selected', 'true')
    await more.click()
    await expect(page.getByRole('dialog', { name: 'Your space' })).toBeVisible()
    await expect(more).not.toHaveAttribute('data-selected', 'true')
    await expect.poll(indicatorState).toBe(activityState)
    await page.keyboard.press('Escape')
  })

  test('More contains focus, closes with Escape and backdrop, and restores scroll and focus', async ({ page }, testInfo) => {
    const more = page.getByRole('button', { name: 'Open more navigation' })
    await page.evaluate(() => window.scrollTo({ top: 250, behavior: 'instant' }))
    const scrollY = await page.evaluate(() => window.scrollY)
    await more.click()
    const panel = page.getByRole('dialog', { name: 'Your space' })
    await expect(panel).toBeVisible()
    await expect(more).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('button', { name: 'Close more navigation' })).toBeFocused()
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    await panel.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)))
    const navBox = await page.getByRole('navigation', { name: 'Primary mobile navigation' }).boundingBox()
    const panelBox = await panel.boundingBox()
    expect(panelBox!.y + panelBox!.height).toBeLessThan(navBox!.y)
    for (let index = 0; index < 7; index += 1) {
      await page.keyboard.press('Tab')
      expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }
    await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('mobile-more-light.png') })
    await page.keyboard.press('Escape')
    await expect(panel).not.toBeVisible()
    await expect(more).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY)
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    await more.click()
    await panel.click({ position: { x: -5, y: -5 }, force: true })
    await expect(panel).not.toBeVisible()
  })

  test('supports dark mode, profile selection, and assistant handoff', async ({ page }, testInfo) => {
    const more = page.getByRole('button', { name: 'Open more navigation' })
    await more.click()
    const panel = page.getByRole('dialog', { name: 'Your space' })
    await panel.getByRole('button', { name: 'Switch to dark mode' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('mobile-more-dark.png') })
    await panel.getByRole('link', { name: /Profile & settings/ }).click()
    await expect(page).toHaveURL(/\/profile$/)
    await expect(panel).not.toBeVisible()
    await expect(more).not.toHaveAttribute('data-selected', 'true')
    await expect.poll(() => page.getByRole('navigation', { name: 'Primary mobile navigation' }).locator('.mobile-dock-indicator').evaluate((element) => getComputedStyle(element).opacity)).toBe('0')
    await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('mobile-dock-dark.png') })
    await more.click()
    await panel.getByRole('button', { name: /AI Assistant/ }).click()
    await expect(panel).not.toBeVisible()
    const assistant = page.getByRole('dialog').filter({ hasNot: page.getByText('Your space', { exact: true }) })
    await expect(assistant).toBeVisible()
    expect(await assistant.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  })

  test('restores page before sign-out confirmation and lets the user cancel', async ({ page }) => {
    await page.getByRole('button', { name: 'Open more navigation' }).click()
    await page.getByRole('dialog', { name: 'Your space' }).getByRole('button', { name: 'Sign out' }).click()
    await expect(page.getByRole('dialog', { name: 'Your space' })).not.toBeVisible()
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeVisible()
  })

  test('fits short screens and dismisses the modal when switching to desktop', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 667, height: 320 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Open more navigation' }).click()
    const panel = page.getByRole('dialog', { name: 'Your space' })
    await expect(panel).toBeVisible()
    const bounds = await panel.boundingBox()
    expect(bounds!.y).toBeGreaterThanOrEqual(12)
    await panel.getByRole('button', { name: 'Sign out' }).scrollIntoViewIfNeeded()
    await expect(panel.getByRole('button', { name: 'Sign out' })).toBeInViewport()
    expect(await panel.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(panel).not.toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.screenshot({ animations: 'disabled', path: testInfo.outputPath('desktop-sidebar.png') })
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(panel).not.toBeVisible()
    await page.getByRole('button', { name: 'Open more navigation' }).click()
    await expect(panel).toBeVisible()
  })
})
