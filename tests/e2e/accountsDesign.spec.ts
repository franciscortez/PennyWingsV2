import { writeFileSync } from 'node:fs'
import { expect, test, type Page, type Locator } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'
import { blockUnmockedBackend } from './helpers/modalFixtures'
import { mockAccountsDesign } from './helpers/accountsDesignFixtures'
import { accountsContrastAudit, accountsGeometry, colorsGeometry } from './helpers/accountsDesignAssertions'

async function ready(page: Page, path = '/accounts') {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'My Accounts', exact: true })).toBeVisible()
  await expect(page.getByLabel('Loading accounts')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
}

async function compactCards(cards: Locator) {
  const widths = await cards.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width))
  expect(widths.length).toBeGreaterThan(0)
  expect(widths.every(width => width <= 384.5)).toBe(true)
}

async function finishWizard(page: Page, type: string, provider = 'Others') {
  await page.getByRole('main').getByRole('button', { name: 'Add account', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: type, exact: true }).click()
  await dialog.getByRole('button', { name: 'Continue' }).click()
  if (!['Cash on Hand', 'Lent Money'].includes(type)) {
    await dialog.getByLabel('Select Provider').selectOption(provider)
    await dialog.getByLabel('Custom Name (Optional)').fill('Created Fixture')
    await dialog.getByRole('button', { name: 'Continue' }).click()
  }
  return dialog
}

test.describe('Accounts design', () => {
  test.describe.configure({ timeout: 120_000 })
  test.beforeEach(async ({ page }) => {
    await blockUnmockedBackend(page)
    await setupAuthenticatedMocks(page)
  })

  for (const dark of [false, true]) {
    test(`page and all modal chrome meet contrast and geometry in ${dark ? 'dark' : 'light'} mode`, async ({ page }, testInfo) => {
      await page.addInitScript(dark => localStorage.setItem('theme', dark ? 'dark' : 'light'), dark)
      await mockAccountsDesign(page)
      await ready(page)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      const samples: { state: string; samples: Awaited<ReturnType<typeof accountsContrastAudit>>['samples']; failures: Awaited<ReturnType<typeof accountsContrastAudit>>['failures'] }[] = []
      const audit = async (state: string) => {
        const result = await accountsContrastAudit(page)
        expect(result.failures).toEqual([])
        samples.push({ state, ...result })
      }
      const widths = [320, 375, 393, 768, 1280, 1920]
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await accountsGeometry(page, width)
        await audit(`page ${width}`)
        if (width === 320 || width === 1280) await page.screenshot({ path: testInfo.outputPath(`accounts-${width}-${dark ? 'dark' : 'light'}.png`), fullPage: true, animations: 'disabled' })
      }
      await page.setViewportSize({ width: 1024, height: 900 })
      const expand = page.getByRole('button', { name: 'Expand sidebar', exact: true })
      if (await expand.isVisible()) await expand.click()
      await accountsGeometry(page, 1024)
      await page.setViewportSize({ width: 320, height: 900 })
      await page.getByRole('button', { name: 'Edit Personal Reserve', exact: true }).click()
      let dialog = page.getByRole('dialog', { name: 'Edit Account', exact: true })
      await dialog.getByLabel('Account Name', { exact: true }).fill('')
      await dialog.getByRole('button', { name: 'Save Changes' }).click()
      await expect(dialog.getByLabel('Account Name', { exact: true })).toHaveAttribute('aria-invalid', 'true')
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await accountsGeometry(page, width)
        await colorsGeometry(page)
        await audit(`edit errors ${width}`)
      }
      const royal = dialog.getByRole('button', { name: 'Royal', exact: true })
      await royal.focus()
      await page.keyboard.press('Space')
      await expect(royal).toHaveAttribute('aria-pressed', 'true')
      await audit('swatch focus')
      await royal.hover()
      await audit('swatch hover')
      await page.screenshot({ path: testInfo.outputPath(`edit-account-${dark ? 'dark' : 'light'}.png`), animations: 'disabled' })
      await dialog.getByRole('button', { name: 'Close edit account' }).click()
      dialog = await finishWizard(page, 'Traditional Bank')
      await dialog.getByRole('button', { name: 'Finalize Account' }).click()
      await expect(dialog.locator('#account-balance-error')).toBeVisible()
      for (const width of [320, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        await accountsGeometry(page, width)
        await colorsGeometry(page)
        await audit(`wizard errors ${width}`)
      }
      await dialog.getByRole('button', { name: 'Close account setup' }).click()
      await page.getByRole('button', { name: 'Share Personal Reserve', exact: true }).click()
      dialog = page.getByRole('dialog', { name: 'Share Account', exact: true })
      await expect(dialog.getByText('Jane Member', { exact: true })).toBeVisible()
      await dialog.getByRole('button', { name: 'Generate Invite Code' }).click()
      await expect(dialog.getByRole('button', { name: 'Copy code' })).toBeVisible()
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await accountsGeometry(page, width)
        await audit(`share ${width}`)
      }
      await dialog.getByRole('button', { name: 'Close share modal' }).click()
      await page.getByRole('main').getByRole('button', { name: 'Join account', exact: true }).click()
      dialog = page.getByRole('dialog', { name: 'Join Shared Account' })
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await accountsGeometry(page, width)
        await audit(`join ${width}`)
      }
      await dialog.getByLabel('Invitation Code').focus()
      await audit('join focus')
      await dialog.getByRole('button', { name: 'Close join modal' }).click()
      await expect(page.locator('[data-mobile-primary-action], .mobile-primary-action')).toHaveCount(0)
      const path = testInfo.outputPath('accounts-contrast.json')
      writeFileSync(path, JSON.stringify(samples, null, 2))
      await testInfo.attach('accounts-contrast', { path, contentType: 'application/json' })
    })
  }

  test('single active, hidden and archived cards stay compact on desktop', async ({ page }, testInfo) => {
    await mockAccountsDesign(page)
    await page.setViewportSize({ width: 1920, height: 1080 })
    await ready(page, '/accounts?tab=wallets')
    const wallet = page.getByRole('article', { name: 'GCash 1', exact: true })
    await compactCards(wallet)
    await page.getByRole('button', { name: 'Hidden shared accounts (1)' }).click()
    await compactCards(page.locator('#hidden-accounts article'))
    await page.getByRole('button', { name: 'Archived accounts (1)' }).click()
    await compactCards(page.locator('#archived-accounts article'))
    await page.screenshot({ path: testInfo.outputPath('accounts-single-desktop.png'), fullPage: true, animations: 'disabled' })
    for (const width of [1280, 1024]) {
      await page.setViewportSize({ width, height: 900 })
      await compactCards(wallet)
      await compactCards(page.locator('#hidden-accounts article'))
      await accountsGeometry(page, width)
    }
  })

  test('long content, extreme balances and custom controls reflow with 200% text', async ({ page }) => {
    await mockAccountsDesign(page, { extreme: true })
    await ready(page)
    await page.addStyleTag({ content: 'html { font-size: 200%; }' })
    for (const width of [320, 375, 393, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await accountsGeometry(page, width)
      await expect(page.locator('[data-account-balance]').first()).toHaveText('₱999,999,999,999.99')
    }
    await page.getByRole('button', { name: 'Edit ' + 'Longaccountname'.repeat(12), exact: true }).click()
    for (const width of [320, 393, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await accountsGeometry(page, width)
      await colorsGeometry(page)
    }
    await expect(page.getByRole('button', { name: 'Dark Slate', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeVisible()
  })

  test('tabs, search, membership visibility, edit and archive lifecycle retain their payloads', async ({ page }) => {
    const requests = await mockAccountsDesign(page)
    await ready(page, '/accounts?tab=wallets')
    await expect(page.getByRole('button', { name: /^E-Wallet/ })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: /^All / }).click()
    await expect(page).toHaveURL(/tab=all/)
    await page.getByLabel('Search accounts', { exact: true }).fill('does not exist')
    await expect(page.getByText('No Accounts Found')).toBeVisible()
    await page.getByLabel('Search accounts', { exact: true }).fill('')
    for (const name of ['Shared Viewer', 'Shared Transactor']) {
      const row = page.getByRole('article', { name, exact: true })
      await expect(row.getByRole('button', { name: /^Edit / })).toHaveCount(0)
      await expect(row.getByRole('button', { name: /^Share / })).toHaveCount(0)
    }
    await page.getByRole('button', { name: 'Hide Shared Viewer', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Hidden shared accounts (2)' })).toBeVisible()
    await page.getByRole('button', { name: 'Hidden shared accounts (2)' }).click()
    await page.getByRole('button', { name: 'Unhide Shared Viewer', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Hide Shared Viewer', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Leave Shared Transactor', exact: true }).click()
    await page.getByRole('button', { name: 'Yes, Delete It', exact: true }).click()
    await expect(page.getByRole('article', { name: 'Shared Transactor', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: 'Edit Personal Reserve', exact: true }).click()
    const edit = page.getByRole('dialog', { name: 'Edit Account', exact: true })
    await edit.getByRole('button', { name: 'Gold', exact: true }).click()
    await edit.getByRole('button', { name: 'Save Changes', exact: true }).click()
    await expect(edit).toHaveCount(0)
    expect(requests.find(row => row.table === 'bank_cards' && row.method === 'PATCH')?.body).toMatchObject({ card_name: 'Personal Reserve', color: '#FBBF24', text_color: '#0F172A', last_four: '1230' })
    await page.getByRole('button', { name: 'Delete Personal Reserve', exact: true }).click()
    await page.getByRole('button', { name: 'Archive Account', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Archived accounts (2)' })).toBeVisible()
    await page.getByRole('button', { name: 'Archived accounts (2)' }).click()
    await page.getByRole('button', { name: 'Restore Personal Reserve', exact: true }).click()
    await page.getByRole('button', { name: 'Restore Account', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Delete Personal Reserve', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Permanently delete Archived Reserve', exact: true }).click()
    await page.getByRole('button', { name: 'Yes, Delete It', exact: true }).click()
    await expect(page.getByRole('article', { name: 'Archived Reserve', exact: true })).toHaveCount(0)
  })

  test('all creation paths, sharing roles and join success and failure stay functional', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { document.documentElement.dataset.copiedCode = value } } }))
    const requests = await mockAccountsDesign(page, { withoutCash: true })
    await ready(page)
    for (const [type, provider] of [['Traditional Bank', 'Others'], ['Digital Bank', 'Maya'], ['E-Wallet', 'GCash'], ['Cash on Hand', ''], ['Lent Money', '']]) {
      const dialog = await finishWizard(page, type, provider)
      if (type === 'Lent Money') await dialog.getByLabel('Person or Lending Label').fill('Fixture borrower')
      await dialog.getByLabel('Initial Balance').fill('123.45')
      await dialog.getByRole('button', { name: 'Finalize Account' }).click()
      await expect(dialog).toHaveCount(0)
    }
    expect(requests.filter(row => row.method === 'POST' && ['bank_cards', 'e_wallets'].includes(row.table)).map(row => row.body.balance)).toEqual([123.45, 123.45, 123.45, 123.45, 123.45])
    await page.getByRole('button', { name: 'Share Personal Reserve', exact: true }).click()
    const share = page.getByRole('dialog', { name: 'Share Account', exact: true })
    await share.getByRole('button', { name: 'Can transact', exact: true }).click()
    await share.getByRole('button', { name: 'Generate Invite Code' }).click()
    await expect(share.getByRole('button', { name: 'Copy code' })).toBeVisible()
    expect(requests.find(row => row.table === 'joint_account_invites')?.body.role).toBe('transactor')
    const generatedCode = await share.getByText(/^WING-\d{6}$/).innerText()
    await share.getByRole('button', { name: 'Copy code' }).click()
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.copiedCode)).toBe(generatedCode)
    await share.getByLabel('Access for Jane Member').selectOption('transactor')
    await expect(share.getByLabel('Access for Jane Member')).toBeEnabled()
    expect(requests.find(row => row.table === 'update_account_member_role')?.body).toMatchObject({ p_role: 'transactor', p_membership_id: 'member-fixture-1' })
    await share.getByRole('button', { name: 'Revoke invitation', exact: true }).first().click()
    await page.getByRole('button', { name: 'Yes, Delete It', exact: true }).click()
    await share.getByRole('button', { name: 'Remove Jane Member', exact: true }).click()
    await page.getByRole('button', { name: 'Yes, Delete It', exact: true }).click()
    await expect(share.getByText('No members yet. Share an invite code to get started.')).toBeVisible()
    await share.getByRole('button', { name: 'Close share modal' }).click()
    await page.getByRole('main').getByRole('button', { name: 'Join account', exact: true }).click()
    const join = page.getByRole('dialog', { name: 'Join Shared Account' })
    await join.getByLabel('Invitation Code').fill('invalid')
    await join.getByRole('button', { name: 'Join Account', exact: true }).click()
    expect(requests.filter(row => row.table === 'accept_joint_account_invite')).toHaveLength(0)
    await join.getByLabel('Invitation Code').fill('WING-000000')
    await join.getByRole('button', { name: 'Join Account', exact: true }).click()
    await expect.poll(() => requests.filter(row => row.table === 'accept_joint_account_invite' && row.body.p_code === 'WING-000000').length).toBe(1)
    await expect(join.getByRole('button', { name: 'Join Account', exact: true })).toBeEnabled()
    await expect(page.locator('.swal2-toast .swal2-error')).toBeVisible()
    await expect(join).toBeVisible()
    await join.getByLabel('Invitation Code').fill('wing-123456')
    await join.getByRole('button', { name: 'Join Account', exact: true }).click()
    await expect(join).toHaveCount(0)
    expect(requests.filter(row => row.table === 'accept_joint_account_invite').at(-1)?.body.p_code).toBe('WING-123456')
  })

  test('loading has one heading and respects reduced motion; empty state stays reachable', async ({ page }) => {
    await mockAccountsDesign(page, { empty: true })
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    await page.route('**/rest/v1/bank_cards*', async route => { await held; await route.fallback() })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/accounts')
    const skeleton = page.getByLabel('Loading accounts')
    await expect(skeleton).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    const pulse = skeleton.locator('[class~="motion-safe:animate-pulse"]').first()
    await expect.poll(() => pulse.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect.poll(() => pulse.evaluate(element => getComputedStyle(element).animationName)).toBe('pulse')
    release()
    await expect(page.getByText('No Accounts Found')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('main').getByRole('button', { name: 'Add account', exact: true })).toBeVisible()
  })
})
