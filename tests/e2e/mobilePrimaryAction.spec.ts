import { expect, test, type Page } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

const navigation = (page: Page) => page.getByRole('navigation', { name: 'Primary mobile navigation' })
const noDuplicateAction = async (page: Page) => {
  await expect(page.locator('[data-mobile-primary-action], .mobile-primary-action')).toHaveCount(0)
  await expect(page.locator('.mobile-navigation-shell').getByRole('button', { name: /New transaction|Add account|New budget|New goal/i })).toHaveCount(0)
  await expect(navigation(page).locator('a, button')).toHaveCount(5)
}

const ready = async (page: Page, path: string) => {
  await page.goto(path)
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByLabel('Loading dashboard')).toHaveCount(0)
  await expect(navigation(page)).toBeVisible()
}

test.describe('Page actions without duplicate mobile buttons', () => {
  test.use({ viewport: { width: 375, height: 667 } })
  test.beforeEach(async ({ page }) => { await setupAuthenticatedMocks(page) })

  for (const dark of [false, true]) {
    test(`no contextual pill on any authenticated page in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.addInitScript(dark => localStorage.setItem('theme', dark ? 'dark' : 'light'), dark)
      for (const path of ['/dashboard', '/transactions', '/accounts', '/accounts?tab=cards', '/accounts?tab=wallets', '/accounts?tab=cash', '/accounts?tab=lent', '/monitoring?tab=budgets', '/monitoring?tab=goals', '/reports', '/profile']) {
        await ready(page, path)
        await noDuplicateAction(page)
      }
    })
  }

  test('Activity keeps one working page composer; Dashboard navigation does not auto-open it', async ({ page }) => {
    await ready(page, '/dashboard')
    await navigation(page).getByRole('link', { name: 'Activity', exact: true }).click()
    const create = page.getByRole('main').getByRole('button', { name: 'New Transaction', exact: true })
    await expect(create).toBeVisible()
    await expect(create).toHaveCount(1)
    const dialog = page.getByRole('dialog', { name: 'New Transaction', exact: true })
    await expect(dialog).toHaveCount(0)
    await create.click()
    await expect(dialog).toBeVisible()
    await page.getByRole('button', { name: 'Close transaction form' }).click()
    await expect(dialog).toHaveCount(0)
    await page.reload()
    await expect(create).toBeVisible()
    await expect(dialog).toHaveCount(0)
    await noDuplicateAction(page)
  })

  test('Accounts and Monitoring retain their existing page actions', async ({ page }) => {
    await ready(page, '/accounts')
    const account = page.getByRole('main').getByRole('button', { name: 'Add account', exact: true })
    await expect(account).toHaveCount(1)
    await account.click()
    await expect(page.getByRole('button', { name: 'Close account setup' })).toBeVisible()
    await page.getByRole('button', { name: 'Close account setup' }).click()
    await ready(page, '/monitoring')
    const budget = page.getByRole('main').locator('header').getByRole('button', { name: 'New budget', exact: true })
    await expect(budget).toHaveCount(1)
    await budget.click()
    await expect(page.getByRole('dialog', { name: 'New budget', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Goals', exact: true }).click()
    const goal = page.getByRole('main').locator('header').getByRole('button', { name: 'New goal', exact: true })
    await expect(goal).toHaveCount(1)
    await goal.click()
    await expect(page.getByRole('dialog', { name: 'New goal', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await noDuplicateAction(page)
  })

  test('dock hides for a simulated keyboard without changing page clearance', async ({ page }) => {
    await ready(page, '/transactions')
    const setViewport = async (lostHeight: number, scale = 1) => page.evaluate(({ lostHeight, scale }) => {
      const viewport = window.visualViewport!
      Object.defineProperty(viewport, 'height', { configurable: true, value: (window.innerHeight - lostHeight) / scale })
      Object.defineProperty(viewport, 'scale', { configurable: true, value: scale })
      viewport.dispatchEvent(new Event('resize'))
    }, { lostHeight, scale })
    await setViewport(70)
    await expect(navigation(page)).toBeVisible()
    await setViewport(0, 2)
    await expect(navigation(page)).toBeVisible()
    const padding = await page.locator('.app-content').evaluate(element => getComputedStyle(element).paddingBottom)
    await setViewport(300)
    await expect(navigation(page)).not.toBeVisible()
    expect(await page.locator('.app-content').evaluate(element => getComputedStyle(element).paddingBottom)).toBe(padding)
    await setViewport(0)
    await expect(navigation(page)).toBeVisible()
    await noDuplicateAction(page)
  })

  test('dock keeps safe-area clearance, narrow layout and reduced motion', async ({ page }, testInfo) => {
    await ready(page, '/dashboard')
    for (const width of [320, 390, 440, 767]) {
      await page.setViewportSize({ width, height: 667 })
      const box = await navigation(page).boundingBox()
      expect(box!.x).toBeCloseTo(0, 1)
      expect(box!.width).toBeCloseTo(width, 1)
      await noDuplicateAction(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    }
    await page.setViewportSize({ width: 375, height: 667 })
    await page.locator('html').evaluate(element => element.style.setProperty('--mobile-safe-bottom', '34px'))
    const box = await navigation(page).boundingBox()
    expect(box!.y + box!.height).toBeCloseTo(667 - 34, 1)
    const shell = await page.locator('.mobile-navigation-shell').boundingBox()
    expect(shell!.y + shell!.height).toBeCloseTo(667, 1)
    expect(shell!.height).toBe(68 + 34)
    expect(await page.locator('.app-content').evaluate(element => getComputedStyle(element).paddingBottom)).toBe('134px')
    const indicator = await navigation(page).locator('.mobile-dock-indicator').boundingBox()
    expect(indicator!.y + indicator!.height).toBeLessThanOrEqual(box!.y + box!.height)
    await page.screenshot({ path: testInfo.outputPath('mobile-dock-no-action.png'), animations: 'disabled' })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await navigation(page).locator('.mobile-dock-indicator').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s')
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(navigation(page)).not.toBeVisible()
  })

  test('bar fills the safe area while More and toasts stay above it in portrait and landscape', async ({ page }) => {
    await ready(page, '/dashboard')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.locator('html').evaluate(element => {
      element.style.setProperty('--mobile-safe-bottom', '34px')
      element.style.setProperty('--mobile-safe-left', '44px')
      element.style.setProperty('--mobile-safe-right', '44px')
    })

    for (const viewport of [{ width: 390, height: 844 }, { width: 667, height: 320 }]) {
      await page.setViewportSize(viewport)
      const shell = page.locator('.mobile-navigation-shell')
      const bar = await shell.boundingBox()
      expect(bar!.x).toBe(0)
      expect(bar!.width).toBe(viewport.width)
      expect(bar!.y + bar!.height).toBe(viewport.height)
      const items = navigation(page).locator('a, button')
      const first = await items.first().boundingBox()
      const last = await items.last().boundingBox()
      expect(first!.x).toBeGreaterThanOrEqual(44)
      expect(last!.x + last!.width).toBeLessThanOrEqual(viewport.width - 44)
      for (const item of await items.all()) {
        const box = await item.boundingBox()
        expect(box!.width).toBeGreaterThanOrEqual(44)
        expect(box!.height).toBeGreaterThanOrEqual(44)
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height - 34)
      }

      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
      const content = await page.locator('.app-content > :last-child').boundingBox()
      expect(content!.y + content!.height).toBeLessThanOrEqual(bar!.y - 32 + 1)

      await page.getByRole('button', { name: 'Open more navigation' }).click()
      const panel = page.getByRole('dialog', { name: 'Your space' })
      const panelBox = await panel.boundingBox()
      expect(bar!.y - panelBox!.y - panelBox!.height).toBeCloseTo(12, 1)
      expect(panelBox!.y).toBeGreaterThanOrEqual(12)
      await panel.getByRole('button', { name: 'Switch to dark mode' }).click()
      expect(await shell.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(
        await navigation(page).evaluate(element => getComputedStyle(element).backgroundColor),
      )
      await panel.getByRole('button', { name: 'Switch to light mode' }).click()
      await page.keyboard.press('Escape')

      // Exercise the real toast integration without changing account data.
      await page.evaluate(async () => {
        const alertModule = '/src/lib/alert.ts'
        const { alerts } = await import(/* @vite-ignore */ alertModule)
        alerts.info('Navigation spacing check')
      })
      const toast = page.locator('.mobile-alert-toast')
      await expect(toast).toBeVisible()
      const toastBox = await toast.boundingBox()
      expect(bar!.y - toastBox!.y - toastBox!.height).toBeCloseTo(12, 1)
      expect(toastBox!.x).toBeGreaterThanOrEqual(44)
      expect(toastBox!.x + toastBox!.width).toBeLessThanOrEqual(viewport.width - 44)
      await expect(toast).toHaveCount(0)
    }
  })

  test('More sheet stays reachable with enlarged text and long profile names', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 })
    await page.route('**/rest/v1/profiles*', route => route.fulfill({ json: { id: 'test-user-id', full_name: 'A very long profile name '.repeat(8), avatar_url: null } }))
    await ready(page, '/dashboard')
    await page.addStyleTag({ content: 'html { font-size: 200%; }' })
    await noDuplicateAction(page)
    await page.getByRole('button', { name: 'Open more navigation' }).click()
    const panel = page.getByRole('dialog', { name: 'Your space' })
    expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    await panel.getByRole('button', { name: 'Sign out' }).scrollIntoViewIfNeeded()
    await expect(panel.getByRole('button', { name: 'Sign out' })).toBeInViewport()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Open more navigation' })).toBeFocused()
  })
})
