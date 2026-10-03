import { expect, test, type Page } from '@playwright/test'
import { setupRemainingMocks } from './helpers/remainingDesignFixtures'
import { remainingContrastAudit } from './helpers/remainingDesignAssertions'
import { currentMonth } from './helpers/authMock'

async function geometry(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const failures = await page.locator('.app-design section, .app-design article, .app-design button, .app-design input, .app-design-modal, .app-design-modal button, .app-design-modal input, .app-design-modal select').evaluateAll(elements => elements.filter(element => {
    if (!element.getClientRects().length) return false
    const box = element.getBoundingClientRect()
    return box.left < -.5 || box.right > innerWidth + 1 || (!(element instanceof HTMLInputElement) && element.scrollWidth > element.clientWidth + 1)
  }).map(element => ({ name: element.tagName + ': ' + element.textContent?.slice(0, 60), client: element.clientWidth, scroll: element.scrollWidth, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right })))
  expect(failures).toEqual([])
}

for (const dark of [false, true]) test(`remaining pages and modal chrome pass contrast in ${dark ? 'dark' : 'light'} mode`, async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await setupRemainingMocks(page)
  await page.addInitScript(dark => { localStorage.setItem('theme', dark ? 'dark' : 'light') }, dark)
  const samples = []
  for (const route of ['/monitoring?tab=budgets', '/monitoring?tab=goals', '/reports', '/profile']) {
    await page.goto(route)
    await expect(page.locator('main h1')).toBeVisible()
    await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0)
    if (dark) await page.evaluate(() => document.documentElement.classList.add('dark'))
    await geometry(page)
    let result = await remainingContrastAudit(page); expect(result.failures).toEqual([]); samples.push({ route, ...result })
    await page.screenshot({ path: testInfo.outputPath(`clean-${route.replace(/[^a-z]/gi, '-')}-${dark ? 'dark' : 'light'}.png`), fullPage: true })
    if (route.startsWith('/monitoring')) {
      await page.getByRole('button', { name: route.includes('goals') ? 'New goal' : 'New budget', exact: true }).first().click()
      await expect(page.getByRole('dialog')).toBeVisible(); await geometry(page)
      result = await remainingContrastAudit(page); expect(result.failures).toEqual([]); samples.push({ route: route + ':form', ...result })
      await page.getByRole('button', { name: 'Close monitoring form' }).click()
    }
    if (route === '/reports') {
      await page.getByRole('button', { name: /Report period/ }).click()
      result = await remainingContrastAudit(page); expect(result.failures).toEqual([]); samples.push({ route: 'month-picker', ...result }); await geometry(page)
    }
    if (route === '/profile') {
      await page.getByRole('button', { name: 'Choose avatar 2' }).click()
      result = await remainingContrastAudit(page); expect(result.failures).toEqual([]); samples.push({ route: 'selected-avatar', ...result })
      for (const tab of ['Security', 'Danger']) {
        await page.getByRole('button', { name: tab, exact: true }).click()
        result = await remainingContrastAudit(page); expect(result.failures).toEqual([]); samples.push({ route: tab, ...result })
      }
      await page.getByRole('button', { name: 'Delete my account' }).click()
      await expect(page.getByRole('dialog', { name: 'Verify password' })).toBeVisible()
      await geometry(page); result = await remainingContrastAudit(page); expect(result.failures).toEqual([]); samples.push({ route: 'verify', ...result })
    }
    await page.screenshot({ path: testInfo.outputPath(`${route.replace(/[^a-z]/gi, '-')}-${dark ? 'dark' : 'light'}.png`), fullPage: true })
  }
  await testInfo.attach('contrast', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' })
})

test('long names, signed figures, narrow layouts and 200% text remain readable', async ({ page }) => {
  test.setTimeout(90_000)
  await setupRemainingMocks(page, { extreme: true })
  for (const width of [320, 390, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/monitoring?tab=budgets', '/monitoring?tab=goals', '/reports', '/profile']) {
      await page.goto(route); await expect(page.locator('main h1')).toBeVisible()
      if (width === 320) await page.addStyleTag({ content: 'html { font-size: 200%; }' })
      await geometry(page)
      if (width === 320 && route.startsWith('/monitoring')) {
        await page.getByRole('button', { name: route.includes('goals') ? 'New goal' : 'New budget', exact: true }).first().click()
        await expect(page.getByRole('dialog')).toBeVisible(); await geometry(page)
        await page.getByRole('button', { name: 'Close monitoring form' }).click()
      }
      if (route === '/profile') {
        const buttons = page.getByRole('button', { name: /Choose avatar/ })
        const bounds = await buttons.evaluateAll(elements => elements.map(element => { const b = element.getBoundingClientRect(); return { width: b.width, height: b.height } }))
        expect(bounds.every(b => b.width >= 44 && b.height >= 44)).toBe(true)
      }
    }
  }
})

test('Monitoring keeps URL tabs, edit payloads, delete cancellation and deletion', async ({ page }) => {
  const { requests } = await setupRemainingMocks(page)
  await page.goto('/monitoring?tab=goals')
  await expect(page.getByRole('button', { name: 'Goals', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Edit goal', exact: true }).click()
  await page.getByLabel('Goal name').fill('Updated goal')
  await page.getByRole('button', { name: 'Save goal', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Edit goal' })).toBeHidden()
  expect(requests.find(r => r.table === 'goals' && r.method === 'PATCH')?.body).toMatchObject({ name: 'Updated goal', target_amount: 500, current_amount: 250, linked_card_id: null, linked_wallet_id: null })
  await page.getByRole('button', { name: 'Budgets', exact: true }).click(); await expect(page).toHaveURL(/tab=budgets/)
  await page.getByRole('button', { name: 'Edit budget' }).click(); await page.getByLabel('Limit').fill('123.45'); await page.getByRole('button', { name: 'Save budget' }).click()
  await expect(page.getByRole('dialog', { name: 'Edit budget' })).toBeHidden()
  expect(requests.find(r => r.table === 'budgets' && r.method === 'PATCH')?.body).toMatchObject({ category_id: 'cat-2', limit_amount: 123.45, period: 'monthly' })
  await page.getByRole('button', { name: 'Delete budget' }).click(); await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(requests.filter(r => r.method === 'DELETE')).toHaveLength(0)
  await page.getByRole('button', { name: 'Delete budget' }).click(); await page.getByRole('button', { name: 'Yes, Delete It' }).click()
  await expect(page.getByRole('heading', { name: 'No budgets yet' })).toBeVisible()
  expect(requests.filter(r => r.method === 'DELETE')).toHaveLength(1)
  await page.getByRole('button', { name: 'Goals', exact: true }).click()
  await page.getByRole('button', { name: 'Delete goal' }).click(); await page.getByRole('button', { name: 'Yes, Delete It' }).click()
  await expect(page.getByRole('heading', { name: 'No goals yet' })).toBeVisible()
  expect(requests.filter(r => r.method === 'DELETE')).toHaveLength(2)
})

test('Monitoring creates budget and manual or linked goals with original payloads', async ({ page }) => {
  const { requests } = await setupRemainingMocks(page, { empty: true })
  await page.goto('/monitoring')
  await page.getByRole('button', { name: 'New budget', exact: true }).first().click()
  await page.getByLabel('Category').selectOption('cat-2'); await page.getByLabel('Limit').fill('87.65'); await page.getByLabel('Period').selectOption('weekly')
  await page.getByRole('button', { name: 'Create budget', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  expect(requests.find(r => r.table === 'budgets' && r.method === 'POST')?.body).toMatchObject({ category_id: 'cat-2', limit_amount: 87.65, period: 'weekly', user_id: 'test-user-id' })
  await page.getByRole('button', { name: 'Goals', exact: true }).click()
  for (const linked of [false, true]) {
    await page.getByRole('button', { name: 'New goal', exact: true }).first().click()
    await page.getByLabel('Goal name').fill(linked ? 'Linked goal' : 'Manual goal'); await page.getByLabel('Target', { exact: true }).fill('999.37')
    if (linked) await page.getByLabel('Tracking source').selectOption('card:card-1')
    await page.getByRole('button', { name: 'Create goal', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden()
  }
  expect(requests.filter(r => r.table === 'goals' && r.method === 'POST').map(r => r.body)).toEqual([
    expect.objectContaining({ name: 'Manual goal', target_amount: 999.37, linked_card_id: null, linked_wallet_id: null }),
    expect.objectContaining({ name: 'Linked goal', target_amount: 999.37, linked_card_id: 'card-1', linked_wallet_id: null }),
  ])
})

test('Reports keeps month selection, current shortcut and empty states', async ({ page }) => {
  await setupRemainingMocks(page)
  await page.goto('/reports'); await page.getByRole('button', { name: /Report period/ }).click()
  const picker = page.getByRole('dialog', { name: 'Choose report month' })
  await picker.getByRole('button', { name: 'Previous year' }).click()
  const year = Number(currentMonth().slice(0, 4)) - 1
  await picker.getByRole('button', { name: `January ${year}`, exact: true }).click()
  await expect(picker).toBeHidden(); await expect(page.locator('main h1')).toHaveText('Reports')
  await page.getByRole('button', { name: /Report period/ }).click(); await page.getByRole('button', { name: 'Jump to current month' }).click()
  await expect(page.getByRole('button', { name: /Report period/ })).toContainText(new Intl.DateTimeFormat('en-PH', { month: 'long' }).format(new Date()))
  await expect(page.getByText('Archived', { exact: true })).toBeVisible()
  await setupRemainingMocks(page, { empty: true }); await page.reload()
  await expect(page.getByRole('heading', { name: /No report for/ })).toBeVisible()
})

test('Settings retains labelled profile save, keyboard avatar choice and verification cancellation', async ({ page }) => {
  const { requests } = await setupRemainingMocks(page)
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Choose avatar 2' }).focus(); await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Choose avatar 2' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('Full name').fill('Updated name'); await page.getByRole('button', { name: 'Save profile' }).click()
  await expect.poll(() => requests.filter(r => r.table === 'profiles').length).toBe(1)
  expect(requests.find(r => r.table === 'profiles')?.body).toMatchObject({ full_name: 'Updated name', avatar_url: expect.stringContaining('seed=Aneka') })
  await page.getByRole('button', { name: 'Danger', exact: true }).click()
  const opener = page.getByRole('button', { name: 'Delete my account' }); await opener.focus(); await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Verify password' }); await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete account', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(opener).toBeFocused()
})

test('loading headings, empty Monitoring and reduced motion remain accessible', async ({ page }) => {
  await setupRemainingMocks(page, { empty: true }); await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/monitoring'); await expect(page.getByRole('heading', { name: 'No budgets yet' })).toBeVisible()
  await expect(page.locator('main h1')).toHaveCount(1)
  await page.goto('/reports'); await expect(page.getByRole('heading', { name: /No report for/ })).toBeVisible()
  await expect(page.locator('main h1')).toHaveCount(1)
})

test('Monitoring mutation failure keeps the form and submitted values', async ({ page }) => {
  await setupRemainingMocks(page)
  for (const table of ['budgets', 'goals']) await page.route(`**/rest/v1/${table}*`, async route => {
    if (route.request().method() === 'GET') { await route.fallback(); return }
    await route.fulfill({ status: 400, json: { message: 'Fixture rejection', code: '23514' } })
  })
  for (const tab of ['budgets', 'goals']) {
    await page.goto(`/monitoring?tab=${tab}`)
    await page.getByRole('button', { name: tab === 'budgets' ? 'Edit budget' : 'Edit goal' }).click()
    await page.getByRole('button', { name: tab === 'budgets' ? 'Save budget' : 'Save goal', exact: true }).click()
    await expect(page.getByRole('dialog', { name: tab === 'budgets' ? 'Edit budget' : 'Edit goal' })).toBeVisible()
    await expect(page.getByText('Something went wrong.', { exact: true })).toBeVisible()
    await expect(page.getByLabel(tab === 'budgets' ? 'Limit' : 'Goal name')).toHaveValue(tab === 'budgets' ? '100' : 'Emergency reserve')
  }
})

test('Settings password update and credential-verified deletion stay mocked', async ({ page }) => {
  await setupRemainingMocks(page)
  const calls: { endpoint: string; method: string; body: Record<string, unknown> }[] = []
  await page.route('**/auth/v1/user*', async route => {
    if (route.request().method() === 'GET') { await route.fallback(); return }
    calls.push({ endpoint: 'user', method: route.request().method(), body: route.request().postDataJSON() })
    await route.fulfill({ json: { id: 'test-user-id', email: 'test@example.com', app_metadata: { provider: 'email' } } })
  })
  await page.route('**/auth/v1/token*', async route => {
    calls.push({ endpoint: 'token', method: route.request().method(), body: route.request().postDataJSON() }); await route.fallback()
  })
  await page.route('**/auth/v1/logout*', route => route.fulfill({ status: 204 }))
  await page.route('**/functions/v1/delete-user*', async route => {
    calls.push({ endpoint: 'delete-user', method: route.request().method(), body: {} }); await route.fulfill({ json: { success: true } })
  })
  await page.goto('/profile'); await page.getByRole('button', { name: 'Security', exact: true }).click()
  await page.getByLabel('New password', { exact: true }).fill('fixture-password'); await page.getByLabel('Confirm new password').fill('fixture-password')
  await page.getByRole('button', { name: 'Change password', exact: true }).click()
  await expect.poll(() => calls.filter(c => c.endpoint === 'user').length).toBe(1)
  expect(calls.find(c => c.endpoint === 'user')?.body).toMatchObject({ password: 'fixture-password' })
  await page.getByRole('button', { name: 'Danger', exact: true }).click(); await page.getByRole('button', { name: 'Delete my account' }).click()
  await page.getByLabel('Password', { exact: true }).fill('fixture-password')
  await page.getByRole('button', { name: 'Delete account', exact: true }).click()
  await expect.poll(() => calls.filter(c => c.endpoint === 'delete-user').length).toBe(1)
  expect(calls.find(c => c.endpoint === 'token')?.body).toMatchObject({ email: 'test@example.com', password: 'fixture-password' })
  await expect(page).toHaveURL(/\/login$/)
})

test('loading states have one heading and no pulse with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [route, table, title] of [['/monitoring', 'budgets', 'Budgets & Goals'], ['/reports', 'monthly_reports', 'Reports']] as const) {
    await setupRemainingMocks(page)
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    await page.route(`**/rest/v1/${table}*`, async r => { await gate; await r.fallback() })
    await page.goto(route)
    await expect(page.locator('main h1')).toHaveText(title)
    await expect(page.locator('main h1')).toHaveCount(1)
    expect(await page.locator('main .motion-safe\\:animate-pulse').evaluateAll(elements => elements.every(e => getComputedStyle(e).animationName === 'none'))).toBe(true)
    release()
    await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0)
    await page.unroute(`**/rest/v1/${table}*`)
  }
})

test('parent epic audit records shared gaps without expanding fixes', async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  await setupRemainingMocks(page)
  const results = []
  for (const dark of [false, true]) {
    await page.addInitScript(dark => localStorage.setItem('theme', dark ? 'dark' : 'light'), dark)
    for (const route of ['/dashboard', '/transactions', '/accounts', '/monitoring', '/reports', '/profile']) {
      await page.goto(route); await expect(page.locator('main h1')).toHaveCount(1)
      if (dark) await page.evaluate(() => document.documentElement.classList.add('dark'))
      const audit = await remainingContrastAudit(page, 'main, aside, .mobile-navigation-shell')
      results.push({ route, dark, ...audit })
    }
    await page.goto('/monitoring'); await page.getByRole('button', { name: 'Delete budget' }).click()
    const audit = await remainingContrastAudit(page, '.swal2-popup')
    results.push({ route: 'shared-confirmation', dark, ...audit })
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  }
  await testInfo.attach('parent-72-audit', { body: JSON.stringify(results, null, 2), contentType: 'application/json' })
})
