import { expect, test, type Locator, type Page } from '@playwright/test'

import {
  mockAccountMutations,
  mockAccountsPage,
  openShareModal,
} from './helpers/accountsModalFixtures'
import { setupAuthenticatedMocks } from './helpers/authMock'
import {
  blockUnmockedBackend,
  mockTransactionMutations,
  mockTransactionPage,
  openInViewportEditForm,
} from './helpers/modalFixtures'

/**
 * Issue #37: an open modal takes focus, keeps Tab and Shift+Tab inside, makes
 * the page behind it inert, and returns focus to its opener on close without
 * moving the page. Keyboard input is emulated; screen-reader and physical
 * device checks are recorded separately in the PR.
 */

const backgroundAnchor = (page: Page) =>
  page.evaluate(() => {
    const heading = document.querySelector('main h1')

    return heading
      ? Math.round(heading.getBoundingClientRect().top * 100) / 100
      : null
  })

const activeIsDialog = (dialog: Locator) =>
  dialog.evaluate((element) => document.activeElement === element)

const activeInside = (dialog: Locator) =>
  dialog.evaluate((element) => element.contains(document.activeElement))

const rootIsInert = (page: Page) =>
  page.evaluate(() => document.getElementById('root')?.hasAttribute('inert') ?? false)

/** Opens a modal the way a keyboard user does: focus the opener, press Enter. */
async function openWithKeyboard(page: Page, opener: Locator, dialogName: string) {
  await opener.focus()
  // Captured after focusing, which may itself scroll the opener into view.
  const anchorBefore = await backgroundAnchor(page)
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: dialogName })
  await expect(dialog).toBeVisible()
  await expect.poll(() => activeIsDialog(dialog)).toBe(true)

  return { anchorBefore, dialog }
}

/** Tabs forwards and backwards past both ends; focus must never leave. */
async function expectTabContained(page: Page, dialog: Locator) {
  const tabbableCount = await dialog.evaluate(
    (element) =>
      element.querySelectorAll(
        'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ).length,
  )
  const presses = Math.min(tabbableCount + 2, 40)

  for (let index = 0; index < presses; index += 1) {
    await page.keyboard.press('Tab')
    expect(await activeInside(dialog)).toBe(true)
  }

  for (let index = 0; index < presses; index += 1) {
    await page.keyboard.press('Shift+Tab')
    expect(await activeInside(dialog)).toBe(true)
  }
}

async function expectFocusReturned(page: Page, opener: Locator, anchorBefore: number | null) {
  await expect(opener).toBeFocused()
  expect(await rootIsInert(page)).toBe(false)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
}

test.describe('transaction and monitoring forms', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await blockUnmockedBackend(page)
    await setupAuthenticatedMocks(page)
    await mockTransactionPage(page)
  })

  for (const variant of ['Expense', 'Transfer/Deposit'] as const) {
    test(`contains and restores focus for the ${variant} transaction form`, async ({
      page,
    }) => {
      await page.goto('/transactions')
      await expect(page.getByRole('heading', { name: 'Transaction History' })).toBeVisible()

      const opener = page.getByRole('button', { name: 'New Transaction' })
      const { anchorBefore, dialog } = await openWithKeyboard(page, opener, 'New Transaction')

      expect(await rootIsInert(page)).toBe(true)

      if (variant === 'Transfer/Deposit') {
        // The long form: tab through every Transfer field too.
        await dialog.getByRole('button', { name: 'Transfer/Deposit' }).click()
      }

      await expectTabContained(page, dialog)

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expectFocusReturned(page, opener, anchorBefore)
    })
  }

  test('returns focus to the row Edit button after closing Edit Transaction', async ({
    page,
  }) => {
    await page.goto('/transactions')
    await expect(page.getByRole('heading', { name: 'Transaction History' })).toBeVisible()

    const opener = page.locator('main [aria-label="Edit transaction"]:visible').first()
    const { anchorBefore, dialog } = await openWithKeyboard(page, opener, 'Edit Transaction')

    await expectTabContained(page, dialog)

    await dialog.getByRole('button', { name: 'Close transaction form' }).click()
    await expect(dialog).toBeHidden()
    await expectFocusReturned(page, opener, anchorBefore)
  })

  for (const [tab, dialogName] of [
    ['budgets', 'New Budget'],
    ['goals', 'New Goal'],
  ] as const) {
    test(`contains and restores focus for the ${dialogName} form`, async ({ page }) => {
      await page.goto(`/monitoring?tab=${tab}`)
      await expect(page.getByRole('heading', { name: 'Budgets & Goals' })).toBeVisible()

      const opener = page.getByRole('button', { name: dialogName })
      const { anchorBefore, dialog } = await openWithKeyboard(page, opener, dialogName)

      expect(await rootIsInert(page)).toBe(true)
      await expectTabContained(page, dialog)

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expectFocusReturned(page, opener, anchorBefore)
    })
  }

  test('keeps a form above the desktop assistant from sharing Tab or Escape', async ({
    page,
  }) => {
    await page.goto('/transactions')
    await expect(page.getByRole('heading', { name: 'Transaction History' })).toBeVisible()

    await page.getByRole('button', { name: 'Open PennyWings AI Assistant' }).click()
    const assistant = page.getByRole('dialog', { name: 'PennyWings AI' })
    await expect(assistant).toBeVisible()

    const opener = page.getByRole('button', { name: 'New Transaction' })
    const { dialog } = await openWithKeyboard(page, opener, 'New Transaction')

    await expectTabContained(page, dialog)
    expect(await assistant.evaluate((element) => element.closest('[inert]') !== null)).toBe(
      true,
    )

    // One Escape closes only the form; the assistant stays open.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(assistant).toBeVisible()
    await expect(opener).toBeFocused()
  })
})

test.describe('account modals', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await blockUnmockedBackend(page)
    await setupAuthenticatedMocks(page)
    await mockAccountsPage(page)
    await mockAccountMutations(page)
  })

  test('contains and restores focus for Edit Account', async ({ page }) => {
    await page.goto('/accounts')
    const opener = page.locator('main button[aria-label^="Edit "]').first()
    await expect(opener).toBeVisible()

    const { anchorBefore, dialog } = await openWithKeyboard(page, opener, 'Edit Account')

    expect(await rootIsInert(page)).toBe(true)
    await expectTabContained(page, dialog)

    await dialog.getByRole('button', { name: 'Close edit account' }).click()
    await expect(dialog).toBeHidden()
    await expectFocusReturned(page, opener, anchorBefore)
  })

  test('hands focus back into the Share modal after a nested confirmation', async ({
    page,
  }) => {
    await page.goto('/accounts')
    await expect(page.locator('main button[aria-label^="Share "]').first()).toBeVisible()

    const dialog = await openShareModal(page)
    await dialog.getByRole('button', { name: 'Revoke invitation' }).click()

    const swalPopup = page.locator('.swal2-popup')
    await expect(swalPopup).toBeVisible()
    // The alert is appended after the modal opened, so it must stay usable.
    expect(await swalPopup.evaluate((element) => element.closest('[inert]') === null)).toBe(
      true,
    )

    await page.keyboard.press('Escape')
    await expect(swalPopup).toBeHidden()
    await expect(dialog).toBeVisible()
    await expect.poll(() => activeInside(dialog)).toBe(true)
  })
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 412, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await blockUnmockedBackend(page)
    await setupAuthenticatedMocks(page)
    await mockTransactionPage(page)
  })

  test('focuses the dialog, not a field, so no keyboard opens unprompted', async ({
    page,
  }) => {
    await page.goto('/transactions')
    await expect(page.getByRole('heading', { name: 'Transaction History' })).toBeVisible()

    const opener = page.getByRole('button', { name: 'New Transaction' })
    const { dialog } = await openWithKeyboard(page, opener, 'New Transaction')

    expect(
      await page.evaluate(() => document.activeElement?.tagName.toLowerCase()),
    ).toBe('section')
    await expectTabContained(page, dialog)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('keeps focus inside and ignores Escape while a save is in flight', async ({
    page,
  }) => {
    await mockTransactionMutations(page, 'delayed')
    await page.goto('/transactions')
    await expect(page.getByRole('heading', { name: 'Transaction History' })).toBeVisible()

    const dialog = await openInViewportEditForm(page)
    await dialog.getByRole('button', { name: 'Update Transaction' }).click()
    await expect(dialog.getByRole('button', { name: 'Updating...' })).toBeDisabled()

    await page.keyboard.press('Escape')

    await expect(dialog).toBeVisible()
    expect(await activeInside(dialog)).toBe(true)
    expect(await rootIsInert(page)).toBe(true)

    await expect(page.getByText('Transaction updated.').first()).toBeVisible()
    await expect(dialog).toBeHidden()
    await expect.poll(() => rootIsInert(page)).toBe(false)
  })
})
