import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DailySpendingCalendarSection } from '@/sections/shared'
import type { DailySpendingCalendar, DailySpendingTransaction } from '@/types'

vi.mock('@/lib/alert', () => ({
  alerts: { error: vi.fn(), success: vi.fn() },
}))

const transaction = (
  id: string,
  amount: number,
  categoryName: string | null = 'Groceries',
): DailySpendingTransaction => ({
  accountName: 'BDO Debit',
  amount,
  categoryColor: '#ef4444',
  categoryName,
  description: `Item ${id}`,
  id,
})

// March 2026 starts on a Sunday, so the grid needs no leading blanks and the
// day number lines up with the cell index.
const march = (
  days: DailySpendingCalendar['days'] = [],
): DailySpendingCalendar => ({
  days,
  maxDailyTotal: days.reduce((max, day) => Math.max(max, day.total), 0),
  month: '2026-03-01',
  totalSpent: days.reduce((total, day) => total + day.total, 0),
})

const populatedMarch = march([
  {
    date: '2026-03-14',
    total: 1240,
    transactionCount: 3,
    transactions: [
      transaction('a', 640),
      transaction('b', 400, 'Transport'),
      transaction('c', 200),
    ],
  },
  {
    date: '2026-03-02',
    total: 300,
    transactionCount: 1,
    transactions: [transaction('d', 300)],
  },
])

const renderSection = (
  overrides: Partial<Parameters<typeof DailySpendingCalendarSection>[0]> = {},
) =>
  render(
    <DailySpendingCalendarSection
      calendar={populatedMarch}
      error={null}
      loading={false}
      month="2026-03"
      {...overrides}
    />,
  )

describe('DailySpendingCalendarSection', () => {
  it('labels a spending day with its amount and transaction count', () => {
    renderSection()

    expect(
      screen.getByRole('button', {
        name: 'March 14, 2026 — ₱1,240.00 across 3 transactions',
      }),
    ).toBeInTheDocument()
  })

  it('uses the singular for a day with one transaction', () => {
    renderSection()

    expect(
      screen.getByRole('button', {
        name: 'March 2, 2026 — ₱300.00 across 1 transaction',
      }),
    ).toBeInTheDocument()
  })

  it('labels a zero-spend day rather than leaving it unnamed', () => {
    renderSection()

    expect(
      screen.getByRole('button', { name: 'March 3, 2026 — no spending' }),
    ).toBeInTheDocument()
  })

  it('renders every day of the month as a button', () => {
    renderSection()

    // Disabled buttons are still buttons, so this count is independent of
    // today's date; the future-day test below pins that behaviour separately.
    expect(screen.getAllByRole('button', { name: /2026 —/ })).toHaveLength(31)
  })

  it('opens the detail panel for the selected day', () => {
    renderSection()

    const day = screen.getByRole('button', {
      name: 'March 14, 2026 — ₱1,240.00 across 3 transactions',
    })

    expect(screen.queryByRole('region')).not.toBeInTheDocument()

    fireEvent.click(day)

    const panel = screen.getByRole('region', {
      name: 'Spending on March 14, 2026',
    })

    expect(panel).toBeInTheDocument()
    expect(day).toHaveAttribute('aria-pressed', 'true')
    // The day's own categories, folded and sorted.
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
  })

  it('closes the panel again when the same day is clicked', () => {
    renderSection()

    const day = screen.getByRole('button', {
      name: 'March 14, 2026 — ₱1,240.00 across 3 transactions',
    })

    fireEvent.click(day)
    fireEvent.click(day)

    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    expect(day).toHaveAttribute('aria-pressed', 'false')
  })

  it('closes the panel on Escape', () => {
    renderSection()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'March 14, 2026 — ₱1,240.00 across 3 transactions',
      }),
    )
    expect(screen.getByRole('region')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('disables days that have not happened yet', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 10, 12))

    renderSection()

    expect(
      screen.getByRole('button', { name: 'March 10, 2026 — no spending' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'March 11, 2026 — no spending' }),
    ).toBeDisabled()

    vi.useRealTimers()
  })

  it('renders the skeleton instead of the grid while loading', () => {
    renderSection({ loading: true })

    expect(screen.getByLabelText('Loading daily spending')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /2026 —/ })).not.toBeInTheDocument()
  })

  it('renders an empty notice rather than a grid of zeros', () => {
    renderSection({ calendar: march() })

    expect(screen.getByText('No spending this month')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /2026 —/ })).not.toBeInTheDocument()
  })

  it('keeps the card usable when the query failed', () => {
    renderSection({ error: 'Unable to load daily spending.' })

    expect(screen.getByText('Daily Spending')).toBeInTheDocument()
    expect(
      screen.getByText('Daily spending is unavailable'),
    ).toBeInTheDocument()
  })

  it('reports the month stats, and N/A where there is nothing to report', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 31, 12))

    const { unmount } = renderSection()

    expect(screen.getByText('Highest day')).toBeInTheDocument()
    // 1240 + 300 over 31 elapsed days.
    expect(screen.getByText('Across 31 days')).toBeInTheDocument()
    // Scoped to the stat box: "29" also appears as a day number in the grid.
    expect(screen.getByText('No-spend days').parentElement).toHaveTextContent(
      'Of 31 so far',
    )
    expect(screen.getByText('No-spend days').parentElement).toHaveTextContent('29')

    unmount()
    renderSection({ calendar: march() })

    expect(screen.getAllByText('N/A')).toHaveLength(2)

    vi.useRealTimers()
  })
})
