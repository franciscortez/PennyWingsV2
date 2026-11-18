import { expect, type Locator, type Page } from '@playwright/test'

/**
 * The control that starts a new transaction. Activity's header "New
 * Transaction" button renders from 768px up; below that the shell's quick add
 * "+" is the only entry point. Exactly one of them exists at any width.
 */
export const newTransactionOpener = (page: Page): Locator =>
  page
    .getByRole('main')
    .getByRole('button', { name: 'New Transaction', exact: true })
    .or(page.getByRole('button', { name: 'Quick add transaction', exact: true }))

/**
 * Call after activating the opener. On phones the quick add first shows its
 * Quick add sheet, so choose Expense (the form's own default) to reach the
 * same New Transaction form the header button opens.
 */
export async function continueToTransactionForm(page: Page): Promise<Locator> {
  const menu = page.getByRole('dialog', { name: 'Quick add', exact: true })
  const form = page.getByRole('dialog', { name: 'New Transaction', exact: true })

  await expect(menu.or(form)).toBeVisible()
  if (await menu.isVisible()) {
    await menu.getByRole('button', { name: /^Expense/ }).click()
  }
  await expect(form).toBeVisible()

  return form
}

/**
 * Opens the New Transaction form at any width. `dispatch` fires a synthetic
 * click so Playwright does not scroll the page to reach the opener, for specs
 * that measure the background position.
 */
export async function openNewTransactionForm(
  page: Page,
  { dispatch = false }: { dispatch?: boolean } = {},
): Promise<Locator> {
  const opener = newTransactionOpener(page)

  if (dispatch) {
    await opener.dispatchEvent('click')
  } else {
    await opener.click()
  }

  return continueToTransactionForm(page)
}
