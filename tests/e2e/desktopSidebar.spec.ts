import { writeFile } from 'node:fs/promises'
import { expect, test, type Locator } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'

const destinations = [
  ['Dashboard', '/dashboard'],
  ['Accounts', '/accounts'],
  ['Activity', '/transactions'],
  ['Reports', '/reports'],
  ['Monitoring', '/monitoring'],
  ['Settings', '/profile'],
] as const

// Canvas resolves Tailwind's oklch and color-mix values to sRGB. Composite
// translucent backgrounds before calculating WCAG relative luminance.
async function contrast(locator: Locator) {
  return locator.evaluate((element) => {
    const context = document.createElement('canvas').getContext('2d')!
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
      return [r, g, b, a / 255]
    }
    const composite = (foreground: number[], background: number[]) => [
      ...foreground.slice(0, 3).map((value, index) =>
        value * foreground[3] + background[index] * (1 - foreground[3])),
      1,
    ]
    const luminance = (color: number[]) => color.slice(0, 3)
      .map((value) => value / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
    const ratio = (first: number[], second: number[]) => {
      const a = luminance(first)
      const b = luminance(second)
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    }
    const ancestors: Element[] = []
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      ancestors.unshift(parent)
    }
    let parentBackground = [255, 255, 255, 1]
    for (const ancestor of ancestors) {
      parentBackground = composite(rgba(getComputedStyle(ancestor).backgroundColor), parentBackground)
    }
    const style = getComputedStyle(element)
    const background = composite(rgba(style.backgroundColor), parentBackground)
    const foreground = composite(rgba(style.color), background)
    return {
      foreground: foreground.slice(0, 3),
      background: background.slice(0, 3),
      text: ratio(foreground, background),
      focus: ratio(composite(rgba(style.outlineColor), parentBackground), parentBackground),
      outlineWidth: parseFloat(style.outlineWidth),
    }
  })
}

test.describe('Desktop sidebar', () => {
  test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' })

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('Mobile'), 'Desktop interactions use desktop browser projects.')
    await setupAuthenticatedMocks(page)
    await page.goto('/dashboard')
    await expect(page.getByRole('complementary', { name: 'Desktop sidebar' })).toBeVisible()
  })

  test('keeps destinations, active semantics, profile and collapse persistence', async ({ page }) => {
    let sidebar = page.getByRole('complementary', { name: 'Desktop sidebar' })
    const expand = sidebar.getByRole('button', { name: 'Expand sidebar' })
    await expect(expand).toHaveAttribute('aria-expanded', 'false')
    await expect(sidebar.getByRole('link', { name: 'PennyWings' })).toHaveCount(0)
    await expand.click()
    await expect(sidebar.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute('aria-expanded', 'true')
    await expect(sidebar).toContainText('Test User')
    await expect(sidebar).toContainText('test@example.com')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('sidebarOpen'))).toBe('true')

    await page.reload()
    sidebar = page.getByRole('complementary', { name: 'Desktop sidebar' })
    await expect(sidebar.getByRole('button', { name: 'Collapse sidebar' })).toBeVisible()
    for (const [name, path] of destinations) {
      const nav = page.getByRole('navigation', { name: 'Primary desktop navigation' })
      await expect(nav.getByRole('link')).toHaveCount(6)
      await nav.getByRole('link', { name, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      const currentNav = page.getByRole('navigation', { name: 'Primary desktop navigation' })
      await expect(currentNav.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page')
      await expect(currentNav.locator('[aria-current="page"]')).toHaveCount(1)
    }
    await sidebar.getByRole('button', { name: 'Collapse sidebar' }).click()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('sidebarOpen'))).toBe('false')
    await page.reload()
    await expect(sidebar.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('supports keyboard focus, hoverable tooltips and Escape dismissal', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Desktop sidebar' })
    const toggle = sidebar.locator('button[aria-expanded]')
    await page.keyboard.press('Tab')
    await expect(toggle).toBeFocused()
    await expect(page.getByRole('tooltip', { name: 'Expand sidebar', exact: true })).toBeVisible()
    await page.keyboard.press('Space')
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAccessibleName('Collapse sidebar')
    await page.keyboard.press('Space')
    await expect(toggle).toBeFocused()
    await expect(toggle).toHaveAccessibleName('Expand sidebar')

    await page.keyboard.press('Tab')
    const dashboard = sidebar.getByRole('navigation').getByRole('link', { name: 'Dashboard' })
    await expect(dashboard).toBeFocused()
    const tooltip = page.getByRole('tooltip', { name: 'Dashboard', exact: true })
    await expect(tooltip).toBeVisible()
    await expect(dashboard).toHaveAttribute('aria-describedby', await tooltip.getAttribute('id') as string)
    expect((await contrast(dashboard)).outlineWidth).toBeGreaterThanOrEqual(2)
    await page.keyboard.press('Escape')
    await expect(tooltip).toHaveCount(0)
    await expect(dashboard).toBeFocused()
    const remainingControls = [
      ...destinations.slice(1).map(([name]) => sidebar.getByRole('navigation').getByRole('link', { name, exact: true })),
      sidebar.getByRole('link', { name: 'Settings for Test User' }),
      sidebar.getByRole('button', { name: 'Switch to dark mode' }),
      sidebar.getByRole('button', { name: 'Sign out' }),
    ]
    for (const control of remainingControls) {
      await page.keyboard.press('Tab')
      await expect(control).toBeFocused()
    }
    for (let index = 1; index < remainingControls.length; index++) await page.keyboard.press('Shift+Tab')
    await expect(remainingControls[0]).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/accounts$/)

    // Remove keyboard focus before exercising pointer persistence.
    await page.locator('h1').click()
    const reports = sidebar.getByRole('navigation').getByRole('link', { name: 'Reports' })
    await reports.hover()
    const reportsTooltip = page.getByRole('tooltip', { name: 'Reports', exact: true })
    await expect(reportsTooltip).toBeVisible()
    await reportsTooltip.hover()
    await expect(reportsTooltip).toBeVisible()
    const bounds = await reportsTooltip.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1280)
    await page.keyboard.press('Escape')
    await expect(reportsTooltip).toHaveCount(0)
  })

  test('switches themes and keeps sign-out confirmation cancelable', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Desktop sidebar' })
    await sidebar.getByRole('button', { name: 'Switch to dark mode' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(sidebar.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
    await sidebar.getByRole('button', { name: 'Sign out' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(sidebar).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`${theme} states pass contrast and match the brand`, async ({ page }, testInfo) => {
      // Both sizes exercise every control in four states, including real transitions.
      test.setTimeout(90_000)
      const sidebar = page.getByRole('complementary', { name: 'Desktop sidebar' })
      if (theme === 'dark') await sidebar.getByRole('button', { name: 'Switch to dark mode' }).click()
      await sidebar.getByRole('button', { name: 'Expand sidebar' }).click()
      await page.evaluate(() => document.fonts.ready)
      const measurements: Array<Record<string, unknown>> = []
      for (const expanded of [true, false]) {
        if (!expanded) await sidebar.getByRole('button', { name: 'Collapse sidebar' }).click()
        // Record each control, icon, and profile text in settled states.
        for (const control of await sidebar.locator('a, button').all()) {
          const name = await control.getAttribute('aria-label') || await control.innerText()
          for (const state of ['default', 'hover', 'pressed', 'focus'] as const) {
            await page.mouse.move(1100, 20)
            await control.evaluate((element) => (element as HTMLElement).blur())
            if (state === 'hover' || state === 'pressed') await control.hover()
            if (state === 'pressed') await page.mouse.down()
            if (state === 'focus') {
              // Enter keyboard modality, then focus the intended control.
              await page.keyboard.press('Tab')
              await control.focus()
            }
            // Settle actual CSS transitions rather than sampling intermediate colors.
            await control.evaluate(async (element) => {
              void getComputedStyle(element).color
              await Promise.all(element.getAnimations().map((animation) =>
                animation.finished.catch(() => undefined)))
            })
            await expect.poll(async () => (await contrast(control)).text).toBeGreaterThanOrEqual(4.5)
            const measured = await contrast(control)
            if (state === 'focus') {
              expect(measured.outlineWidth).toBeGreaterThanOrEqual(2)
              expect(measured.focus).toBeGreaterThanOrEqual(3)
            }
            const icons = await control.locator('svg').all()
            for (const icon of icons) expect((await contrast(icon)).text).toBeGreaterThanOrEqual(3)
            for (const text of await control.locator('span:not(:has(span)):not(:empty)').all()) {
              if ((await text.innerText()).trim()) expect((await contrast(text)).text).toBeGreaterThanOrEqual(4.5)
            }
            measurements.push({ name, expanded, state, ...measured })
            const tooltipId = await control.getAttribute('aria-describedby')
            if (tooltipId) {
              const tooltipText = page.locator(`[id="${tooltipId}"] > div`)
              const tooltipContrast = await contrast(tooltipText)
              expect(tooltipContrast.text).toBeGreaterThanOrEqual(4.5)
              measurements.push({ name: `${name} tooltip`, expanded, state, ...tooltipContrast })
            }
            if (state === 'pressed') {
              // Release outside the control so measurement cannot trigger navigation.
              await page.mouse.move(1100, 20)
              await page.mouse.up()
            }
          }
        }
        await page.locator('h1').click()
        await page.mouse.move(1100, 20)
        await expect(page.locator('[role="tooltip"]:not(#assistant-launcher-tooltip)')).toHaveCount(0)
        await page.screenshot({ path: testInfo.outputPath(`sidebar-${theme}-${expanded ? 'expanded' : 'collapsed'}.png`) })
      }
      const contrastPath = testInfo.outputPath(`contrast-${theme}.json`)
      await writeFile(contrastPath, JSON.stringify(measurements, null, 2))
      await testInfo.attach(`contrast-${theme}`, { path: contrastPath, contentType: 'application/json' })
      expect(await sidebar.evaluate((element) => getComputedStyle(element).fontFamily)).toContain('Geist')
    })
  }

  test('handles short viewports, responsive boundaries, long profile text and reduced motion', async ({ page }, testInfo) => {
    const sidebar = page.getByRole('complementary', { name: 'Desktop sidebar' })
    await sidebar.getByRole('navigation').getByRole('link', { name: 'Accounts' }).hover()
    await expect(page.getByRole('tooltip', { name: 'Accounts', exact: true })).toBeVisible()
    await page.setViewportSize({ width: 767, height: 800 })
    await expect(page.getByRole('tooltip', { name: 'Accounts', exact: true })).toHaveCount(0)
    await page.setViewportSize({ width: 1280, height: 800 })
    await sidebar.getByRole('button', { name: 'Expand sidebar' }).click()
    for (const width of [320, 767, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 800 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      if (width < 768) {
        await expect(sidebar).toBeHidden()
        await expect(page.getByRole('navigation', { name: 'Primary mobile navigation' })).toBeVisible()
        if (width === 320) await page.screenshot({ path: testInfo.outputPath('mobile-320.png') })
      } else {
        await expect(sidebar).toBeVisible()
        const expectedWidth = width < 1280 ? 288 : 320
        expect((await sidebar.boundingBox())!.width).toBe(expectedWidth)
      }
    }

    // 640x400 CSS pixels exercises the reflow used by a 1280x800 screen at 200% zoom.
    await page.setViewportSize({ width: 640, height: 400 })
    await expect(sidebar).toBeHidden()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(640)
    await page.setViewportSize({ width: 768, height: 320 })
    const signOut = sidebar.getByRole('button', { name: 'Sign out' })
    await signOut.focus()
    const bounds = await signOut.boundingBox()
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(320)
    await sidebar.getByRole('navigation').getByRole('link', { name: 'Dashboard' }).focus()
    const dashboardBounds = await sidebar.getByRole('navigation').getByRole('link', { name: 'Dashboard' }).boundingBox()
    expect(dashboardBounds!.y).toBeGreaterThanOrEqual(0)

    await page.route('**/rest/v1/profiles*', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: 'test-user-id', full_name: 'Long profile name '.repeat(15), avatar_url: '/missing-avatar.png' }),
    }))
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.reload()
    await expect(sidebar.locator('[aria-busy="false"]')).toContainText('Long profile name')
    await expect(sidebar.locator('[aria-busy] img')).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(1280)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const element of [sidebar, page.locator('main'), sidebar.getByRole('button', { name: 'Collapse sidebar' })]) {
      await expect.poll(() => element.evaluate((node) => {
        const style = getComputedStyle(node)
        return style.transitionProperty === 'none' ||
          style.transitionDuration.split(',').every((duration) => parseFloat(duration) === 0)
      })).toBe(true)
    }
    await sidebar.getByRole('button', { name: 'Collapse sidebar' }).click()
    expect((await sidebar.boundingBox())!.width).toBe(96)
    await sidebar.getByRole('button', { name: 'Expand sidebar' }).click()
    for (const target of await sidebar.locator('a, button').all()) {
      const size = await target.boundingBox()
      expect(size!.width).toBeGreaterThanOrEqual(44)
      expect(size!.height).toBeGreaterThanOrEqual(44)
    }
  })
})
