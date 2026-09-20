import { expect, test, type Locator, type Page } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'
import {
  blockUnmockedBackend,
  mockTransactionMutations,
  mockTransactionPage,
  openInViewportEditForm,
} from './helpers/modalFixtures'

/** The production toast for a rejected mutation. */
const settledMutationToast = 'Something went wrong.'

/**
 * Issue #35: an open overlay freezes the page, only the overlay's own scroll
 * region moves, and the original page offset comes back when the last overlay
 * closes.
 *
 * Deliberate choices:
 * - Background movement is measured with an element's viewport geometry, not
 *   `window.scrollY`. A fixed-body lock legitimately reports 0 while keeping the
 *   same pixels visible.
 * - Scrolling is driven with real wheel input. Setting `scrollTop` in JS proves
 *   nothing about scroll chaining.
 * - Wheel and mouse input is emulated; a physical-device checklist is still
 *   required for touch and software-keyboard behaviour.
 */

const transactionHeading = 'Transaction History'

const backgroundAnchor = (page: Page) =>
  page.evaluate(() => {
    const heading = document.querySelector('main h1')

    return heading
      ? Math.round(heading.getBoundingClientRect().top * 100) / 100
      : null
  })

const pageOffset = (page: Page) => page.evaluate(() => window.scrollY)

const lockState = (page: Page) =>
  page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    bodyPosition: getComputedStyle(document.body).position,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY,
  }))

async function openScrollableTransactionsPage(page: Page, height: number) {
  await page.setViewportSize({ width: 412, height })
  await page.goto('/transactions')
  await expect(
    page.getByRole('heading', { name: transactionHeading }),
  ).toBeVisible()

  // Precondition: without a taller-than-viewport page, "the background cannot
  // move" would pass for the wrong reason.
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight + 100,
      ),
    )
    .toBe(true)
}

async function openTransactionForm(page: Page) {
  await page.getByRole('button', { name: 'New Transaction' }).dispatchEvent('click')

  const dialog = page.getByRole('dialog', { name: 'New Transaction' })
  await expect(dialog).toBeVisible()

  return dialog
}

/**
 * Scrolls the page to a non-zero offset, then captures the offset and the
 * background's viewport anchor. Callers compare both around overlay gestures to
 * prove the page stayed visually stationary.
 */
async function captureBackgroundBaseline(page: Page) {
  await page.mouse.move(206, 320)
  await page.mouse.wheel(0, 400)
  await expect.poll(() => pageOffset(page)).toBeGreaterThan(0)

  const offset = await pageOffset(page)
  const anchor = await backgroundAnchor(page)

  expect(anchor).not.toBeNull()

  return { anchor, offset }
}

/**
 * Runs a guarded in-flight update through the Edit form, whose values are
 * already schema-valid against the shared fixtures. Supplying a second click is
 * unnecessary: the RPC mock answers after a fixed delay, so an in-flight
 * dismissal attempt can be asserted deterministically before the delayed
 * response arrives.
 */
async function submitInFlightUpdate(dialog: Locator) {
  await dialog.getByRole('button', { name: 'Update Transaction' }).click()
}

test.beforeEach(async ({ page }) => {
  // Registered first, so it only answers requests nothing else mocked.
  await blockUnmockedBackend(page)
  await setupAuthenticatedMocks(page)
  await mockTransactionPage(page)
})

test('keeps the page stationary behind the long transfer form', async ({
  page,
}) => {
  await openScrollableTransactionsPage(page, 640)

  // The background has to be scrollable before the overlay opens.
  const { anchor: anchorBefore, offset: offsetBefore } =
    await captureBackgroundBaseline(page)

  const dialog = await openTransactionForm(page)

  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')
  await expect.poll(async () => (await lockState(page)).htmlOverflow).toBe('hidden')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // A gesture that begins on the backdrop must not reach the page.
  await page.mouse.move(4, 4)
  await page.mouse.wheel(0, 600)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  await dialog
    .getByRole('button', { name: 'Transfer/Deposit' })
    .dispatchEvent('click')

  const region = dialog.locator('.modal-body')
  await expect(region).toHaveCount(1)
  const geometry = await region.evaluate((element) => ({
    client: element.clientHeight,
    scroll: element.scrollHeight,
  }))
  expect(geometry.scroll).toBeGreaterThan(geometry.client)

  // The header stays available while the long form scrolls internally.
  await expect(
    dialog.getByRole('button', { name: 'Close transaction form' }),
  ).toBeVisible()

  const box = await dialog.boundingBox()
  await page.mouse.move(
    box!.x + box!.width / 2,
    box!.y + box!.height / 2,
  )
  // Firefox only moves a locked page's inner region when it has focus, while
  // Chromium moves the hovered region without it. Focusing first keeps the
  // input identical while proving the same inner gesture on both engines.
  await region.evaluate((element) => {
    if (element instanceof HTMLElement) element.focus({ preventScroll: true })
  })
  await page.mouse.wheel(0, 300)
  await expect
    .poll(() => region.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Additional gestures at the inner bottom boundary must not chain outward.
  for (let index = 0; index < 8; index += 1) {
    await page.mouse.wheel(0, 800)
  }
  await expect
    .poll(() =>
      region.evaluate((element) =>
        Math.ceil(element.scrollTop + element.clientHeight),
      ),
    )
    .toBeGreaterThanOrEqual(geometry.scroll)
  await page.mouse.wheel(0, 800)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // And at the top boundary, where the page is the next scroller in line.
  for (let index = 0; index < 12; index += 1) {
    await page.mouse.wheel(0, -800)
  }
  await expect.poll(() => region.evaluate((element) => element.scrollTop)).toBe(0)
  await page.mouse.wheel(0, -800)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  await page.keyboard.press('Escape')

  await expect(dialog).toBeHidden()
  await expect.poll(() => pageOffset(page)).toBe(offsetBefore)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  await expect
    .poll(async () => (await lockState(page)).bodyPosition)
    .not.toBe('fixed')
  await expect
    .poll(async () => (await lockState(page)).htmlOverflow)
    .not.toBe('hidden')
})

test('locks the page behind a short form that stays reachable', async ({
  page,
}) => {
  // Wide and tall enough that the ten-row list still overflows the viewport.
  await page.setViewportSize({ width: 1280, height: 560 })
  await page.goto('/transactions')
  await expect(
    page.getByRole('heading', { name: transactionHeading }),
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight + 100,
      ),
    )
    .toBe(true)

  await page.mouse.move(640, 200)
  await page.mouse.wheel(0, 200)
  await expect.poll(() => pageOffset(page)).toBeGreaterThan(0)
  const offsetBefore = await pageOffset(page)
  const anchorBefore = await backgroundAnchor(page)

  const dialog = await openTransactionForm(page)
  const region = dialog.locator('.modal-body')

  // The whole income/expense form is taller than the panel allows, so it owns
  // the scroll region. The header and the submit path must stay pinned outside
  // it, never scrolled away.
  await expect
    .poll(async () =>
      region.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    )
    .toBe(true)
  const submitButton = dialog.getByRole('button', { name: 'Save Transaction' })
  await expect(submitButton).toBeInViewport()
  await expect(
    dialog.getByRole('button', { name: 'Close transaction form' }),
  ).toBeInViewport()

  // Wheel gestures aimed at the panel scroll the region, never the page.
  const box = await dialog.boundingBox()
  const point = { x: Math.round(box!.x + 15), y: Math.round(box!.y + 150) }
  await page.mouse.move(point.x, point.y)
  await page.mouse.click(point.x, point.y)
  await page.mouse.wheel(0, 900)
  await expect
    .poll(() => region.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  // Even after the form bottoms out, the submit path is still reachable.
  await expect(submitButton).toBeInViewport()

  // A gesture that begins on the backdrop must not reach the page either.
  await page.mouse.move(4, 4)
  await page.mouse.wheel(0, 600)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')

  await dialog
    .getByRole('button', { name: 'Close transaction form' })
    .dispatchEvent('click')

  await expect(dialog).toBeHidden()
  await expect.poll(() => pageOffset(page)).toBe(offsetBefore)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
})

test('keeps the lock while a save is in flight and releases it on success', async ({
  page,
}) => {
  await mockTransactionMutations(page, 'delayed')
  await openScrollableTransactionsPage(page, 640)

  const { anchor: anchorBefore, offset: offsetBefore } =
    await captureBackgroundBaseline(page)

  const dialog = await openInViewportEditForm(page)
  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  await submitInFlightUpdate(dialog)

  const savingButton = dialog.getByRole('button', { name: 'Updating...' })
  await expect(savingButton).toBeDisabled()

  // A dismissal attempt while the mutation is in flight must be refused and must
  // not release the page.
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await page.mouse.click(4, 4)
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('button', { name: 'Close transaction form' }),
  ).toBeDisabled()
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')

  await expect(page.getByText('Transaction updated.').first()).toBeVisible()
  await expect(dialog).toBeHidden()
  await expect.poll(() => pageOffset(page)).toBe(offsetBefore)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
})


test('keeps the form and the lock when a save fails', async ({ page }) => {
  await mockTransactionMutations(page, 'error')
  await openScrollableTransactionsPage(page, 640)

  const { anchor: anchorBefore, offset: offsetBefore } =
    await captureBackgroundBaseline(page)

  const dialog = await openInViewportEditForm(page)
  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  await submitInFlightUpdate(dialog)

  // The failed save keeps the form open and surfaces the error in place.
  await expect(page.getByText(settledMutationToast).first()).toBeVisible()
  await expect(dialog).toBeVisible()
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')

  // Dismissal is allowed again once the mutation settles.
  await expect(
    dialog.getByRole('button', { name: 'Close transaction form' }),
  ).not.toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect.poll(() => pageOffset(page)).toBe(offsetBefore)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
})

test('locks the page behind the budget modal and restores it on cancel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 640 })
  await page.goto('/monitoring')
  await expect(page.getByRole('heading', { name: 'Budgets & Goals' })).toBeVisible()

  await page
    .getByRole('button', { name: 'New Budget' })
    .dispatchEvent('click')

  const dialog = page.getByRole('dialog', { name: 'New Budget' })
  await expect(dialog).toBeVisible()
  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')

  // The submit path lives outside the scroll region but still belongs to the form.
  const submit = dialog.getByRole('button', { name: 'Create Budget' })
  await expect(submit).toBeVisible()
  expect(await submit.getAttribute('form')).toBe('budget-form')
  expect(
    await page.getByRole('dialog').locator('form').evaluate((element) => element.id),
  ).toBe('budget-form')

  await dialog.getByRole('button', { name: 'Cancel' }).click()

  await expect(dialog).toBeHidden()
  await expect
    .poll(async () => (await lockState(page)).bodyPosition)
    .not.toBe('fixed')
  await expect
    .poll(async () => (await lockState(page)).htmlOverflow)
    .not.toBe('hidden')
})

test('does not dismiss the edit account modal from the backdrop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 412, height: 640 })
  await page.goto('/accounts')
  await expect(page.getByRole('button', { name: 'Edit BDO Debit' })).toBeVisible()

  await page.getByRole('button', { name: 'Edit BDO Debit' }).click()

  const dialog = page.getByRole('dialog', { name: 'Edit Account' })
  await expect(dialog).toBeVisible()
  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')

  // A backdrop click must not close this modal; Escape and the close button do.
  await page.mouse.click(4, 4)
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect
    .poll(async () => (await lockState(page)).bodyPosition)
    .not.toBe('fixed')
})
