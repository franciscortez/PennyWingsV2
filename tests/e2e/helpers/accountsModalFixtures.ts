import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export const fixtureBankCards = (count = 6) =>
  Array.from({ length: count }, (_, index) => ({
    balance: 10000 + index * 500,
    card_name: `BDO Debit ${index + 1}`,
    card_type: 'debit',
    color: '#1e3a8a',
    created_at: `2026-01-0${index + 1}T08:00:00Z`,
    id: `card-fixture-${index + 1}`,
    is_active: true,
    last_four: `123${index}`,
    text_color: '#ffffff',
    user_id: 'test-user-id',
  }))

export const fixtureEWallets = (count = 6) => [
  ...Array.from({ length: count }, (_, index) => ({
    account_identifier: `0912345678${index}`,
    balance: 5000 + index * 200,
    color: '#0052cc',
    created_at: `2026-01-0${index + 1}T08:00:00Z`,
    id: `wallet-fixture-${index + 1}`,
    is_active: true,
    text_color: '#ffffff',
    user_id: 'test-user-id',
    wallet_name: `GCash ${index + 1}`,
    wallet_type: 'gcash',
  })),
  {
    account_identifier: null,
    balance: 2500,
    color: '#10b981',
    created_at: '2026-01-01T08:00:00Z',
    id: 'cash-fixture-1',
    is_active: true,
    text_color: '#ffffff',
    user_id: 'test-user-id',
    wallet_name: 'Cash on Hand',
    wallet_type: 'cash',
  },
  {
    account_identifier: null,
    balance: 1500,
    color: '#f59e0b',
    created_at: '2026-01-02T08:00:00Z',
    id: 'lent-fixture-1',
    is_active: true,
    text_color: '#ffffff',
    user_id: 'test-user-id',
    wallet_name: "Friend's Loan",
    wallet_type: 'lent',
  },
]

export const fixtureMembers = [
  {
    id: 'member-fixture-1',
    invited_by: 'test-user-id',
    joined_at: '2026-02-01T00:00:00Z',
    resource_id: 'card-fixture-1',
    resource_type: 'bank_card',
    role: 'viewer',
    user_id: 'member-user-1',
  },
]

export const fixtureInvites = [
  {
    code_hash: 'hash-1',
    created_at: '2026-09-01T00:00:00Z',
    expires_at: '2026-09-21T00:00:00Z',
    id: 'invite-fixture-1',
    owner_id: 'test-user-id',
    resource_id: 'card-fixture-1',
    resource_type: 'bank_card',
    role: 'viewer',
  },
]

export const fixtureProfiles = [
  { id: 'test-user-id', full_name: 'Test User' },
  { id: 'member-user-1', full_name: 'Jane Member' },
]

export async function mockAccountsPage(page: Page) {
  const cards = fixtureBankCards()
  const wallets = fixtureEWallets()

  await page.route('**/rest/v1/bank_cards*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        body: JSON.stringify(cards),
        contentType: 'application/json',
        status: 200,
      })
      return
    }
    await route.fallback()
  })

  await page.route('**/rest/v1/e_wallets*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        body: JSON.stringify(wallets),
        contentType: 'application/json',
        status: 200,
      })
      return
    }
    await route.fallback()
  })

  await page.route('**/rest/v1/account_memberships*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        body: JSON.stringify(fixtureMembers),
        contentType: 'application/json',
        status: 200,
      })
      return
    }
    await route.fallback()
  })

  await page.route('**/rest/v1/joint_account_invites*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        body: JSON.stringify(fixtureInvites),
        contentType: 'application/json',
        status: 200,
      })
      return
    }
    await route.fallback()
  })

  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      body: JSON.stringify(fixtureProfiles),
      contentType: 'application/json',
      status: 200,
    })
  })
}

export async function mockAccountMutations(page: Page) {
  await page.route('**/rest/v1/rpc/revoke_joint_account_invite*', async (route) => {
    await route.fulfill({
      body: JSON.stringify(null),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.route('**/rest/v1/rpc/accept_joint_account_invite*', async (route) => {
    await route.fulfill({
      body: JSON.stringify(null),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.route('**/rest/v1/account_memberships*', async (route) => {
    const method = route.request().method()
    if (method === 'DELETE') {
      await route.fulfill({
        body: JSON.stringify({}),
        contentType: 'application/json',
        status: 200,
      })
      return
    }
    await route.fallback()
  })
}

export const backgroundAnchor = (page: Page) =>
  page.evaluate(() => {
    const heading = document.querySelector('main h1')
    return heading
      ? Math.round(heading.getBoundingClientRect().top * 100) / 100
      : null
  })

export const pageOffset = (page: Page) => page.evaluate(() => window.scrollY)

export const lockState = (page: Page) =>
  page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    bodyPosition: getComputedStyle(document.body).position,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY,
  }))

export async function openScrollableAccountsPage(page: Page, height = 640) {
  await page.setViewportSize({ width: 412, height })
  await page.goto('/accounts')
  await expect(page.getByRole('heading', { name: 'My Accounts' })).toBeVisible()

  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight + 100,
      ),
    )
    .toBe(true)
}

export async function captureBackgroundBaseline(page: Page) {
  await page.mouse.move(206, 320)
  await page.mouse.wheel(0, 400)
  await expect.poll(() => pageOffset(page)).toBeGreaterThan(0)

  const offset = await pageOffset(page)
  const anchor = await backgroundAnchor(page)

  expect(anchor).not.toBeNull()

  return { anchor, offset }
}

export async function openAddWizard(page: Page) {
  await page.getByRole('button', { name: 'Add', exact: true }).dispatchEvent('click')
  const dialog = page.getByRole('dialog', { name: 'Step 1 of 3' })
  await expect(dialog).toBeVisible()
  return dialog
}

export async function openJoinModal(page: Page) {
  await page.getByRole('button', { name: 'Join', exact: true }).dispatchEvent('click')
  const dialog = page.getByRole('dialog', { name: 'Join Shared Account' })
  await expect(dialog).toBeVisible()
  return dialog
}

export async function positionAndCaptureCardBaseline(page: Page) {
  await page.mouse.move(206, 320)
  await page.mouse.wheel(0, 200)
  await expect.poll(() => pageOffset(page)).toBeGreaterThan(0)

  const offset = await pageOffset(page)
  const anchor = await backgroundAnchor(page)
  expect(anchor).not.toBeNull()

  return { anchor, offset }
}

export async function openShareModal(page: Page) {
  const button = page.locator('main button[aria-label^="Share "]').first()
  await button.dispatchEvent('click')
  const dialog = page.getByRole('dialog', { name: 'Share Account' })
  await expect(dialog).toBeVisible()
  return dialog
}

export async function openEditModal(page: Page) {
  const button = page.locator('main button[aria-label^="Edit "]').first()
  await button.dispatchEvent('click')
  const dialog = page.getByRole('dialog', { name: 'Edit Account' })
  await expect(dialog).toBeVisible()
  return dialog
}
