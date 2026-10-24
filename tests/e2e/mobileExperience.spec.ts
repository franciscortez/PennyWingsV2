import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

test.use({ viewport: { width: 390, height: 844 } })
test.beforeEach(async ({ page }) => { await setupAuthenticatedMocks(page) })

test('money entry groups thousands while preserving cents and cursor edits', async ({ page }, testInfo) => {
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'New Transaction' }).click()
  const amount = page.getByRole('textbox', { name: 'Amount (PHP)' })
  await expect(amount).toHaveAttribute('inputmode', 'decimal')
  await amount.pressSequentially('22222.50')
  await expect(amount).toHaveValue('22,222.50')
  await amount.evaluate((input: HTMLInputElement) => input.setSelectionRange(1, 1))
  await amount.press('9')
  await expect(amount).toHaveValue('292,222.50')
  expect(await amount.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(2)
  await amount.fill('2,222,222.25')
  await expect(amount).toHaveValue('2,222,222.25')
  await page.screenshot({ path: testInfo.outputPath('grouped-money-input.png'), animations: 'disabled' })
  await amount.fill('')
  await expect(amount).toHaveValue('')
})

test('new debt submits the unformatted numeric amount', async ({ page }) => {
  await page.goto('/debts')
  await page.getByRole('button', { name: 'Add Debt' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add New Debt' })
  await dialog.getByLabel('Provider or Creditor Name').fill('Example provider')
  const amount = dialog.getByLabel('Total Amount (PHP)')
  await amount.pressSequentially('22222.50')
  await expect(amount).toHaveValue('22,222.50')
  const request = page.waitForRequest(request => request.url().includes('/rpc/create_debt_checked') && request.method() === 'POST')
  await dialog.getByRole('button', { name: 'Create Debt' }).click()
  expect((await request).postDataJSON()).toMatchObject({ p_original_amount: 22222.5 })
  await expect(dialog).not.toBeVisible()
})

test('transaction sheet is bottom attached, preserves input through a nested picker, and remains bounded in landscape', async ({ page }) => {
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'New Transaction' }).click()
  const dialog = page.getByRole('dialog', { name: 'New Transaction' })
  await expect(dialog).toBeVisible()
  await expect.poll(async () => { const box = await dialog.boundingBox(); return Math.round(box!.y + box!.height) }).toBe(844)
  await dialog.getByPlaceholder('Short note...').fill('Keep this draft')
  const picker = dialog.getByRole('button', { name: /Cash.*No cash account/ })
  await picker.click()
  await expect(page.getByRole('dialog', { name: 'Pay with' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog.getByPlaceholder('Short note...')).toHaveValue('Keep this draft')
  for (const viewport of [{ width: 320, height: 568 }, { width: 667, height: 320 }]) {
    await page.setViewportSize(viewport)
    await expect.poll(async () => {
      const bounds = await dialog.boundingBox()
      return bounds!.y + bounds!.height
    }).toBeLessThanOrEqual(viewport.height + 1)
    const box = await dialog.boundingBox()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1)
    await dialog.getByRole('button', { name: 'Save Transaction' }).scrollIntoViewIfNeeded()
    await expect(dialog.getByRole('button', { name: 'Save Transaction' })).toBeInViewport()
  }
})

test('secondary routes live in More and the active action is distinct from a page link', async ({ page }) => {
  await page.goto('/dashboard')
  const more = page.getByRole('button', { name: 'Open more navigation' })
  await more.click()
  await page.getByRole('dialog', { name: 'Your space' }).getByRole('link', { name: 'Debts', exact: true }).click()
  await expect(page).toHaveURL(/\/debts$/)
  await expect(more).toHaveAttribute('data-selected', 'true')
  await expect(more).not.toHaveAttribute('aria-current')
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await more.click()
  await expect(page.getByRole('dialog', { name: 'Your space' }).getByRole('link', { name: 'Debts', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByText('Install on iPhone', { exact: true }).click()
  await expect(page.getByText(/Turn on Open as Web App/)).toBeVisible()
})

test('account summaries and filter rows wrap without horizontal scrolling', async ({ page }) => {
  for (const width of [320, 390, 440]) {
    await page.setViewportSize({ width, height: 844 })
    for (const route of ['accounts', 'transactions']) {
      await page.goto(`/${route}`)
      await expect(page.locator('main h1')).toBeVisible()
      const overflows = await page.locator('main').evaluate((main) => Array.from(main.querySelectorAll('*')).filter((element) => {
        const style = getComputedStyle(element)
        return ['auto', 'scroll'].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1
      }).map((element) => element.tagName))
      expect(overflows).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    }
  }
})

test('account creation is a content-height bottom sheet, not fullscreen', async ({ page }) => {
  await page.goto('/accounts')
  await page.getByRole('button', { name: 'Add account', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect.poll(async () => { const box = await dialog.boundingBox(); return Math.round(box!.y + box!.height) }).toBe(844)
  const box = await dialog.boundingBox()
  expect(box!.y).toBeGreaterThan(100)
  await expect(dialog.getByRole('button', { name: 'Continue' })).toBeInViewport()
})

test('report month and transaction filters survive tab switches; reselect keeps the URL', async ({ page }) => {
  await page.goto('/reports?month=2026-02&view=summary')
  const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
  await nav.getByRole('link', { name: 'Activity' }).click()
  await page.getByRole('group', { name: 'Filter Type' }).getByRole('button', { name: 'expense', exact: true }).click()
  const activityUrl = page.url()
  await nav.getByRole('link', { name: 'Reports' }).click()
  await expect(page).toHaveURL(/month=2026-02&view=summary/)
  await nav.getByRole('link', { name: 'Activity' }).click()
  await expect(page).toHaveURL(activityUrl)
  await nav.getByRole('link', { name: 'Activity' }).click()
  await expect(page).toHaveURL(activityUrl)
})

test('warm offline notice retains the current form draft', async ({ page, context }) => {
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'New Transaction' }).click()
  await page.getByPlaceholder('Short note...').fill('Still here')
  await context.setOffline(true)
  await expect(page.getByPlaceholder('Short note...')).toHaveValue('Still here')
  await expect(page.getByRole('dialog', { name: 'New Transaction' }).getByRole('status')).toContainText("You're offline")
  await page.getByRole('button', { name: /Close transaction/i }).click()
  await expect(page.getByRole('status')).toContainText("You're offline")
  await context.setOffline(false)
  await expect(page.getByRole('status')).toContainText('Connection detected')
  await page.getByRole('button', { name: 'Refresh records', exact: true }).click()
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('password login restores the protected URL including filters', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.locator('main h1')).toBeVisible()
  const stored = await page.evaluate(() => Object.entries(localStorage).find(([key]) => key.endsWith('-auth-token')))
  expect(stored).toBeDefined()
  await page.route('**/auth/v1/logout*', (route) => route.fulfill({ status: 204 }))
  await page.getByRole('button', { name: 'Open more navigation' }).click()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page.getByRole('button', { name: /yes.*log.*out/i }).click()
  await expect(page).toHaveURL(/\/login$/)
  // Begin a fresh signed-out launch; the shared fixture's init script is neutralized.
  await page.addInitScript(() => { for (const key of Object.keys(localStorage)) if (key.endsWith('-auth-token')) localStorage.removeItem(key) })
  await page.goto('/transactions?type=expense&page=2')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email address', { exact: true }).fill('test@example.com')
  await page.getByLabel('Password', { exact: true }).fill('correct-password')
  await page.getByRole('button', { name: /sign in/i, exact: true }).click()
  await expect(page).toHaveURL(/\/transactions\?type=expense&page=2$/)
})

test('tab return and browser Back restore scroll; reselecting a tab returns to its top', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.locator('main h1')).toBeVisible()
  await expect(page.getByLabel('Loading dashboard')).toHaveCount(0)
  const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
  await page.evaluate(() => window.scrollTo({ top: 450, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(450)
  await nav.getByRole('link', { name: 'Accounts', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'My Accounts', exact: true })).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(700)
  await nav.getByRole('link', { name: 'Home (Dashboard)' }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(450)
  await page.goBack()
  await expect(page).toHaveURL(/\/accounts$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(700)
  await nav.getByRole('link', { name: 'Accounts', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
