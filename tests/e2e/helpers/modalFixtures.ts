import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

import { currentMonth } from './authMock'

/**
 * Fixtures for the modal scroll-lock suite (issue #35).
 *
 * They are deliberately purpose-built: the shared auth mock answers reads with
 * two transactions, which is not tall enough to prove that the page behind an
 * overlay cannot scroll. Nothing here reaches a real backend.
 */

/** The Transactions page renders ten rows per page, so ten fills it. */
const PAGE_SIZE = 10

export const fixtureTransactionRows = (count = PAGE_SIZE) =>
  Array.from({ length: count }, (_, index) => {
    const day = String((index % 9) + 1).padStart(2, '0')

    return {
      amount: 150 + index,
      card: { card_name: 'BDO Debit', color: '#1e3a8a' },
      card_id: 'card-1',
      category: {
        color: '#ef4444',
        icon: 'utensils',
        id: 'cat-2',
        name: 'Groceries',
        type: 'expense',
      },
      category_id: 'cat-2',
      created_at: `${currentMonth()}-${day}T08:00:00Z`,
      created_by: 'test-user-id',
      description: `Fixture expense ${index + 1}`,
      fee_amount: 0,
      id: `tx-fixture-${index + 1}`,
      payment_method: 'card',
      to_card_id: null,
      to_wallet_id: null,
      transaction_date: `${currentMonth()}-${day}`,
      type: 'expense',
      user_id: 'test-user-id',
      wallet_id: null,
    }
  })

/**
 * Replaces the shared two-row list route with a full page, so the background
 * has somewhere to scroll. Registered after `setupAuthenticatedMocks` because
 * Playwright consults the most recently added route first.
 */
export async function mockTransactionPage(
  page: Page,
  rows: Record<string, unknown>[] = fixtureTransactionRows(),
) {
  await page.route('**/rest/v1/transactions*', (route) =>
    route.fulfill({
      body: JSON.stringify(rows),
      contentType: 'application/json',
      headers: { 'content-range': `0-${rows.length - 1}/${rows.length}` },
      status: 200,
    }),
  )
}

export type MutationBehaviour = 'delayed' | 'error' | 'success'
/**
 * Intercepts the mutation path with `page.route`: the balance pre-check (a
 * single-object read) and the checked RPCs. Anything that is not a balance read
 * falls back to the shared fixture route instead of being duplicated here.
 *
 * Guarded timing and error flows run through `update_transaction_checked`
 * because its payload is fixed, while the create path carries draft claim values
 * the emulator cannot parse. Playwright checks the most recently added route
 * first, so this succeeds only if these handlers are registered after the shared
 * auth mock. The settled-success flow asserts the same UI state the real create
 * flow produces.
 */
export async function mockTransactionMutations(
  page: Page,
  behaviour: MutationBehaviour = 'success',
) {
  for (const table of ['bank_cards', 'e_wallets']) {
    await page.route(`**/rest/v1/${table}*`, async (route) => {
      const accept = route.request().headers().accept ?? ''

      if (!accept.includes('pgrst.object')) {
        await route.fallback()
        return
      }

      await route.fulfill({
        body: JSON.stringify({ balance: 50000 }),
        contentType: 'application/json',
        status: 200,
      })
    })
  }

  for (const rpc of [
    'process_transaction_checked',
    'update_transaction_checked',
  ]) {
    await page.route(`**/rest/v1/rpc/${rpc}*`, async (route) => {
      if (behaviour === 'error') {
        await route.fulfill({
          body: JSON.stringify({
            code: '23514',
            details: null,
            hint: null,
            message: 'Fixture rejection',
          }),
          contentType: 'application/json',
          status: 400,
        })
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 700))

      await route.fulfill({
        body: JSON.stringify({ message: 'Fixture saved' }),
        contentType: 'application/json',
        status: 200,
      })
    })
  }
}

/**
 * Refuses every backend call this suite has not mocked, so a drifting fixture
 * cannot quietly reach a real project. Register it before the specific routes:
 * Playwright consults the most recently added route first.
 */
export async function blockUnmockedBackend(page: Page) {
  for (const pattern of [
    '**/auth/v1/**',
    '**/functions/v1/**',
    '**/rest/v1/**',
  ]) {
    await page.route(pattern, (route) => route.abort('blockedbyclient'))
  }
}


/**
 * Opens the Edit form through a button that is fully inside the viewport, so
 * Playwright does not scroll the background into view before the modal opens.
 */
export async function openInViewportEditForm(page: Page) {
  const opened = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        'main [aria-label="Edit transaction"]',
      ),
    )
    const viewportBottom = window.scrollY + window.innerHeight
    const target = buttons.find((button) => {
      const top = button.getBoundingClientRect().top + window.scrollY
      return top >= window.scrollY + 40 && top < viewportBottom - 80
    })
    target?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    )
    return Boolean(target)
  })

  if (!opened) {
    throw new Error('No fully in-viewport Edit button was found.')
  }

  const dialog = page.getByRole('dialog', { name: 'Edit Transaction' })
  await expect(dialog).toBeVisible()

  return dialog
}
