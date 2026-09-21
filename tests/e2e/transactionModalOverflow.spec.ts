import { expect, test, type Locator, type Page } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'
import {
  blockUnmockedBackend,
  mockTransactionPage,
  openInViewportEditForm,
} from './helpers/modalFixtures'

const transactionHeading = 'Transaction History'

/**
 * Reads layout bounds and scroll metrics for all containment layers:
 * form, modal body, modal panel, and document root.
 */
async function getModalOverflowMetrics(page: Page) {
  return page.evaluate(() => {
    const form = document.querySelector<HTMLFormElement>('.modal-panel form')
    const body = document.querySelector<HTMLElement>('.modal-body')
    const panel = document.querySelector<HTMLElement>('.modal-panel')
    const doc = document.documentElement

    return {
      bodyClientWidth: body?.clientWidth ?? 0,
      bodyScrollLeft: body?.scrollLeft ?? 0,
      bodyScrollWidth: body?.scrollWidth ?? 0,
      docClientWidth: doc.clientWidth,
      docScrollWidth: doc.scrollWidth,
      formClientWidth: form?.clientWidth ?? 0,
      formScrollWidth: form?.scrollWidth ?? 0,
      panelClientWidth: panel?.clientWidth ?? 0,
      panelScrollWidth: panel?.scrollWidth ?? 0,
    }
  })
}

/**
 * Asserts that none of the nested layers (form, modal-body, modal-panel, document)
 * have horizontal scroll overflow. A 1px tolerance accounts for subpixel layout rounding.
 */
async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await getModalOverflowMetrics(page)

  expect(
    metrics.formScrollWidth,
    'Form scrollWidth must not exceed clientWidth',
  ).toBeLessThanOrEqual(metrics.formClientWidth + 1)

  expect(
    metrics.bodyScrollWidth,
    'Modal body scrollWidth must not exceed clientWidth',
  ).toBeLessThanOrEqual(metrics.bodyClientWidth + 1)

  expect(
    metrics.panelScrollWidth,
    'Modal panel scrollWidth must not exceed clientWidth',
  ).toBeLessThanOrEqual(metrics.panelClientWidth + 1)

  expect(
    metrics.docScrollWidth,
    'Document scrollWidth must not exceed clientWidth',
  ).toBeLessThanOrEqual(metrics.docClientWidth + 1)

  expect(
    metrics.bodyScrollLeft,
    'Modal body scrollLeft must remain 0',
  ).toBe(0)
}

/**
 * Asserts that the native date input is strictly contained within its shell
 * and that on single-column layouts it aligns with the sibling category select.
 */
async function assertDateFieldGeometry(
  page: Page,
  options: { isSingleColumn?: boolean } = {},
) {
  const geom = await page.evaluate(() => {
    const input = document.getElementById('transaction-date')
    const shell = input?.parentElement
    const select = document.getElementById('transaction-category')
    if (!input || !shell) return null

    const inputRect = input.getBoundingClientRect()
    const shellRect = shell.getBoundingClientRect()
    const selectRect = select?.getBoundingClientRect()

    return {
      inputLeft: inputRect.left,
      inputRight: inputRect.right,
      inputWidth: inputRect.width,
      selectLeft: selectRect?.left ?? null,
      selectWidth: selectRect?.width ?? null,
      shellLeft: shellRect.left,
      shellRight: shellRect.right,
      shellWidth: shellRect.width,
    }
  })

  expect(geom, 'Date input and shell must be present in DOM').not.toBeNull()
  if (!geom) return

  // Input must be contained within its shell (1px tolerance for subpixel anti-aliasing)
  expect(
    geom.inputLeft,
    'Date input left boundary must be inside shell',
  ).toBeGreaterThanOrEqual(geom.shellLeft - 1)

  expect(
    geom.inputRight,
    'Date input right boundary must be inside shell',
  ).toBeLessThanOrEqual(geom.shellRight + 1)

  expect(
    geom.inputWidth,
    'Date input width must not exceed shell width',
  ).toBeLessThanOrEqual(geom.shellWidth + 1)

  if (options.isSingleColumn && geom.selectWidth !== null && geom.selectLeft !== null) {
    // Single-column alignment with category select
    expect(
      Math.abs(geom.shellWidth - geom.selectWidth),
      'Date shell width must match Category select width in single-column layout',
    ).toBeLessThanOrEqual(2)

    expect(
      Math.abs(geom.shellLeft - geom.selectLeft),
      'Date shell left position must align with Category select',
    ).toBeLessThanOrEqual(2)
  }
}

/**
 * Simulates horizontal swipe/gesture on the modal body to verify it does not develop
 * horizontal scroll offset.
 */
async function exerciseHorizontalGesture(page: Page, body: Locator) {
  const box = await body.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
    await page.mouse.up()
  }

  // Also attempt programmatic scrollLeft change to verify overflow-x: hidden prevents it
  await page.evaluate(() => {
    const modalBody = document.querySelector('.modal-body')
    if (modalBody) {
      modalBody.scrollLeft = 50
    }
  })

  const scrollLeft = await page.evaluate(
    () => document.querySelector('.modal-body')?.scrollLeft ?? 0,
  )
  expect(scrollLeft, 'Horizontal offset must remain 0 after gestures').toBe(0)
}

async function openTransactionsPage(page: Page) {
  await page.goto('/transactions')
  await expect(
    page.getByRole('heading', { name: transactionHeading }),
  ).toBeVisible()
}

async function openNewTransactionModal(page: Page) {
  await page.getByRole('button', { name: 'New Transaction' }).dispatchEvent('click')
  const dialog = page.getByRole('dialog', { name: 'New Transaction' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('#transaction-date')).toBeVisible()
  return dialog
}

test.describe('Transaction Date Field Overflow & Modal Containment', () => {
  test.beforeEach(async ({ page }) => {
    await blockUnmockedBackend(page)
    await setupAuthenticatedMocks(page)
    await mockTransactionPage(page)
  })

  test.describe('Mobile Viewport Matrix', () => {
    const viewports = [
      { name: '320px (Narrow Mobile)', width: 320, height: 568 },
      { name: '375px (iPhone SE)', width: 375, height: 667 },
      { name: '390px (iPhone 13/14)', width: 390, height: 844 },
      { name: '412px (Android / Pixel)', width: 412, height: 915 },
    ]

    for (const vp of viewports) {
      test(`renders without horizontal overflow at ${vp.name}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await openTransactionsPage(page)
        const dialog = await openNewTransactionModal(page)
        const modalBody = dialog.locator('.modal-body')

        await assertNoHorizontalOverflow(page)
        await assertDateFieldGeometry(page, { isSingleColumn: true })
        await exerciseHorizontalGesture(page, modalBody)
      })
    }
  })

  test.describe('Responsive Transition Boundaries', () => {
    test('fits cleanly just below sm breakpoint at 639px (single column)', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 639, height: 800 })
      await openTransactionsPage(page)
      await openNewTransactionModal(page)

      await assertNoHorizontalOverflow(page)
      await assertDateFieldGeometry(page, { isSingleColumn: true })
    })

    test('fits cleanly at sm breakpoint at 640px (two columns)', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 640, height: 800 })
      await openTransactionsPage(page)
      await openNewTransactionModal(page)

      await assertNoHorizontalOverflow(page)
      await assertDateFieldGeometry(page, { isSingleColumn: false })
    })
  })

  test.describe('Transaction Types Coverage', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    const types: Array<{ name: string; pattern: RegExp }> = [
      { name: 'Expense', pattern: /^expense$/i },
      { name: 'Income', pattern: /^income$/i },
      { name: 'Withdrawal', pattern: /^withdrawal$/i },
      { name: 'Transfer/Deposit', pattern: /^transfer/i },
    ]

    for (const { name, pattern } of types) {
      test(`maintains geometry and containment for ${name}`, async ({
        page,
      }) => {
        await openTransactionsPage(page)
        const dialog = await openNewTransactionModal(page)

        await dialog.getByRole('button', { name: pattern }).click()
        // Allow form options to settle
        await page.waitForTimeout(100)

        await assertNoHorizontalOverflow(page)
        await assertDateFieldGeometry(page, { isSingleColumn: true })
      })
    }
  })

  test.describe('Form States: Edit, Validation & Date Interaction', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('maintains containment in Edit Transaction mode', async ({ page }) => {
      await openTransactionsPage(page)
      const dialog = await openInViewportEditForm(page)

      await assertNoHorizontalOverflow(page)
      await assertDateFieldGeometry(page, { isSingleColumn: true })

      // Verify date value is populated from fixture
      const dateInput = dialog.locator('#transaction-date')
      const value = await dateInput.inputValue()
      expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('preserves containment on invalid submit error', async ({ page }) => {
      await openTransactionsPage(page)
      const dialog = await openNewTransactionModal(page)

      // Submit without required fields to trigger validation messages
      await dialog.getByRole('button', { name: 'Save Transaction' }).click()

      // Error message should appear without causing overflow
      await expect(dialog.locator('#transaction-category-error')).toBeVisible()
      await assertNoHorizontalOverflow(page)
      await assertDateFieldGeometry(page, { isSingleColumn: true })
    })

    test('focuses date input when label is clicked and accepts date change', async ({
      page,
    }) => {
      await openTransactionsPage(page)
      const dialog = await openNewTransactionModal(page)

      // Clicking label focuses input
      await dialog.locator('label[for="transaction-date"]').click()
      await expect(dialog.locator('#transaction-date')).toBeFocused()

      // Value change works
      const dateInput = dialog.locator('#transaction-date')
      await dateInput.fill('2026-06-15')
      expect(await dateInput.inputValue()).toBe('2026-06-15')

      await assertNoHorizontalOverflow(page)
    })
  })

  test.describe('Short Landscape Viewport Fallback', () => {
    test.use({ viewport: { width: 667, height: 375 } })

    test('preserves panel scrolling, reachable actions and background lock restoration', async ({
      page,
    }) => {
      await openTransactionsPage(page)
      const dialog = await openNewTransactionModal(page)

      // Under max-height: 30rem (480px), .modal-panel is the scroll container
      // and .modal-body has overflow: visible.
      await assertNoHorizontalOverflow(page)

      // Save button must be reachable
      const saveButton = dialog.getByRole('button', { name: 'Save Transaction' })
      await saveButton.scrollIntoViewIfNeeded()
      await expect(saveButton).toBeVisible()

      // Close button must be reachable and dismiss restores page state
      const closeButton = dialog.getByRole('button', { name: 'Close transaction form' })
      await expect(closeButton).toBeVisible()
      await closeButton.click()
      await expect(dialog).not.toBeVisible()

      // Background lock should be released
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow)
      expect(bodyOverflow).toBe('')
    })
  })

  test.describe('Related Goal Modal (#goal-date)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('renders #goal-date without horizontal overflow', async ({ page }) => {
      await page.goto('/monitoring?tab=goals')
      await page.waitForLoadState('domcontentloaded')

      // Click Create Goal from empty panel
      await page.getByRole('button', { name: 'Create Goal' }).click()
      const dialog = page.getByRole('dialog', { name: 'New Goal' })
      await expect(dialog).toBeVisible()

      const goalDateInput = dialog.locator('#goal-date')
      await expect(goalDateInput).toBeVisible()

      // Verify containment
      const geom = await page.evaluate(() => {
        const input = document.getElementById('goal-date')
        const shell = input?.parentElement
        if (!input || !shell) return null
        const inputRect = input.getBoundingClientRect()
        const shellRect = shell.getBoundingClientRect()
        return {
          inputLeft: inputRect.left,
          inputRight: inputRect.right,
          inputWidth: inputRect.width,
          shellLeft: shellRect.left,
          shellRight: shellRect.right,
          shellWidth: shellRect.width,
        }
      })

      expect(geom).not.toBeNull()
      if (geom) {
        expect(geom.inputLeft).toBeGreaterThanOrEqual(geom.shellLeft - 1)
        expect(geom.inputRight).toBeLessThanOrEqual(geom.shellRight + 1)
        expect(geom.inputWidth).toBeLessThanOrEqual(geom.shellWidth + 1)
      }

      await assertNoHorizontalOverflow(page)
    })
  })
})
