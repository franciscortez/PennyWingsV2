import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

test.use({ viewport: { width: 390, height: 844 } })

test('standalone offline page supports manual retry, both themes, and enlarged text', async ({ page, context }, testInfo) => {
  for (const theme of ['light', 'dark']) {
    await page.addInitScript(theme => localStorage.setItem('theme', theme), theme)
    await page.goto('/offline.html')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('status')).toContainText('Still offline')
    await page.screenshot({ path: testInfo.outputPath(`offline-launch-${theme}.png`), animations: 'disabled' })
    await context.setOffline(false)
    await expect(page.getByRole('status')).toContainText('Connection detected')
    await expect(page.getByRole('button', { name: 'Open PennyWings' })).toBeEnabled()
    await expect(page).toHaveURL(/\/offline\.html$/)
  }
  await page.setViewportSize({ width: 320, height: 568 })
  await page.addStyleTag({ content: 'html { font-size: 200%; }' })
  const button = page.getByRole('button', { name: 'Open PennyWings' })
  await button.scrollIntoViewIfNeeded()
  await expect(button).toBeInViewport()
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  await page.setViewportSize({ width: 667, height: 320 })
  await button.scrollIntoViewIfNeeded()
  await expect(button).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(667)
})

test('offline theme follows the device when storage is blocked', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('Storage blocked') } }))
  await page.goto('/offline.html')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('heading', { name: "You're offline" })).toBeVisible()
})

test('offline form and nested picker show one status, retain a draft, and recover without reloading', async ({ page, context }, testInfo) => {
  await setupAuthenticatedMocks(page)
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'New Transaction' }).click()
  const form = page.getByRole('dialog', { name: 'New Transaction' })
  await form.getByPlaceholder('Short note...').fill('Keep my open draft')
  await form.getByRole('textbox', { name: 'Amount (PHP)' }).fill('22222.50')
  await context.setOffline(true)
  await expect(page.getByRole('status')).toHaveCount(1)
  await expect(form.getByRole('status')).toContainText('Your entries remain in this open form')
  await page.screenshot({ path: testInfo.outputPath('offline-form-dark.png'), animations: 'disabled' })
  await form.getByRole('button', { name: /Cash.*No cash account/ }).click()
  const picker = page.getByRole('dialog', { name: 'Pay with' })
  await expect(picker.getByRole('status')).toContainText("You're offline")
  await expect(page.getByRole('status')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(form.getByPlaceholder('Short note...')).toHaveValue('Keep my open draft')
  await context.setOffline(false)
  await expect(form.getByRole('status')).toContainText('Connection detected')
  await form.getByRole('button', { name: 'Refresh records' }).click()
  await expect(form.getByRole('status')).toHaveCount(0)
  await expect(form.getByRole('textbox', { name: 'Amount (PHP)' })).toHaveValue('22,222.50')
  await expect(form.getByPlaceholder('Short note...')).toHaveValue('Keep my open draft')
})

test('unloaded financial pages show unavailable records instead of empty balances', async ({ page, context }) => {
  await setupAuthenticatedMocks(page)
  await page.goto('/profile')
  await expect(page.locator('main h1')).toBeVisible()
  // Warm the route code without fetching any financial records.
  await page.evaluate(async () => {
    const modulePath = '/src/lib/routePrefetch.ts'
    const { pageImporters } = await import(/* @vite-ignore */ modulePath)
    await Promise.all(['dashboard', 'accounts', 'transactions', 'reports', 'monitoring', 'debts'].map(name => pageImporters[name]()))
  })
  // Chromium can fulfill Playwright mocks even while its network is offline.
  await page.route('**/rest/v1/**', route => route.abort('internetdisconnected'))
  await context.setOffline(true)
  const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
  for (const name of ['Dashboard', 'Accounts', 'Activity', 'Reports', 'Monitoring', 'Debts']) {
    if (['Monitoring', 'Debts'].includes(name)) {
      await nav.getByRole('button', { name: 'Open more navigation' }).click()
      await page.getByRole('dialog', { name: 'Your space' }).getByRole('link', { name, exact: true }).click()
    } else {
      await nav.getByRole('link', { name: new RegExp(name) }).click()
    }
    await expect(page.getByRole('heading', { name: 'Reconnect to load this page' })).toBeVisible()
    await expect(page.getByText('Total Net Worth', { exact: true })).toHaveCount(0)
    await expect(nav).toBeVisible()
  }
  await expect.poll(() => page.evaluate(async () => {
    const modulePath = '/src/lib/queryClient.ts'
    const { queryClient } = await import(/* @vite-ignore */ modulePath)
    return queryClient.isFetching()
  })).toBe(0)
  await expect(page.locator('.swal2-toast')).toHaveCount(0)
})

test('a genuinely empty report remains an empty report while offline', async ({ page, context }) => {
  await setupAuthenticatedMocks(page)
  await page.route('**/rest/v1/monthly_reports*', route => route.fulfill({ json: [] }))
  await page.goto('/reports')
  await expect(page.getByRole('heading', { name: /No report for/ })).toBeVisible()
  await context.setOffline(true)
  await expect(page.getByRole('heading', { name: /No report for/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reconnect to load this page' })).toHaveCount(0)
})

test('offline filter changes do not show another querys placeholder rows or reset its URL', async ({ page, context }) => {
  await setupAuthenticatedMocks(page)
  await page.goto('/transactions')
  await expect(page.locator('main h1')).toBeVisible()
  await page.route('**/rest/v1/**', route => route.abort('internetdisconnected'))
  await context.setOffline(true)
  await page.getByRole('group', { name: 'Filter Type' }).getByRole('button', { name: 'expense', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Reconnect to load this page' })).toBeVisible()
  await expect(page).toHaveURL(/type=expense/)
})

test('offline route download failures preserve the dock after navigating away and reconnecting', async ({ page, context }) => {
  await setupAuthenticatedMocks(page)
  await page.goto('/profile')
  await expect(page.locator('main h1')).toBeVisible()
  await page.route('**/src/pages/Reports.tsx*', route => route.abort())
  await context.setOffline(true)
  const nav = page.getByRole('navigation', { name: 'Primary mobile navigation' })
  await nav.getByRole('link', { name: 'Reports', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Reconnect to open this page' })).toBeVisible()
  await expect(nav).toBeVisible()
  await nav.getByRole('button', { name: 'Open more navigation' }).click()
  await page.getByRole('dialog', { name: 'Your space' }).getByRole('link', { name: /Profile/ }).click()
  await context.setOffline(false)
  await nav.getByRole('link', { name: 'Reports', exact: true }).click()
  await expect(page.getByRole('heading', { name: "This page couldn't load" })).toBeVisible()
  await expect(nav).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload page' })).toBeEnabled()
})
