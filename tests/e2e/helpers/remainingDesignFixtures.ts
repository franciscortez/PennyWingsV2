import type { Page } from '@playwright/test'
import { setupAuthenticatedMocks, currentMonth } from './authMock'
import { blockUnmockedBackend } from './modalFixtures'

export type FixtureRequest = { table: string; method: string; body: Record<string, unknown> }
export async function setupRemainingMocks(page: Page, options: { empty?: boolean; extreme?: boolean } = {}) {
  await blockUnmockedBackend(page)
  await setupAuthenticatedMocks(page)
  await page.route('https://api.dicebear.com/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#fff0f5"/></svg>' }))
  const requests: FixtureRequest[] = []
  const name = options.extreme ? 'LongUnbrokenFixtureName'.repeat(8) : 'Emergency reserve'
  const amount = options.extreme ? 1234567890123.37 : 500
  const category = { id: 'cat-2', name: options.extreme ? name : 'Groceries', type: 'expense', icon: 'utensils', color: '#ffffff' }
  await page.route('**/rest/v1/categories*', route => route.fulfill({ json: [category] }))
  const state: Record<string, Record<string, unknown>[]> = {
    budgets: options.empty ? [] : [{ id: 'budget-1', user_id: 'test-user-id', category_id: 'cat-2', limit_amount: 100, period: 'monthly', created_at: '2026-01-01', category }],
    goals: options.empty ? [] : [{ id: 'goal-1', user_id: 'test-user-id', name, target_amount: amount, current_amount: amount / 2, target_date: `${currentMonth()}-01`, created_at: '2026-01-01', linked_card_id: null, linked_wallet_id: null, linked_card: null, linked_wallet: null }],
  }
  for (const table of ['budgets', 'goals']) await page.route(`**/rest/v1/${table}*`, async route => {
    const method = route.request().method()
    if (method !== 'GET') {
      const body = method === 'DELETE' ? {} : route.request().postDataJSON()
      requests.push({ table, method, body })
      if (method === 'POST') state[table].push({ ...body, id: `${table}-new`, created_at: '2026-01-01', category: table === 'budgets' ? category : undefined })
      if (method === 'PATCH') Object.assign(state[table][0], body)
      if (method === 'DELETE') state[table].shift()
      await route.fulfill({ status: 204 }); return
    }
    await route.fulfill({ json: state[table] })
  })
  await page.route('**/rest/v1/monthly_reports*', async route => {
    if (options.empty) { await route.fulfill({ json: [] }); return }
    const report = { id: 'report-1', user_id: 'test-user-id', report_month: `${currentMonth()}-01`, income_total: amount, expense_total: amount + 150.37, withdrawal_total: 40, transfer_total: 20, net_cashflow: -150.37, transaction_count: 4,
      category_breakdown: Array.from({ length: 6 }, (_, i) => ({ category_id: `cat-${i}`, category_name: i ? `Category ${i}` : name, type: 'expense', total: (amount + 150.37) / (i + 1) })),
      account_snapshot: [{ id: 'loan-1', kind: 'lent', name, balance: -amount, is_active: false }], generated_at: `${currentMonth()}-01T00:00:00Z` }
    await route.fulfill({ json: [report, { ...report, id: 'previous', report_month: '2025-01-01' }] })
  })
  await page.route('**/rest/v1/profiles*', async route => {
    if (route.request().method() === 'PATCH') requests.push({ table: 'profiles', method: 'PATCH', body: route.request().postDataJSON() })
    await route.fulfill({ json: { id: 'test-user-id', full_name: options.extreme ? name : 'Fixture User', avatar_url: null } })
  })
  return { requests, state }
}
