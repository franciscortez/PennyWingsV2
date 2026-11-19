import { expect, test, type Page } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'
import { pickSource } from './helpers/paymentPicker'

const quickAdd = (page: Page) => page.getByRole('button', { name: 'Quick add transaction', exact: true })
const dial = (page: Page) => page.getByRole('menu', { name: 'Add another kind', exact: true })
const form = (page: Page) => page.getByRole('dialog', { name: 'New Transaction', exact: true })

const ready = async (page: Page, path: string) => {
  await page.goto(path)
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
}

test.describe('Mobile quick add', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test.beforeEach(async ({ page }) => { await setupAuthenticatedMocks(page) })

  test('a tap opens a new expense in place and records it', async ({ page }) => {
    let payload: Record<string, unknown> | undefined
    // An expense checks the source balance first (a single-row select).
    await page.route(
      (url) => url.pathname.endsWith('/rest/v1/e_wallets') && url.searchParams.get('select') === 'balance',
      (route) => route.fulfill({ status: 200, contentType: 'application/vnd.pgrst.object+json', body: JSON.stringify({ balance: 3500 }) }),
    )
    await page.route('**/rest/v1/rpc/process_transaction_checked*', async (route) => {
      payload = route.request().postDataJSON()
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
    })

    await ready(page, '/dashboard')
    await quickAdd(page).click()
    const dialog = form(page)
    await expect(dialog).toBeVisible()
    await expect(dial(page)).toHaveCount(0)
    await expect(dialog.getByRole('radio', { name: 'Expense', exact: true })).toHaveAttribute('aria-checked', 'true')
    // Phones type the amount with the system number keyboard, not a keypad.
    const amount = dialog.getByRole('textbox', { name: 'Amount (PHP)' })
    await expect(amount).toHaveAttribute('inputmode', 'decimal')
    await expect(dialog.getByRole('group', { name: 'Amount keypad' })).toHaveCount(0)

    await amount.fill('1250.75')
    await pickSource(page, dialog, 'Payment Method', 'E-Wallet', 'GCash')
    await dialog.getByRole('radio', { name: 'Groceries', exact: true }).click()
    await dialog.getByRole('button', { name: 'Save expense' }).click()

    await expect(dialog).toHaveCount(0)
    await expect.poll(() => payload?.p_type).toBe('expense')
    expect(payload?.p_amount).toBe(1250.75)
    await expect(page.locator('.swal2-toast')).toContainText('Transaction created.')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('"View all" shows every category on touch and scrolls the row to the choice', async ({ page, isMobile }) => {
    const names = ['Bills', 'Coffee', 'Eating Out', 'Groceries', 'Health', 'Pets', 'Rent', 'Shopping', 'Subscriptions', 'Transport', 'Travel', 'Utilities']
    await page.route('**/rest/v1/categories*', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(names.map((name, index) => ({ id: `cat-x${index}`, name, type: 'expense', icon: null, color: '#f472b6' }))),
    }))

    await ready(page, '/dashboard')
    await quickAdd(page).click()
    const dialog = form(page)
    const viewAll = dialog.getByRole('button', { name: 'View all 12 categories' })

    // Mouse and trackpad already see every chip, so the link is touch only.
    if (!isMobile) {
      await expect(dialog.getByRole('radio', { name: 'Utilities', exact: true })).toBeVisible()
      await expect(viewAll).toBeHidden()
      return
    }

    const row = dialog.getByRole('radiogroup', { name: 'Category' })
    const last = row.getByRole('radio', { name: 'Utilities', exact: true })
    // The last chip starts out past the row's edge.
    const outOfRow = async () => {
      const [rowBox, chipBox] = await Promise.all([row.boundingBox(), last.boundingBox()])
      return chipBox!.x + chipBox!.width > rowBox!.x + rowBox!.width + 1
    }
    expect(await outOfRow()).toBe(true)

    await viewAll.click()
    const sheet = page.getByRole('dialog', { name: 'Choose category' })
    await expect(sheet).toContainText('12 expense categories')
    await expect(sheet.getByRole('option')).toHaveCount(12)

    await sheet.getByRole('searchbox', { name: 'Search categories' }).fill('util')
    await expect(sheet.getByRole('option')).toHaveText(['Utilities'])
    await sheet.getByRole('option', { name: 'Utilities' }).click()

    await expect(sheet).toHaveCount(0)
    await expect(last).toHaveAttribute('aria-checked', 'true')
    await expect(viewAll).toBeFocused()
    await expect.poll(outOfRow).toBe(false)
  })

  test('the dial opens other kinds and the type switch covers every kind', async ({ page }) => {
    let payload: Record<string, unknown> | undefined
    await page.route('**/rest/v1/rpc/process_transaction_checked*', async (route) => {
      payload = route.request().postDataJSON()
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
    })

    await ready(page, '/accounts')
    // Right click (and press and hold on touch) fans out the other kinds.
    await quickAdd(page).click({ button: 'right' })
    await expect(dial(page).getByRole('menuitem')).toHaveText(['Income', 'Transfer', 'Withdraw'])
    await expect(dial(page).getByRole('menuitem', { name: 'Income' })).toBeFocused()
    await expect(quickAdd(page)).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(dial(page)).toHaveCount(0)
    await expect(quickAdd(page)).toBeFocused()

    // Shift+Enter is the keyboard route to the same dial.
    await page.keyboard.press('Shift+Enter')
    await page.keyboard.press('ArrowUp')
    await expect(dial(page).getByRole('menuitem', { name: 'Transfer' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    const dialog = form(page)
    await expect(dialog.getByRole('radio', { name: 'Income', exact: true })).toHaveAttribute('aria-checked', 'true')

    await dialog.getByRole('textbox', { name: 'Amount (PHP)' }).fill('250')
    await pickSource(page, dialog, 'Deposit To', 'E-Wallet', 'GCash')
    await dialog.getByRole('radio', { name: 'Salary', exact: true }).click()
    await dialog.getByRole('button', { name: 'Save income' }).click()
    await expect(dialog).toHaveCount(0)
    await expect.poll(() => payload?.p_type).toBe('income')
    expect(payload?.p_amount).toBe(250)

    for (const type of ['Transfer', 'Withdraw'] as const) {
      await quickAdd(page).click()
      await form(page).getByRole('radio', { name: type, exact: true }).click()
      await expect(form(page).getByRole('radio', { name: type, exact: true })).toHaveAttribute('aria-checked', 'true')
      await page.getByRole('button', { name: 'Close transaction form' }).click()
      await expect(form(page)).toHaveCount(0)
      await expect(quickAdd(page)).toBeFocused()
    }

    // A tap outside closes the dial without opening anything.
    await quickAdd(page).click({ button: 'right' })
    await expect(dial(page)).toBeVisible()
    await page.mouse.click(20, 200)
    await expect(dial(page)).toHaveCount(0)
    await expect(form(page)).toHaveCount(0)
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

    await quickAdd(page).click({ button: 'right' })
    for (const option of await dial(page).getByRole('menuitem').all()) {
      const box = await option.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    await page.keyboard.press('Escape')

    await page.getByRole('navigation', { name: 'Primary mobile navigation' }).getByRole('link', { name: 'Activity', exact: true }).click()
    await expect(page).toHaveURL(/\/transactions/)
    await expect(quickAdd(page)).toHaveCount(1)
    await quickAdd(page).click()
    await expect(form(page)).toBeVisible()
    await expect(page).toHaveURL(/\/transactions/)
    await page.getByRole('button', { name: 'Close transaction form' }).click()

    await page.goto('/dashboard')
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
    await expect(quickAdd(page)).toHaveCount(0)
  })
})
