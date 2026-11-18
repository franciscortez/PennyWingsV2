import { expect, test, type Page } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'
import { pickSource } from './helpers/paymentPicker'

const quickAdd = (page: Page) => page.getByRole('button', { name: 'Quick add transaction', exact: true })
const menu = (page: Page) => page.getByRole('dialog', { name: 'Quick add', exact: true })
const form = (page: Page) => page.getByRole('dialog', { name: 'New Transaction', exact: true })

const ready = async (page: Page, path: string) => {
  await page.goto(path)
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
}

test.describe('Mobile quick add', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test.beforeEach(async ({ page }) => { await setupAuthenticatedMocks(page) })

  test('records an income from Dashboard without leaving the page', async ({ page }) => {
    let payload: Record<string, unknown> | undefined
    await page.route('**/rest/v1/rpc/process_transaction_checked*', async (route) => {
      payload = route.request().postDataJSON()
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
    })

    await ready(page, '/dashboard')
    await quickAdd(page).click()
    await expect(menu(page)).toBeVisible()
    const options = menu(page).getByRole('list', { name: 'Transaction kinds' }).getByRole('button')
    await expect(options).toHaveText([/^Expense/, /^Income/, /^Transfer \/ Deposit/, /^Withdrawal/])
    await expect(menu(page).locator('.quick-add-option-icon svg')).toHaveCount(4)

    await options.filter({ hasText: /^Income/ }).click()
    await expect(menu(page)).toHaveCount(0)
    const dialog = form(page)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'income', exact: true })).toHaveAttribute('aria-pressed', 'true')

    await dialog.getByRole('textbox', { name: 'Amount (PHP)' }).fill('250')
    await pickSource(page, dialog, 'Payment Method', 'E-Wallet', 'GCash')
    await dialog.locator('#transaction-category').selectOption('cat-1')
    await dialog.getByRole('button', { name: 'Save Transaction' }).click()

    await expect(dialog).toHaveCount(0)
    await expect.poll(() => payload?.p_type).toBe('income')
    expect(payload?.p_amount).toBe(250)
    await expect(page.locator('.swal2-toast')).toContainText('Transaction created.')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('each kind opens the form on that type and focus returns to the button', async ({ page }) => {
    await ready(page, '/accounts')
    for (const [option, type] of [
      ['Expense', 'expense'],
      ['Transfer / Deposit', 'Transfer/Deposit'],
      ['Withdrawal', 'withdrawal'],
    ] as const) {
      await quickAdd(page).click()
      await menu(page).getByRole('button', { name: new RegExp(`^${option.replace('/', '\\/')}`) }).click()
      await expect(form(page).getByRole('button', { name: type, exact: true })).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Close transaction form' }).click()
      await expect(form(page)).toHaveCount(0)
      await expect(quickAdd(page)).toBeFocused()
    }

    await quickAdd(page).click()
    await page.keyboard.press('Escape')
    await expect(menu(page)).toHaveCount(0)
    await expect(quickAdd(page)).toBeFocused()
  })

  test('sits above the dock on the right, clears content, shows on Activity and is absent on desktop', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await ready(page, '/dashboard')
    for (const width of [320, 390, 440]) {
      await page.setViewportSize({ width, height: 700 })
      const button = await quickAdd(page).boundingBox()
      const dock = await page.getByRole('navigation', { name: 'Primary mobile navigation' }).boundingBox()
      expect(button!.width).toBe(56)
      expect(button!.height).toBe(56)
      expect(width - (button!.x + button!.width)).toBeCloseTo(16, 0)
      expect(dock!.y - (button!.y + button!.height)).toBeCloseTo(16, 0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)

      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
      const content = await page.locator('.app-content > :last-child').boundingBox()
      expect(content!.y + content!.height).toBeLessThanOrEqual(button!.y - 32 + 1)
    }

    expect(await quickAdd(page).evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s')

    await quickAdd(page).click()
    for (const option of await menu(page).getByRole('button').all()) {
      const box = await option.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    await page.keyboard.press('Escape')

    await page.getByRole('navigation', { name: 'Primary mobile navigation' }).getByRole('link', { name: 'Activity', exact: true }).click()
    await expect(page).toHaveURL(/\/transactions/)
    await expect(quickAdd(page)).toHaveCount(1)
    await quickAdd(page).click()
    await menu(page).getByRole('button', { name: /^Expense/ }).click()
    await expect(form(page)).toBeVisible()
    await expect(page).toHaveURL(/\/transactions/)
    await page.getByRole('button', { name: 'Close transaction form' }).click()

    await page.goto('/dashboard')
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
    await expect(quickAdd(page)).toHaveCount(0)
  })
})
