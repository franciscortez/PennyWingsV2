import { expect, test } from '@playwright/test'

import {
  calendarFixtureDates,
  setupAuthenticatedMocks,
} from './helpers/authMock'

// Matches the section's `aria-label` format: "March 14, 2026 — ..." with an
// em dash. Built from the mocked dates so the spec follows the current month.
const longDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

test.describe('Daily spending calendar', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('renders on /reports with the month grid', async ({ page }) => {
    await page.goto('/reports')

    const calendar = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'Daily Spending' }),
    })

    await expect(calendar).toBeVisible()
    await expect(page.getByText('Sun', { exact: true })).toBeVisible()
    await expect(page.getByText('Sat', { exact: true })).toBeVisible()
  })

  test('labels a spending day with its amount and count', async ({ page }) => {
    await page.goto('/reports')

    const { first } = calendarFixtureDates()

    await expect(
      page.getByRole('button', {
        name: new RegExp(`^${longDate(first)} — ₱1,200\\.00 across 1 transaction$`),
      }),
    ).toBeVisible()
  })

  test('opens and closes the day detail panel', async ({ page }) => {
    await page.goto('/reports')

    const { first } = calendarFixtureDates()
    const day = page.getByRole('button', {
      name: new RegExp(`^${longDate(first)} — ₱1,200\\.00`),
    })

    await expect(page.getByRole('region', { name: /^Spending on / })).toHaveCount(0)

    await day.click()

    const panel = page.getByRole('region', {
      name: `Spending on ${longDate(first)}`,
    })

    await expect(panel).toBeVisible()
    await expect(day).toHaveAttribute('aria-pressed', 'true')
    await expect(panel.getByText('Monthly Groceries')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.getByRole('region', { name: /^Spending on / })).toHaveCount(0)
  })

  test('changing the month through the picker updates the calendar', async ({
    page,
  }) => {
    await page.goto('/reports')

    const { first } = calendarFixtureDates()
    const currentDay = page.getByRole('button', {
      name: new RegExp(`^${longDate(first)} — ₱1,200\\.00`),
    })

    await expect(currentDay).toBeVisible()

    // `ReportMonthPicker` is the only month control on the page.
    await page.getByRole('button', { name: /Report Period/ }).click()

    const dialog = page.getByRole('dialog', { name: 'Choose report month' })

    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /^January / }).click()

    // The January grid cannot carry a day labelled with the current month.
    await expect(currentDay).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: /^January 1, / }),
    ).toBeVisible()
  })

  test('renders on /dashboard as well', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(
      page.getByRole('heading', { name: 'Daily Spending' }),
    ).toBeVisible()
    // The section it replaced must be gone.
    await expect(
      page.getByRole('heading', { name: 'Recent Activity' }),
    ).toHaveCount(0)
  })

  test('stays within the viewport at 320px', async ({ page }) => {
    // Narrower than any viewport in `responsive.spec.ts`, and the width the
    // seven-column grid is tightest at. `body` declares `min-width: 320px`.
    await page.setViewportSize({ height: 800, width: 320 })
    await page.goto('/reports')

    await expect(
      page.getByRole('heading', { name: 'Daily Spending' }),
    ).toBeVisible()

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )

    expect(hasOverflow).toBe(false)
  })
})
