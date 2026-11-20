import { expect, test, type Page } from '@playwright/test'

import { setupAuthenticatedMocks } from './helpers/authMock'
import { createDebtReportingFixture } from '../helpers/debtReportingFixture'

// Add Purchase is the pilot for ModalFrame's native <dialog> mode.
async function mockDebts(page: Page) {
  const fixture = createDebtReportingFixture()
  await page.route('**/rest/v1/**', async route => {
    const request = route.request()
    if (new URL(request.url()).pathname === '/rest/v1/profiles') return route.fallback()
    const reply = fixture.respond(request.method(), request.url(), request.postDataJSON() ?? {})
    await route.fulfill({ status: reply.status, headers: reply.headers, contentType: 'application/json', body: request.method() === 'HEAD' ? '' : JSON.stringify(reply.body) })
  })
}

async function openAddPurchase(page: Page) {
  await setupAuthenticatedMocks(page)
  await mockDebts(page)
  await page.goto('/debts')
  const opener = page.getByRole('article', { name: 'Debt: Atome' }).getByTitle('Add purchase')
  await expect(opener).toBeVisible()
  await opener.click()
  const dialog = page.getByRole('dialog', { name: /Add Purchase: Atome/i })
  await expect(dialog).toBeVisible()

  return { dialog, opener }
}

test('uses a native modal dialog without freezing the body', async ({ page }) => {
  const { dialog } = await openAddPurchase(page)

  await expect(page.locator('dialog[data-native-modal][open]')).toHaveCount(1)
  // One dialog role in the tree: the native element, not a second hand-rolled one.
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(dialog).toHaveJSProperty('tagName', 'DIALOG')
  expect(await page.evaluate(() => document.querySelector('dialog')?.matches(':modal'))).toBe(true)

  const lock = await page.evaluate(() => ({
    bodyPosition: getComputedStyle(document.body).position,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY,
  }))
  expect(lock.bodyPosition).not.toBe('fixed')
  expect(lock.htmlOverflow).not.toBe('hidden')
})

test('keeps focus inside, closes on Escape and returns focus to the opener', async ({ page }) => {
  const { dialog, opener } = await openAddPurchase(page)

  for (let press = 0; press < 12; press += 1) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
  }

  await page.keyboard.press('Escape')
  await expect(page.locator('dialog[open]')).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('closes from the close button and from a backdrop click', async ({ page }) => {
  const { dialog } = await openAddPurchase(page)

  await dialog.getByRole('button', { name: 'Close add purchase dialog' }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)

  await page.getByRole('article', { name: 'Debt: Atome' }).getByTitle('Add purchase').click()
  await expect(page.getByRole('dialog', { name: /Add Purchase: Atome/i })).toBeVisible()
  await page.mouse.click(2, 2)
  await expect(page.locator('dialog[open]')).toHaveCount(0)
})

// The success alert is raised just before the dialog closes. It must stay in
// <body>: an alert appended inside the dialog would be removed with it.
test('the success alert survives the dialog closing and is on top', async ({ page }) => {
  await setupAuthenticatedMocks(page)
  await page.goto('/debts')
  await page.getByRole('button', { name: 'Add purchase' }).first().click()
  const dialog = page.getByRole('dialog', { name: /Add Purchase: Atome/i })
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('Purchase Amount (PHP)').fill('50')
  await dialog.getByRole('button', { name: 'Add Purchase', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)

  const toast = page.locator('body > .swal2-container .swal2-toast')
  await expect(toast).toContainText('Purchase added to your balance.')
  expect(
    await toast.evaluate((element) => {
      const box = element.getBoundingClientRect()

      return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
    }),
  ).toBe(true)
})
