import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

test.describe('Persistent app shell and route transitions', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('keeps the same navigation chrome mounted across client-side navigation', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name.startsWith('Mobile')
    await page.goto('/dashboard')

    const nav = isMobile
      ? page.getByRole('navigation', { name: 'Primary mobile navigation' })
      : page.getByRole('navigation', { name: 'Primary desktop navigation' })
    await expect(nav).toBeVisible()

    // A DOM property survives only while the very same element stays mounted.
    await nav.evaluate((element) => {
      ;(element as HTMLElement & { __shellMarker?: string }).__shellMarker = 'kept'
    })

    for (const [name, path] of [
      ['Accounts', '/accounts'],
      ['Debts', '/debts'],
      ['Activity', '/transactions'],
    ] as const) {
      await nav.getByRole('link', { name: new RegExp(name) }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expect(page.getByRole('main')).toHaveCount(1)
    }

    const marker = await nav.evaluate(
      (element) => (element as HTMLElement & { __shellMarker?: string }).__shellMarker,
    )
    expect(marker).toBe('kept')
  })

  test('plays the enter animation on the page wrapper and not on the main landmark', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'no-preference' })
    const page = await context.newPage()
    await setupAuthenticatedMocks(page)
    await page.goto('/dashboard')

    const wrapper = page.locator('.route-enter')
    await expect(wrapper).toHaveCount(1)
    await expect
      .poll(() => wrapper.evaluate((el) => getComputedStyle(el).animationName))
      .toBe('route-enter')

    const mainTransition = await page
      .getByRole('main')
      .evaluate((el) => getComputedStyle(el).transitionDuration)
    expect(mainTransition).toBe('0s')

    await context.close()
  })

  test('removes the enter animation when reduced motion is requested', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await setupAuthenticatedMocks(page)
    await page.goto('/dashboard')

    const animationName = await page
      .locator('.route-enter')
      .evaluate((el) => getComputedStyle(el).animationName)
    expect(animationName).toBe('none')

    await context.close()
  })

  test('starts a newly opened page at the top of the scroll', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.startsWith('Mobile')
    await page.goto('/transactions')

    const scrollable = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    )
    test.skip(scrollable < 80, 'The mocked page is not tall enough to scroll.')

    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    const nav = isMobile
      ? page.getByRole('navigation', { name: 'Primary mobile navigation' })
      : page.getByRole('navigation', { name: 'Primary desktop navigation' })
    await nav.getByRole('link', { name: /Accounts/ }).click()
    await expect(page).toHaveURL(/\/accounts$/)

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })
})
