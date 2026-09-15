import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'

// supabase-js keys its session by the project host, so the key differs between
// a developer's `.env` and CI's local stack. Reading it here rather than
// hardcoding is what makes the injected session actually load: before this,
// only `sb-auth-token` was written, supabase-js never found a session, and
// every protected-page spec was quietly asserting against `/login`.
const readSupabaseUrl = () => {
  if (process.env.VITE_SUPABASE_URL) {
    return process.env.VITE_SUPABASE_URL
  }

  try {
    const file = readFileSync(path.resolve(process.cwd(), '.env'), 'utf8')

    return file.match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1].trim()
  } catch {
    return undefined
  }
}

const getAuthStorageKey = () => {
  const url = readSupabaseUrl()

  if (!url) {
    throw new Error(
      'VITE_SUPABASE_URL is required for the e2e auth mock; set it in the environment or .env.',
    )
  }

  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
}

// The calendar always opens on the current month, so fixtures dated in a fixed
// month would fall outside the grid and the section would render empty. These
// build dates inside whatever month the suite happens to run in.
const pad = (value: number) => String(value).padStart(2, '0')

export const currentMonth = () => {
  const now = new Date()

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
}

// Kept at or before the 2nd so the days are never in the future, which would
// render them disabled and unselectable.
export const calendarFixtureDates = () => ({
  first: `${currentMonth()}-01`,
  second: `${currentMonth()}-02`,
})

export async function setupAuthenticatedMocks(page: Page) {
  const { first, second } = calendarFixtureDates()

  // Dashboard readiness also depends on these queries. Keep them mocked so
  // the suite never waits for a real backend connection to fail.
  for (const table of ['budgets', 'goals']) {
    await page.route(`**/rest/v1/${table}*`, (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: '[]',
    }))
  }

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: 'Test User' },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  }

  const mockSession = {
    access_token: 'mock-jwt-token-12345',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token-12345',
    user: mockUser,
  }

  // Intercept Auth endpoints
  await page.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    })
  })

  await page.route('**/auth/v1/token*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    })
  })

  // Intercept Database REST endpoints
  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-id',
        full_name: 'Test User',
        avatar_url: null,
        created_at: '2026-01-01T00:00:00Z',
      }),
    })
  })

  await page.route('**/rest/v1/bank_cards*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'card-1',
          user_id: 'test-user-id',
          card_name: 'BDO Debit',
          card_type: 'debit',
          last_four: '1234',
          color: '#1e3a8a',
          text_color: '#ffffff',
          balance: 25000,
          is_active: true,
        },
      ]),
    })
  })

  await page.route('**/rest/v1/e_wallets*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'wallet-1',
          user_id: 'test-user-id',
          wallet_name: 'GCash',
          wallet_type: 'gcash',
          account_identifier: '09123456789',
          color: '#0052cc',
          text_color: '#ffffff',
          balance: 3500,
          is_active: true,
        },
      ]),
    })
  })

  await page.route('**/rest/v1/categories*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'cat-1', name: 'Salary', type: 'income', icon: 'wallet', color: '#10b981' },
        { id: 'cat-2', name: 'Groceries', type: 'expense', icon: 'utensils', color: '#ef4444' },
      ]),
    })
  })

  await page.route('**/rest/v1/transactions*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': '0-1/2' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'tx-1',
          user_id: 'test-user-id',
          type: 'expense',
          amount: 250,
          fee_amount: 0,
          description: 'Coffee & Snacks',
          transaction_date: second,
          payment_method: 'card',
          card_id: 'card-1',
          wallet_id: null,
          to_card_id: null,
          to_wallet_id: null,
          category_id: 'cat-2',
          created_at: `${second}T08:00:00Z`,
          card: { card_name: 'BDO Debit', color: '#1e3a8a' },
          category: { id: 'cat-2', name: 'Groceries', type: 'expense', icon: 'utensils', color: '#ef4444' },
        },
        {
          id: 'tx-2',
          user_id: 'test-user-id',
          type: 'expense',
          amount: 1200,
          fee_amount: 0,
          description: 'Monthly Groceries',
          transaction_date: first,
          payment_method: 'card',
          card_id: 'card-1',
          wallet_id: null,
          to_card_id: null,
          to_wallet_id: null,
          category_id: 'cat-2',
          created_at: `${first}T08:00:00Z`,
          card: { card_name: 'BDO Debit', color: '#1e3a8a' },
          category: { id: 'cat-2', name: 'Groceries', type: 'expense', icon: 'utensils', color: '#ef4444' },
        },
      ]),
    })
  })

  // `/reports` calls `sync_monthly_reports()` before reading the table, so both
  // need answering or the page renders nothing but its error state.
  await page.route('**/rest/v1/rpc/sync_monthly_reports*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    })
  })

  await page.route('**/rest/v1/monthly_reports*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'report-1',
          user_id: 'test-user-id',
          report_month: `${currentMonth()}-01`,
          income_total: 40000,
          expense_total: 1450,
          withdrawal_total: 0,
          transfer_total: 0,
          net_cashflow: 38550,
          transaction_count: 2,
          category_breakdown: [
            { category_id: 'cat-2', category_name: 'Groceries', type: 'expense', total: 1450 },
          ],
          account_snapshot: [
            { id: 'card-1', kind: 'card', name: 'BDO Debit', balance: 1000, is_active: true },
          ],
          generated_at: `${currentMonth()}-02T00:00:00Z`,
          updated_at: `${currentMonth()}-02T00:00:00Z`,
        },
      ]),
    })
  })

  await page.route('**/rest/v1/account_memberships*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  await page.route('**/rest/v1/joint_account_invites*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  // Set mock Supabase auth session in localStorage before page load
  await page.addInitScript((authStorageKey: string) => {
    const mockStorageSession = {
      access_token: 'mock-jwt-token-12345',
      token_type: 'bearer',
      expires_in: 3600,
      // Comfortably in the future, so the client treats the session as live
      // instead of immediately trying to refresh it.
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh-token-12345',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: 'Test User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2026-01-01T00:00:00Z',
      },
    }

    localStorage.setItem(authStorageKey, JSON.stringify(mockStorageSession))
    // Kept for any code still reading the unscoped key.
    localStorage.setItem('sb-auth-token', JSON.stringify(mockStorageSession))
  }, getAuthStorageKey())
}
