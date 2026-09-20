import { expect, test } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'
import { blockUnmockedBackend } from './helpers/modalFixtures'
import {
  backgroundAnchor,
  captureBackgroundBaseline,
  lockState,
  mockAccountMutations,
  mockAccountsPage,
  openAddWizard,
  openEditModal,
  openJoinModal,
  openScrollableAccountsPage,
  openShareModal,
  pageOffset,
  positionAndCaptureCardBaseline,
} from './helpers/accountsModalFixtures'

test.beforeEach(async ({ page }) => {
  await blockUnmockedBackend(page)
  await setupAuthenticatedMocks(page)
  await mockAccountsPage(page)
  await mockAccountMutations(page)
})

test('normal accounts page is scrollable without persistent lock', async ({ page }) => {
  await openScrollableAccountsPage(page, 640)

  expect((await lockState(page)).bodyPosition).not.toBe('fixed')
  expect((await lockState(page)).htmlOverflow).not.toBe('hidden')

  // Search or tab change does not lock
  await page.getByRole('button', { name: /^Cards/i }).click()
  expect((await lockState(page)).bodyPosition).not.toBe('fixed')

  await page.getByPlaceholder('Search accounts').fill('BDO')
  expect((await lockState(page)).bodyPosition).not.toBe('fixed')
})

test('Add wizard freezes the page across step transitions and restores on close', async ({
  page,
}) => {
  await openScrollableAccountsPage(page, 640)
  const { anchor: anchorBefore, offset: offsetBefore } =
    await captureBackgroundBaseline(page)

  // Open Add Wizard using dispatchEvent so runner doesn't scroll to top
  const dialog = await openAddWizard(page)

  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')
  await expect.poll(async () => (await lockState(page)).htmlOverflow).toBe('hidden')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Wheel gesture on backdrop does not move background
  await page.mouse.move(4, 4)
  await page.mouse.wheel(0, 500)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Step 1 -> Step 2
  await dialog.getByRole('button', { name: /Traditional Bank/i }).click()
  await dialog.getByRole('button', { name: 'Continue' }).click()

  const step2Dialog = page.getByRole('dialog', { name: 'Step 2 of 3' })
  await expect(step2Dialog).toBeVisible()
  expect((await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Step 2 -> Step 3
  await step2Dialog.getByRole('combobox').selectOption('BDO')
  await step2Dialog.getByRole('button', { name: 'Continue' }).click()

  const step3Dialog = page.getByRole('dialog', { name: 'Step 3 of 3' })
  await expect(step3Dialog).toBeVisible()
  expect((await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Step 3 -> Back to Step 2
  await step3Dialog.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('dialog', { name: 'Step 2 of 3' })).toBeVisible()
  expect((await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Dismiss via Escape
  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect.poll(() => pageOffset(page)).toBe(offsetBefore)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  expect((await lockState(page)).bodyPosition).not.toBe('fixed')
})

test('Join modal freezes the page and restores on close', async ({ page }) => {
  await openScrollableAccountsPage(page, 640)
  const { anchor: anchorBefore, offset: offsetBefore } =
    await captureBackgroundBaseline(page)

  const dialog = await openJoinModal(page)

  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Backdrop gesture
  await page.mouse.move(4, 4)
  await page.mouse.wheel(0, 400)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Escape to close
  await page.keyboard.press('Escape')

  await expect(dialog).toBeHidden()
  await expect.poll(() => pageOffset(page)).toBe(offsetBefore)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  expect((await lockState(page)).bodyPosition).not.toBe('fixed')
})

test('Share modal isolates scroll and handles nested confirmation without unlocking', async ({
  page,
}) => {
  await openScrollableAccountsPage(page, 640)
  const { anchor: anchorBefore, offset: offsetBefore } =
    await positionAndCaptureCardBaseline(page)

  // Open Share modal on the positioned card
  const dialog = await openShareModal(page)

  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Click revoke invitation to open SweetAlert confirmation
  await dialog.getByRole('button', { name: 'Revoke invitation' }).click()

  // SweetAlert modal is open
  const swalPopup = page.locator('.swal2-popup')
  await expect(swalPopup).toBeVisible()
  expect((await lockState(page)).bodyPosition).toBe('fixed')

  // Press Escape - only SweetAlert should close, Share modal stays open
  await page.keyboard.press('Escape')
  await expect(swalPopup).toBeHidden()
  await expect(dialog).toBeVisible()
  expect((await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Close Share modal
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await expect.poll(() => pageOffset(page)).toBe(offsetBefore)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  expect((await lockState(page)).bodyPosition).not.toBe('fixed')
})

test('Edit modal locks the page and restores on cancel', async ({ page }) => {
  await openScrollableAccountsPage(page, 640)
  const { anchor: anchorBefore, offset: offsetBefore } =
    await positionAndCaptureCardBaseline(page)

  // Open Edit modal on the positioned card
  const dialog = await openEditModal(page)

  await expect.poll(async () => (await lockState(page)).bodyPosition).toBe('fixed')
  expect(await backgroundAnchor(page)).toBe(anchorBefore)

  // Cancel button
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  await expect.poll(() => pageOffset(page)).toBe(offsetBefore)
  expect(await backgroundAnchor(page)).toBe(anchorBefore)
  expect((await lockState(page)).bodyPosition).not.toBe('fixed')
})
