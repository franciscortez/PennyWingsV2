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

test('create sends the entered transfer fee to the checked RPC', async ({ page }) => {
  await mockTransactionPage(page, fixtureTransactionRows(1))
  await page.route('**/rest/v1/bank_cards*', async (route) => {
    if (!(route.request().headers().accept ?? '').includes('pgrst.object')) {
      await route.fallback()
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"balance":100}' })
  })

  let requestFee: number | undefined
  await page.route('**/rest/v1/rpc/process_transaction_checked*', async (route) => {
    requestFee = route.request().postDataJSON().p_fee_amount
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
  })

  await page.goto('/transactions')
  await page.getByRole('button', { name: 'New Transaction' }).click()
  const dialog = page.getByRole('dialog', { name: 'New Transaction' })
  await dialog.getByRole('button', { name: 'Transfer/Deposit' }).click()
  await dialog.locator('input[type="number"]').fill('40')
  await dialog.locator('select').nth(0).selectOption('card')
  await dialog.locator('select').nth(1).selectOption('card-1')
  await dialog.locator('select').nth(2).selectOption('ewallet')
  await dialog.locator('select').nth(3).selectOption('wallet-1')
  await dialog.locator('#transaction-category').selectOption('cat-2')
  await dialog.locator('#transaction-fee').fill('12.34')
  await dialog.getByRole('button', { name: 'Save Transaction' }).click()

  await expect(dialog).not.toBeVisible()
  expect(requestFee).toBe(12.34)
})

test('edit preserves the fee and shows a checked RPC balance error', async ({ page }) => {
  const existing = {
    ...fixtureTransactionRows(1)[0],
    description: 'Original note',
    fee_amount: 15,
    to_wallet: { wallet_name: 'GCash', wallet_type: 'gcash', color: '#0052cc' },
    to_wallet_id: 'wallet-1',
    type: 'transfer',
  }
  await mockTransactionPage(page, [existing])

  let requestFee: number | undefined
  await page.route('**/rest/v1/rpc/update_transaction_checked*', async (route) => {
    requestFee = route.request().postDataJSON().p_fee_amount
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'P0001', message: 'Insufficient balance.', details: null, hint: null }),
    })
  })

  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Edit transaction' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Edit Transaction' })
  await expect(dialog.locator('#transaction-fee')).toHaveValue('15')
  await dialog.getByPlaceholder('Short note...').fill('Changed note')
  await dialog.getByRole('button', { name: 'Update Transaction' }).click()

  await expect.poll(() => requestFee).toBe(15)
  await expect(page.locator('.swal2-popup')).toBeVisible()
  await expect(page.locator('.swal2-popup')).toContainText('Insufficient balance.')
  await expect(dialog).toBeVisible()
})
