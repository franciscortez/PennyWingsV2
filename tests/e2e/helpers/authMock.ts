import type { Page } from '@playwright/test'

export async function setupAuthenticatedMocks(page: Page) {
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
      headers: { 'content-range': '0-0/1' },
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'tx-1',
          user_id: 'test-user-id',
          type: 'expense',
          amount: 250,
          fee_amount: 0,
          description: 'Coffee & Snacks',
          transaction_date: '2026-08-17',
          payment_method: 'card',
          card_id: 'card-1',
          wallet_id: null,
          to_card_id: null,
          to_wallet_id: null,
          category_id: 'cat-2',
          created_at: '2026-08-17T08:00:00Z',
          card: { card_name: 'BDO Debit', color: '#1e3a8a' },
          category: { id: 'cat-2', name: 'Groceries', type: 'expense', icon: 'utensils', color: '#ef4444' },
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
  await page.addInitScript(() => {
    const mockStorageSession = {
      access_token: 'mock-jwt-token-12345',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token-12345',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: { provider: 'email' },
        user_metadata: { full_name: 'Test User' },
        aud: 'authenticated',
        role: 'authenticated',
      },
    }

    // Set keys matching Supabase default storage prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
        localStorage.setItem(key, JSON.stringify(mockStorageSession))
      }
    }
    // Also set generic fallback
    localStorage.setItem('sb-auth-token', JSON.stringify(mockStorageSession))
  })
}
