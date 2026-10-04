import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Drives the tap-to-pick payment source: open the tile, choose a method, then
 * (for cards, wallets and lent accounts) the account.
 *
 * `tile` is the visible panel label: "Payment Method", "From Account" or
 * "To Account". The picker sheet is a second dialog portaled to the body, so
 * it is found through the page rather than the form dialog.
 */
export async function pickSource(
  page: Page,
  form: Locator,
  tile: string,
  method: string,
  account?: string,
) {
  await form.getByRole('button', { name: new RegExp(tile) }).click()
  // Only one modal is ever on screen: the form steps aside for the picker.
  await expect(form).toBeHidden()
  await page
    .getByRole('dialog')
    .last()
    .getByRole('button', { name: new RegExp(`^${method}`) })
    .click()

  if (account) {
    await page
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: new RegExp(account) })
      .click()
  }

  await expect(form).toBeVisible()
}
