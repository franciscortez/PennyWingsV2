import { writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'
import { blockUnmockedBackend, fixtureTransactionRows } from './helpers/modalFixtures'

async function mockActivity(page: Page, extreme = false) {
  const types = ['income', 'expense', 'withdrawal', 'transfer']
  const rows = fixtureTransactionRows(70).map((row, index) => ({
    ...row,
    type: types[index % types.length],
    user_id: index === 2 ? 'another-user' : 'test-user-id',
    description: extreme ? `Fixture ${'longdescription'.repeat(12)} ${index}` : row.description,
    amount: extreme ? 999999999999.99 : row.amount + 0.37,
    fee_amount: index % 4 >= 2 ? 12.34 : 0,
    card: { card_name: extreme ? 'Longaccountname'.repeat(12) : 'BDO Debit', color: '#1e3a8a' },
    to_wallet_id: index % 4 === 3 ? 'wallet-1' : null,
    to_wallet: index % 4 === 3 ? { wallet_name: 'GCash', wallet_type: 'gcash', color: '#0052cc' } : null,
  }))
  await page.route('**/rest/v1/transactions*', route => {
    const query = new URL(route.request().url()).searchParams
    const type = query.get('type')?.replace('eq.', '')
    const search = query.get('description')?.replace(/^ilike\.%|%$/g, '').toLowerCase()
    const selected = rows.filter(row => (!type || row.type === type) && (!search || row.description.toLowerCase().includes(search)))
    const offset = Number(query.get('offset') ?? 0)
    const limit = Number(query.get('limit') ?? 10)
    return route.fulfill({
      json: selected.slice(offset, offset + limit),
      headers: { 'content-range': `${offset}-${Math.min(offset + limit, selected.length) - 1}/${selected.length}`, 'access-control-expose-headers': 'content-range' },
    })
  })
}

async function ready(page: Page, path = '/transactions') {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Transaction History' })).toBeVisible()
  await expect(page.getByLabel('Loading transactions')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
}

// Resolve actual rendered sRGB colors, including alpha-composited nested surfaces.
async function contrastAudit(page: Page) {
  return page.locator('.activity-design, .modal-panel').evaluateAll(roots => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).map((value, index) => index === 3 ? value / 255 : value)
    }
    const blend = (a: number[], b: number[]) => a.slice(0, 3).map((value, index) => value * a[3] + b[index] * (1 - a[3])).concat(1)
    const luminance = (color: number[]) => color.slice(0, 3).map(value => {
      const v = value / 255
      return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    const ratio = (a: number[], b: number[]) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)
    const background = (element: Element) => {
      const ancestors: Element[] = []
      let current: Element | null = element
      while (current) { ancestors.unshift(current); current = current.parentElement }
      return ancestors.reduce((bg, ancestor) => blend(rgba(getComputedStyle(ancestor).backgroundColor), bg), [255, 255, 255, 1])
    }
    const samples: { name: string; ratio: number; minimum: number; foreground: string; background: number[] }[] = []
    const add = (element: Element, name: string, color: string, minimum = 4.5, bg = background(element)) => {
      samples.push({ name, ratio: ratio(blend(rgba(color), bg), bg), minimum, foreground: color, background: bg })
    }
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        const element = node.parentElement!
        if (!node.textContent?.trim() || !element.getClientRects().length || element.closest('[aria-hidden="true"], :disabled, option, .sr-only')) continue
        add(element, node.textContent.trim(), getComputedStyle(element).color)
      }
      for (const input of root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')) {
        if (!input.getClientRects().length || input.disabled) continue
        const style = getComputedStyle(input)
        add(input, input.id || input.tagName, style.color)
        for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) add(input, `${input.id || input.tagName} ${side.toLowerCase()} border`, style[`border${side}Color`], 3)
        if (input instanceof HTMLInputElement && input.placeholder) add(input, `${input.id || input.tagName} placeholder`, getComputedStyle(input, '::placeholder').color)
      }
      for (const control of root.querySelectorAll('button, input, select')) {
        const style = getComputedStyle(control)
        if (!control.getClientRects().length || style.outlineStyle === 'none') continue
        add(control, `${control.getAttribute('aria-label') || control.id || control.textContent?.trim()} focus`, style.outlineColor, 3, background(control.parentElement!))
      }
    }
    return { samples, failures: samples.filter(sample => sample.ratio < sample.minimum) }
  })
}

async function geometry(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  const failures = await page.locator('.activity-design section, .activity-design article, .activity-design table, .activity-design nav, .activity-design input, .activity-design button, .activity-design [data-transaction-amount], .modal-panel, .modal-body, .modal-panel form, .modal-panel input, .modal-panel select').evaluateAll(elements => elements.filter(element => {
    if (!element.getClientRects().length) return false
    const box = element.getBoundingClientRect()
    return element.scrollWidth > element.clientWidth + 1 || box.left < 0 || box.right > innerWidth + 1
  }).map(element => element.tagName + ': ' + element.textContent?.slice(0, 70)))
  expect(failures).toEqual([])
}

test.describe('Activity design', () => {
  test.describe.configure({ timeout: 90_000 })
  test.beforeEach(async ({ page }) => {
    await blockUnmockedBackend(page)
    await setupAuthenticatedMocks(page)
    await mockActivity(page)
  })

  for (const dark of [false, true]) {
    test(`responsive ledger and form contrast in ${dark ? 'dark' : 'light'} mode`, async ({ page }, testInfo) => {
      await page.addInitScript(dark => localStorage.setItem('theme', dark ? 'dark' : 'light'), dark)
      await ready(page)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      const samples = []
      for (const width of [320, 375, 768, 1280, 1920]) {
        await page.setViewportSize({ width, height: 900 })
        await geometry(page, width)
        const result = await contrastAudit(page)
        expect(result.failures).toEqual([])
        samples.push({ width, state: 'ledger', ...result })
        const visibleAmounts = page.locator('[data-transaction-amount]:visible')
        await expect(visibleAmounts).toHaveCount(10)
        for (const type of ['income', 'expense', 'withdrawal', 'transfer']) await expect(page.getByText(type, { exact: true }).first()).toBeVisible()
        if (width === 320 || width === 1280) await page.screenshot({ path: testInfo.outputPath(`activity-${width}-${dark ? 'dark' : 'light'}.png`), fullPage: true, animations: 'disabled' })
      }
      const expand = page.getByRole('button', { name: 'Expand sidebar', exact: true })
      if (await expand.isVisible()) await expand.click()
      await page.setViewportSize({ width: 1024, height: 900 })
      await geometry(page, 1024)
      await expect(page.getByRole('table')).not.toBeVisible()
      await page.setViewportSize({ width: 320, height: 667 })
      const opener = page.getByRole('main').getByRole('button', { name: 'New Transaction', exact: true })
      await expect(opener).toHaveCount(1)
      await opener.click()
      const dialog = page.getByRole('dialog', { name: 'New Transaction' })
      await dialog.getByRole('button', { name: 'Transfer/Deposit' }).click()
      await dialog.getByRole('button', { name: 'Save Transaction' }).click()
      await expect(dialog.locator('#transaction-amount-error')).toBeVisible()
      for (const width of [320, 375, 768, 1280, 1920]) {
        await page.setViewportSize({ width, height: 900 })
        await geometry(page, width)
        const result = await contrastAudit(page)
        expect(result.failures).toEqual([])
        samples.push({ width, state: 'transfer errors', ...result })
      }
      await dialog.locator('#transaction-fee').focus()
      let result = await contrastAudit(page)
      expect(result.failures).toEqual([])
      samples.push({ state: 'focus', ...result })
      await dialog.locator('#transaction-fee').hover()
      result = await contrastAudit(page)
      expect(result.failures).toEqual([])
      samples.push({ state: 'hover', ...result })
      await page.screenshot({ path: testInfo.outputPath(`transaction-form-${dark ? 'dark' : 'light'}.png`), animations: 'disabled' })
      const contrastPath = testInfo.outputPath('activity-contrast.json')
      writeFileSync(contrastPath, JSON.stringify(samples, null, 2))
      await testInfo.attach('activity-contrast', { path: contrastPath, contentType: 'application/json' })
      await dialog.getByRole('button', { name: 'Close transaction form' }).click()
      await expect(page.locator('[data-mobile-primary-action], .mobile-primary-action')).toHaveCount(0)
    })
  }

  test('large amounts and long content stay complete with enlarged text', async ({ page }) => {
    await mockActivity(page, true)
    await ready(page)
    await page.addStyleTag({ content: 'html { font-size: 200%; }' })
    for (const width of [320, 375, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await geometry(page, width)
      await expect(page.locator('[data-transaction-amount]:visible').first()).toHaveText('+₱999,999,999,999.99')
      await expect(page.locator('article:visible').first().getByText('Longaccountname'.repeat(12), { exact: true })).toBeVisible()
    }
  })

  test('URL-backed filters, search, pagination and view-only rows stay intact', async ({ page }) => {
    await ready(page, '/transactions?page=3')
    const pagination = page.getByRole('navigation', { name: 'Transaction pagination' })
    await expect(pagination.getByRole('button', { name: '3', exact: true })).toHaveAttribute('aria-current', 'page')
    await page.getByRole('button', { name: 'income', exact: true }).click()
    await expect(page).toHaveURL(/type=income/)
    await expect(page).toHaveURL(/page=1/)
    await expect(page.getByRole('button', { name: 'income', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.locator('#transaction-search').fill('Fixture expense 1')
    await expect(page).toHaveURL(/search=Fixture\+expense\+1/)
    await expect(page).toHaveURL(/page=1/)
    await page.locator('#transaction-search').fill('does not exist')
    await expect(page.getByText('No entries found')).toBeVisible()
    await page.locator('#transaction-search').fill('')
    await page.getByRole('button', { name: 'all', exact: true }).click()
    await expect(pagination.getByRole('button', { name: 'Next page' })).toBeEnabled()
    await pagination.getByRole('button', { name: '7', exact: true }).click()
    await expect(page).toHaveURL(/page=7/)
    await expect(pagination.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await page.goto('/transactions')
    await page.setViewportSize({ width: 375, height: 900 })
    const viewOnly = page.getByRole('article').filter({ hasText: 'Fixture expense 3' })
    await expect(viewOnly.getByText('View only')).toBeVisible()
    await expect(viewOnly.getByRole('button')).toHaveCount(0)
  })

  test('loading keeps one heading and pulses only when motion is allowed', async ({ page }) => {
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    await page.route('**/rest/v1/transactions*', async route => {
      await held
      await route.fallback()
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/transactions')
    const skeleton = page.getByLabel('Loading transactions')
    await expect(skeleton).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    const animationNames = await skeleton.locator('[class~="motion-safe:animate-pulse"]').evaluateAll(elements => elements.map(element => getComputedStyle(element).animationName))
    expect(animationNames.every(name => name === 'none')).toBe(true)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect.poll(() => skeleton.locator('[class~="motion-safe:animate-pulse"]').first().evaluate(element => getComputedStyle(element).animationName)).toBe('pulse')
    release()
    await expect(skeleton).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })
})
