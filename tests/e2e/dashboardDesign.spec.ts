import { expect, test, type Page } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

const ready = async (page: Page) => {
  await page.goto('/dashboard')
  await expect(page.locator('[data-dashboard-balance]')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'Daily Spending' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

// Measure the actual CSS colors in sRGB, including transparent nested surfaces.
// The only gradient on this route is the brand surface; verify both endpoints.
async function textContrast(page: Page) {
  return page.locator('.dashboard-design').evaluate(root => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).map((n, i) => i === 3 ? n / 255 : n)
    }
    const blend = (a: number[], b: number[]) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3])).concat(1)
    const luminance = (c: number[]) => c.slice(0, 3).map(v => { const n = v / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4 }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
    const ratio = (a: number[], b: number[]) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const pairs: { text: string; ratio: number }[] = []
    while (walker.nextNode()) {
      const node = walker.currentNode; const element = node.parentElement!
      if (!node.textContent?.trim() || !element.getClientRects().length || element.closest('[aria-hidden="true"]')) continue
      const ancestors: Element[] = []; let parent: Element | null = element
      while (parent) { ancestors.unshift(parent); parent = parent.parentElement }
      let backgrounds = [[255, 255, 255, 1]]
      for (const ancestor of ancestors) {
        const style = getComputedStyle(ancestor)
        if (style.backgroundImage.includes('linear-gradient')) {
          const tokens = getComputedStyle(document.documentElement)
          backgrounds = ['--color-pink-700', '--color-pink-900'].map(token => rgba(tokens.getPropertyValue(token)))
        } else backgrounds = backgrounds.map(bg => blend(rgba(style.backgroundColor), bg))
      }
      const color = rgba(getComputedStyle(element).color)
      pairs.push({ text: node.textContent.trim(), ratio: Math.min(...backgrounds.map(bg => ratio(blend(color, bg), bg))) })
    }
    return { minimum: Math.min(...pairs.map(pair => pair.ratio)), failures: pairs.filter(pair => pair.ratio < 4.5), pairs }
  })
}


async function indicatorContrast(page: Page) {
  return page.locator('.dashboard-design').evaluate(root => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const luminance = (color: string) => {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1)
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3).map(v => {
        const n = v / 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4
      }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
    }
    const ratio = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)
    const pairs: { name: string; ratio: number }[] = []
    for (const cell of root.querySelectorAll('.calendar-day')) {
      const style = getComputedStyle(cell)
      if (style.outlineStyle === 'none') continue
      pairs.push({ name: 'Calendar outer focus/selection', ratio: ratio(style.outlineColor, getComputedStyle(cell.closest('article')!).backgroundColor) })
      const inset = style.boxShadow.match(/(?:rgba?|oklch)\([^)]*\)/)?.[0]
      if (inset) pairs.push({ name: 'Calendar edge against heatmap', ratio: Math.max(ratio(style.outlineColor, style.backgroundColor), ratio(inset, style.backgroundColor)) })
    }
    for (const icon of root.querySelectorAll('section[aria-label="Financial overview"] article:first-child span > svg')) {
      const badge = icon.parentElement!
      pairs.push({ name: 'Semantic income/expense icon', ratio: ratio(getComputedStyle(badge).color, getComputedStyle(badge).backgroundColor) })
    }
    for (const bar of root.querySelectorAll('[role="progressbar"] > div')) {
      pairs.push({ name: 'Progress fill/track', ratio: ratio(getComputedStyle(bar).backgroundColor, getComputedStyle(bar.parentElement!).backgroundColor) })
    }
    for (const link of root.querySelectorAll('a')) {
      const style = getComputedStyle(link)
      if (style.outlineStyle === 'none') continue
      let parent = link.parentElement
      while (parent) {
        const background = getComputedStyle(parent).backgroundColor
        ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = background; ctx.fillRect(0, 0, 1, 1)
        if (ctx.getImageData(0, 0, 1, 1).data[3] === 255) {
          pairs.push({ name: 'Link focus/adjacent surface', ratio: ratio(style.outlineColor, background) }); break
        }
        parent = parent.parentElement
      }
    }
    return pairs
  })
}

async function checkGeometry(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  const failures = await page.locator('.dashboard-design article, .dashboard-design a, [data-dashboard-balance], .calendar-day').evaluateAll(elements => elements.filter(element => {
    const box = element.getBoundingClientRect()
    return element.scrollWidth > element.clientWidth + 1 || box.left < 0 || box.right > innerWidth + 1
  }).map(element => element.textContent?.slice(0, 80)))
  expect(failures).toEqual([])
}

test.describe('Dashboard design', () => {
  test.describe.configure({ timeout: 90_000 })
  test.beforeEach(async ({ page }) => { await setupAuthenticatedMocks(page) })

  for (const dark of [false, true]) {
    test(`financial hierarchy, responsive content and contrast in ${dark ? 'dark' : 'light'} mode`, async ({ page }, testInfo) => {
      await page.addInitScript(dark => localStorage.setItem('theme', dark ? 'dark' : 'light'), dark)
      await ready(page)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.locator('[data-dashboard-balance]')).toHaveText('₱28,500.00')
      await expect(page.getByText('0%', { exact: true })).toBeVisible()
      for (const width of [320, 375, 768, 1280, 1920]) {
        await page.setViewportSize({ width, height: 900 })
        await checkGeometry(page, width)
        expect(await page.locator('[data-dashboard-balance]').evaluate(element => element.getBoundingClientRect().height < parseFloat(getComputedStyle(element).lineHeight) * 1.1)).toBe(true)
        const { failures } = await textContrast(page)
        expect(failures).toEqual([])
        if (width === 320 || width === 1280) await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}-${dark ? 'dark' : 'light'}.png`), fullPage: true, animations: 'disabled' })
      }
      if (await page.getByRole('button', { name: 'Expand sidebar', exact: true }).isVisible()) {
        await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click()
        await page.setViewportSize({ width: 768, height: 1024 })
        await checkGeometry(page, 768)
      }
      await page.setViewportSize({ width: 320, height: 900 })
      const day = page.getByRole('button', { name: /₱1,200\.00 across 1 transaction/ })
      await day.click()
      await expect(day).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('region', { name: /^Spending on/ })).toBeFocused()
      expect((await page.getByRole('button', { name: 'Close day details' }).boundingBox())!.width).toBeGreaterThanOrEqual(44)
      await checkGeometry(page, 320)
      expect((await textContrast(page)).failures).toEqual([])
      expect(await day.evaluate(element => getComputedStyle(element).outlineWidth)).toBe('2px')
      await page.keyboard.press('Escape')
      await expect(page.getByRole('region', { name: /^Spending on/ })).toHaveCount(0)
      await expect(day).toBeFocused()
      for (const link of [page.getByRole('main').getByRole('link', { name: 'Accounts', exact: true }), page.getByRole('link', { name: /Budget Status/ }), page.getByRole('link', { name: /Savings Goals/ })]) {
        await link.focus(); await expect(link).toBeFocused()
        expect(await link.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(2)
        expect((await indicatorContrast(page)).filter(pair => pair.ratio < 3)).toEqual([])
      }
      await page.emulateMedia({ reducedMotion: 'reduce' })
      expect(await page.getByRole('link', { name: /Budget Status/ }).evaluate(element => getComputedStyle(element).transitionProperty)).toBe('none')
      const contrast = await textContrast(page)
      const indicators = await indicatorContrast(page)
      expect(indicators.filter(pair => pair.ratio < 3)).toEqual([])
      await testInfo.attach('indicators.json', { body: JSON.stringify(indicators, null, 2), contentType: 'application/json' })
      await testInfo.attach('contrast.json', { body: JSON.stringify(contrast, null, 2), contentType: 'application/json' })
    })
  }

  test('large signed balances, long profile and enlarged text remain readable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 })
    await page.route('**/rest/v1/bank_cards*', route => route.fulfill({ json: [{ id: 'card-1', card_name: 'Test', balance: -999999999999.99, is_active: true }] }))
    await page.route('**/rest/v1/e_wallets*', route => route.fulfill({ json: [] }))
    const profile = 'LongProfileWithoutBreaks'.repeat(12)
    await page.route('**/rest/v1/profiles*', route => route.fulfill({ json: { id: 'test-user-id', full_name: profile } }))
    await ready(page)
    await expect(page.locator('[data-dashboard-balance]')).toHaveText('-₱999,999,999,999.99')
    await expect(page.getByRole('region', { name: 'Account summary' })).toContainText(profile)
    await checkGeometry(page, 320)
    await page.addStyleTag({ content: 'html { font-size: 200%; }' })
    await checkGeometry(page, 320)
  })

  test('loading skeletons remain still with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    await page.route('**/rest/v1/bank_cards*', async route => { await gate; await route.fulfill({ json: [] }) })
    try {
      await page.goto('/dashboard')
      const loading = page.getByLabel('Loading dashboard')
      await expect(loading).toBeVisible({ timeout: 30_000 })
      await expect(loading.getByRole('heading', { level: 1 })).toHaveCount(1)
      expect(await loading.locator('.motion-safe\\:animate-pulse').evaluate(element => getComputedStyle(element).animationName)).toBe('none')
    } finally { release() }
    await expect(page.locator('[data-dashboard-balance]')).toBeVisible()
  })

  test('calendar loading, empty and error notices retain readable states', async ({ page }) => {
    // The calendar queries full transactions, distinct from dashboard summaries.
    const matcher = (url: URL) => url.pathname.endsWith('/transactions') && (url.searchParams.get('order') ?? '').startsWith('transaction_date.asc')
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    await page.route(matcher, async route => { await gate; await route.fulfill({ json: [] }) })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    try {
      await ready(page)
      await expect(page.getByLabel('Loading daily spending')).toBeVisible()
      expect(await page.getByLabel('Loading daily spending').evaluate(element => getComputedStyle(element).animationName)).toBe('none')
    } finally { release() }
    await expect(page.getByText('No spending this month', { exact: true })).toBeVisible()
    expect((await textContrast(page)).failures).toEqual([])
    await page.route(matcher, route => route.fulfill({ status: 500, json: { message: 'Calendar unavailable' } }))
    await ready(page)
    await expect(page.getByText('Daily spending is unavailable', { exact: true })).toBeVisible({ timeout: 30_000 })
    expect((await textContrast(page)).failures).toEqual([])
  })
})

test('all five heatmap intensities retain AA text and readable selection in both themes', async ({ page }) => {
  await setupAuthenticatedMocks(page)
  const now = new Date()
  await page.clock.setFixedTime(new Date(now.getFullYear(), now.getMonth(), 15, 12))
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  await page.route('**/rest/v1/transactions*', route => route.fulfill({ json: [10, 30, 50, 70, 100].map((amount, index) => ({
    id: `heat-${index}`, type: 'expense', amount, fee_amount: 0,
    transaction_date: `${month}-${String(index + 1).padStart(2, '0')}`,
    description: `Expense ${index + 1}`, category: { name: 'Groceries' }, card: { card_name: 'Test account' },
  })) }))
  await page.setViewportSize({ width: 320, height: 900 })
  await ready(page)
  for (const dark of [false, true]) {
    await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark)
    const days = page.locator('.calendar-day:not(:disabled)')
    for (let index = 0; index < 5; index++) {
      await days.nth(index).click()
      await expect(days.nth(index)).toHaveAttribute('aria-pressed', 'true')
      expect((await textContrast(page)).failures).toEqual([])
      const indicators = await indicatorContrast(page)
      expect(indicators.filter(pair => pair.ratio < 3)).toEqual([])
      expect((await days.nth(index).boundingBox())!.width).toBeGreaterThanOrEqual(24)
      expect((await days.nth(index).boundingBox())!.height).toBeGreaterThanOrEqual(24)
      await page.getByRole('button', { name: 'Close day details' }).click()
      await expect(days.nth(index)).toBeFocused()
    }
  }
})
