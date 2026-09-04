import { expect, test, type Page } from '@playwright/test'

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

// `AuthContext` holds a 900ms minimum loader before it even starts resolving
// the session, and the dashboard's queries land after that. On a CI runner the
// whole sequence exceeds Playwright's 5s default `expect` timeout, so every
// test waits for the section once, generously, before asserting anything else.
const READY_TIMEOUT = 30_000

const openCalendarPage = async (page: Page, path: string) => {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Daily Spending' })).toBeVisible({
    timeout: READY_TIMEOUT,
  })
}

test.describe('Daily spending calendar', () => {
  // The default 30s test budget is the same as `READY_TIMEOUT`, which would let
  // the test expire before the readiness wait could even finish. This spec gets
  // its own budget rather than changing every other spec's.
  test.describe.configure({ timeout: 60_000 })

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('renders on /dashboard with the month grid', async ({ page }) => {
    await openCalendarPage(page, '/dashboard')

    const calendar = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'Daily Spending' }),
    })

    await expect(calendar).toBeVisible()
    await expect(page.getByText('Sun', { exact: true })).toBeVisible()
    await expect(page.getByText('Sat', { exact: true })).toBeVisible()
  })

  test('labels a spending day with its amount and count', async ({ page }) => {
    await openCalendarPage(page, '/dashboard')

    const { first } = calendarFixtureDates()

    await expect(
      page.getByRole('button', {
        name: new RegExp(`^${longDate(first)} — ₱1,200\\.00 across 1 transaction$`),
      }),
    ).toBeVisible()
  })

  test('opens and closes the day detail panel', async ({ page }) => {
    await openCalendarPage(page, '/dashboard')

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

  test('renders one cell per real day of the current month', async ({ page }) => {
    await openCalendarPage(page, '/dashboard')

    // Counted here rather than hardcoded, so the assertion follows the calendar
    // instead of drifting out of date with it.
    const now = new Date()
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1)
    let daysInMonth = 0

    while (cursor.getMonth() === now.getMonth()) {
      daysInMonth += 1
      cursor.setDate(cursor.getDate() + 1)
    }

    await expect(page.getByRole('button', { name: /, \d{4} — / })).toHaveCount(
      daysInMonth,
    )
  })

  test('replaced the recent activity list', async ({ page }) => {
    await openCalendarPage(page, '/dashboard')

    await expect(
      page.getByRole('heading', { name: 'Recent Activity' }),
    ).toHaveCount(0)
  })

  test('is no longer rendered on /reports', async ({ page }) => {
    await page.goto('/reports')

    await expect(
      page.getByRole('heading', { name: 'Financial Insights' }),
    ).toBeVisible({ timeout: READY_TIMEOUT })
    await expect(
      page.getByRole('heading', { name: 'Daily Spending' }),
    ).toHaveCount(0)
  })

  test('stays within the viewport at 320px', async ({ page }) => {
    // Narrower than any viewport in `responsive.spec.ts`, and the width the
    // seven-column grid is tightest at. `body` declares `min-width: 320px`.
    await page.setViewportSize({ height: 800, width: 320 })
    await openCalendarPage(page, '/dashboard')

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )

    expect(hasOverflow).toBe(false)
  })
})
