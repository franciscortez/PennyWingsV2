import { expect, test } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'
import {
  blockUnmockedBackend,
  fixtureTransactionRows,
  mockTransactionPage,
} from './helpers/modalFixtures'

test.beforeEach(async ({ page }) => {
  await blockUnmockedBackend(page)
  await setupAuthenticatedMocks(page)
})

test('create sends the entered withdrawal fee to the checked RPC', async ({ page }) => {
  await mockTransactionPage(page, fixtureTransactionRows(1))
  await page.route('**/rest/v1/bank_cards*', async (route) => {
    if (!(route.request().headers().accept ?? '').includes('pgrst.object')) {
      await route.fallback()
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"balance":100}' })
  })

  let requestBody: Record<string, unknown> | undefined
  await page.route('**/rest/v1/rpc/process_transaction_checked*', async (route) => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  })

  await page.goto('/transactions')
  await page.getByRole('button', { name: 'New Transaction' }).click()
  const dialog = page.getByRole('dialog', { name: 'New Transaction' })
  await dialog.getByRole('button', { name: 'withdrawal' }).click()
  await dialog.locator('input[type="number"]').fill('40')
  await dialog.locator('select').nth(0).selectOption('card')
  await dialog.locator('select').nth(1).selectOption('card-1')
  await dialog.locator('#transaction-category').selectOption('cat-2')
  await dialog.getByRole('textbox', { name: 'Withdrawal Fee (PHP)' }).fill('12.34')
  await dialog.getByRole('button', { name: 'Save Transaction' }).click()

  await expect(dialog).not.toBeVisible()
  expect(requestBody).toMatchObject({
    p_amount: 40,
    p_fee_amount: 12.34,
    p_to_wallet_id: null,
    p_type: 'withdrawal',
  })
})

test('edit retains the withdrawal fee and reports a checked RPC balance error', async ({ page }) => {
  const existing = {
    ...fixtureTransactionRows(1)[0],
    description: 'Original note',
    fee_amount: 15,
    type: 'withdrawal',
  }
  await mockTransactionPage(page, [existing])

  let requestBody: Record<string, unknown> | undefined
  await page.route('**/rest/v1/rpc/update_transaction_checked*', async (route) => {
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'P0001', message: 'Insufficient balance.', details: null, hint: null }),
    })
  })

  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Edit transaction' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Edit Transaction' })
  await expect(dialog.getByRole('textbox', { name: 'Withdrawal Fee (PHP)' })).toHaveValue('15')
  await dialog.getByPlaceholder('Short note...').fill('Changed note')
  await dialog.getByRole('button', { name: 'Update Transaction' }).click()

  await expect.poll(() => requestBody?.p_fee_amount).toBe(15)
  await expect(page.locator('.swal2-popup')).toContainText('Insufficient balance.')
  await expect(dialog).toBeVisible()
})
