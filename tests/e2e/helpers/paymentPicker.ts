import { expect, type Locator, type Page } from '@playwright/test'

const tabNames: Record<string, RegExp> = {
  'Bank Card': /^Cards \d+$/,
  Cash: /^Cash$/,
  'E-Wallet': /^Wallets \d+$/,
  Lent: /^Lent \d+$/,
}

/**
 * Drives the card-carousel payment picker: open the tile, pick the account
 * type tab, bring the account's card to the centre, then press "Use …".
 *
 * `tile` is the visible panel label: "Payment Method", "From Account",
 * "To Account", "Deposit To" or "Withdraw From". The picker sheet is a second
 * dialog portaled to the body, so it is found through the page rather than
 * the form dialog.
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
  const sheet = page.getByRole('dialog').last()
  await sheet.getByRole('radiogroup', { name: 'Account type' }).getByRole('radio', { name: tabNames[method] ?? new RegExp(`^${method}`) }).click()

  if (account) {
    const card = sheet.getByRole('radio', { name: new RegExp(`^${account}`) })
    if ((await card.getAttribute('aria-checked')) !== 'true') await card.click()
    await expect(card).toHaveAttribute('aria-checked', 'true')
  }

  await sheet.getByRole('button', { name: /^Use / }).click()
  await expect(form).toBeVisible()
}
