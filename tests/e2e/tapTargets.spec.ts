import { expect, test, type Locator, type Page } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'
import { createDebtReportingFixture } from '../helpers/debtReportingFixture'

// Apple's minimum comfortable touch target, with sub-pixel tolerance for layout rounding.
const MIN_TARGET = 44
const TOLERANCE = 0.5

test.use({ viewport: { width: 390, height: 844 } })

async function expectTarget(target: Locator, name: string) {
  const box = await target.boundingBox()
  expect(box, `${name} is rendered`).not.toBeNull()
  expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(MIN_TARGET - TOLERANCE)
  expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(MIN_TARGET - TOLERANCE)
}

async function mockDebts(page: Page) {
  const fixture = createDebtReportingFixture()
  await page.route('**/rest/v1/**', async route => {
    const request = route.request()
    if (new URL(request.url()).pathname === '/rest/v1/profiles') return route.fallback()
    const reply = fixture.respond(request.method(), request.url(), request.postDataJSON() ?? {})
    await route.fulfill({ status: reply.status, headers: reply.headers, contentType: 'application/json', body: request.method() === 'HEAD' ? '' : JSON.stringify(reply.body) })
  })
}

test('debt card actions meet 44px tap targets', async ({ page }) => {
  await setupAuthenticatedMocks(page)
  await mockDebts(page)
  await page.goto('/debts')
  await page.evaluate(() => document.fonts.ready)
  const card = page.getByRole('article', { name: 'Debt: Atome' })
  await expect(card).toBeVisible()
  await expectTarget(card.getByRole('button', { name: 'Debt actions' }), 'Debt actions')
  await expectTarget(card.getByTitle('Add purchase'), 'Add purchase')
  await expectTarget(card.getByTitle('Activity history'), 'Activity history')

  // The opened menu sits below its trigger, so taps on the trigger never hit a menu item.
  const trigger = card.getByRole('button', { name: 'Debt actions' })
  await trigger.click()
  const menu = trigger.locator('xpath=following-sibling::*[1]')
  await expect(menu).toBeVisible()
  expect((await menu.boundingBox())!.y, 'menu top').toBeGreaterThanOrEqual((await trigger.boundingBox())!.y + (await trigger.boundingBox())!.height - TOLERANCE)
  const items = menu.getByRole('menuitem')
  expect(await items.count()).toBeGreaterThan(0)
  for (const item of await items.all()) {
    await expectTarget(item, 'Debt menu item')
  }
})

test('debt card menu is operable from the keyboard', async ({ page }) => {
  await setupAuthenticatedMocks(page)
  await mockDebts(page)
  await page.goto('/debts')
  const card = page.getByRole('article', { name: 'Debt: Atome' })
  const trigger = card.getByRole('button', { name: 'Debt actions' })
  await expect(trigger).toBeVisible()

  await trigger.focus()
  await page.keyboard.press('Enter')
  const items = page.getByRole('menu', { name: 'Debt actions' }).getByRole('menuitem')
  await expect(items.first()).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await expect(items.nth(1)).toBeFocused()
  await page.keyboard.press('Home')
  await expect(items.first()).toBeFocused()
  await page.keyboard.press('End')
  await expect(items.last()).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(trigger).toBeFocused()

  await trigger.click()
  await expect(page.getByRole('menu')).toBeVisible()
  await page.mouse.click(2, 2)
  await expect(page.getByRole('menu')).toHaveCount(0)
})

test('login password controls meet 44px tap targets without shifting layout', async ({ page }) => {
  await page.goto('/login')
  const password = page.getByLabel('Password', { exact: true })
  await expect(password).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const toggle = page.getByRole('button', { name: 'Show password' })
  await expectTarget(toggle, 'Show password')
  const forgot = page.getByRole('link', { name: 'Forgot password?' })
  expect((await forgot.boundingBox())!.height, 'Forgot password height').toBeGreaterThanOrEqual(MIN_TARGET - TOLERANCE)
  // Its hit area must not reach into the password field below it.
  expect((await forgot.boundingBox())!.y + (await forgot.boundingBox())!.height, 'Forgot password hit area bottom').toBeLessThanOrEqual((await password.boundingBox())!.y + TOLERANCE)

  // The label row keeps its compact text height; only the hit area grows.
  const labelRow = page.locator(`label[for="${await password.getAttribute('id')}"]`).locator('..')
  expect((await labelRow.boundingBox())!.height, 'label row height').toBeLessThanOrEqual(24 + TOLERANCE)

  // The toggle stays inside the field and clear of the typed text.
  const geometry = await password.evaluate(input => {
    const style = getComputedStyle(input)
    const field = input.getBoundingClientRect()
    const button = input.parentElement!.querySelector('button')!.getBoundingClientRect()
    return { textRight: field.right - parseFloat(style.paddingRight), fieldTop: field.top, fieldBottom: field.bottom, fieldRight: field.right, button }
  })
  expect(geometry.button.left).toBeGreaterThanOrEqual(geometry.textRight)
  expect(geometry.button.right).toBeLessThanOrEqual(geometry.fieldRight)
  expect(geometry.button.top).toBeGreaterThanOrEqual(geometry.fieldTop)
  expect(geometry.button.bottom).toBeLessThanOrEqual(geometry.fieldBottom)
})
