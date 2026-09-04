import { describe, expect, it } from 'vitest'

import { currentMonthInput } from '@/lib/date'

import {
  buildCells,
  getCategorySplit,
  getCellLabel,
  getIntensity,
  getStats,
  intensitySteps,
  quietStep,
  weekdays,
} from '@/sections/shared/dailySpendingCalendar'
import type { CalendarCell } from '@/sections/shared/dailySpendingCalendar'
import type { DailySpendingCalendar, DailySpending } from '@/types'

const day = (
  date: string,
  total: number,
  transactionCount = 1,
): DailySpending => ({
  date,
  total,
  transactionCount,
  transactions: [],
})

const calendar = (
  days: DailySpending[],
  month = '2026-03-01',
): DailySpendingCalendar => ({
  days,
  maxDailyTotal: days.reduce((max, entry) => Math.max(max, entry.total), 0),
  month,
  totalSpent: days.reduce((total, entry) => total + entry.total, 0),
})

const realCells = (cells: (CalendarCell | null)[]) =>
  cells.filter((cell): cell is CalendarCell => cell !== null)

describe('buildCells', () => {
  it('starts a Sunday month with no leading blanks and fills whole weeks', () => {
    // 2026-02-01 is a Sunday and February 2026 has 28 days, so the month is
    // exactly four rows with no padding at either end.
    const cells = buildCells('2026-02', calendar([], '2026-02-01'))

    expect(cells).toHaveLength(28)
    expect(cells[0]).toMatchObject({ date: '2026-02-01', day: 1 })
    expect(cells.at(-1)).toMatchObject({ date: '2026-02-28', day: 28 })
  })

  it('pads a month that starts on a Saturday out to six rows', () => {
    // 2026-08-01 is a Saturday: six leading blanks plus 31 days needs 42 cells.
    const cells = buildCells('2026-08', calendar([], '2026-08-01'))

    expect(cells).toHaveLength(42)
    expect(cells.slice(0, 6).every((cell) => cell === null)).toBe(true)
    expect(cells[6]).toMatchObject({ date: '2026-08-01', day: 1 })
    expect(realCells(cells)).toHaveLength(31)
  })

  it('gives leap February 29 days', () => {
    expect(realCells(buildCells('2024-02', calendar([], '2024-02-01')))).toHaveLength(29)
  })

  it('gives non-leap February 28 days', () => {
    expect(realCells(buildCells('2026-02', calendar([], '2026-02-01')))).toHaveLength(28)
  })

  it('handles 30 and 31 day months', () => {
    expect(realCells(buildCells('2026-04', calendar([], '2026-04-01')))).toHaveLength(30)
    expect(realCells(buildCells('2026-01', calendar([], '2026-01-01')))).toHaveLength(31)
  })

  it('always emits whole weeks', () => {
    for (const month of ['2026-01', '2026-02', '2026-08', '2027-05', '2024-02']) {
      expect(buildCells(month, calendar([])).length % 7).toBe(0)
    }
  })

  // The bug most likely to ship. `transaction_date` is a date-only column, so
  // any parse into a local `Date` shifts the day for users east of UTC. These
  // assertions hold in every timezone because the grid is built from the raw
  // `YYYY-MM-DD` string with `Date.UTC`; verified against Asia/Manila (UTC+8),
  // Pacific/Kiritimati (UTC+14), America/Los_Angeles and UTC.
  it('keeps the first and last day of the month on their own cells', () => {
    const cells = buildCells(
      '2026-03',
      calendar([day('2026-03-01', 100), day('2026-03-31', 250)]),
    )
    const first = realCells(cells).find((cell) => cell.day === 1)
    const last = realCells(cells).find((cell) => cell.day === 31)

    expect(first).toMatchObject({ date: '2026-03-01', total: 100 })
    expect(last).toMatchObject({ date: '2026-03-31', total: 250 })
  })

  it('does not shift the first-of-month weekday offset', () => {
    // 2026-03-01 is a Sunday, so there must be zero leading blanks regardless
    // of the machine's timezone.
    expect(buildCells('2026-03', calendar([]))[0]).toMatchObject({ day: 1 })
    // 2026-11-01 is a Sunday too; 2026-12-01 is a Tuesday, so two blanks.
    expect(buildCells('2026-12', calendar([], '2026-12-01')).slice(0, 2)).toEqual([
      null,
      null,
    ])
  })

  it('leaves days without spending at zero rather than undefined', () => {
    const cells = realCells(buildCells('2026-03', calendar([day('2026-03-02', 50)])))

    expect(cells[0]).toMatchObject({ total: 0, transactionCount: 0, transactions: [] })
    expect(cells[1]).toMatchObject({ total: 50, transactionCount: 1 })
  })
})

// The fixtures above pin specific month shapes, but none of them is the month
// the app actually renders. Without this, a regression in the month arithmetic
// would pass CI on every day of the year except the ones where it bites.
describe('the current month', () => {
  // Counts by walking a Date forward rather than reusing
  // `Date.UTC(year, month, 0)`, so this cannot agree with `buildCells` by
  // sharing the same mistake.
  const countDaysIndependently = (month: string) => {
    const year = Number(month.slice(0, 4))
    const monthIndex = Number(month.slice(5, 7)) - 1
    const cursor = new Date(year, monthIndex, 1)
    let days = 0

    while (cursor.getMonth() === monthIndex) {
      days += 1
      cursor.setDate(cursor.getDate() + 1)
    }

    return days
  }

  it('renders one cell per real day of the month', () => {
    const month = currentMonthInput()
    const days = realCells(buildCells(month, calendar([], `${month}-01`)))

    expect(days).toHaveLength(countDaysIndependently(month))
  })

  it('numbers the last cell with the month length', () => {
    const month = currentMonthInput()
    const days = realCells(buildCells(month, calendar([], `${month}-01`)))

    expect(days.at(-1)?.day).toBe(countDaysIndependently(month))
    expect(days.at(-1)?.date).toBe(
      `${month}-${String(countDaysIndependently(month)).padStart(2, '0')}`,
    )
  })

  it('still fills whole weeks', () => {
    const month = currentMonthInput()

    expect(buildCells(month, calendar([], `${month}-01`)).length % 7).toBe(0)
  })

  it('agrees with the independent count across a full year either side', () => {
    const now = new Date()

    for (let offset = -12; offset <= 12; offset += 1) {
      const cursor = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`

      expect(realCells(buildCells(month, calendar([], `${month}-01`)))).toHaveLength(
        countDaysIndependently(month),
      )
    }
  })
})

describe('weekdays', () => {
  it('runs Sunday through Saturday', () => {
    expect(weekdays).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  })
})

describe('getIntensity', () => {
  it('returns the quiet step for a zero-spend day', () => {
    expect(getIntensity(0, 1000)).toBe(quietStep)
  })

  it('returns the quiet step when the month has no spending at all', () => {
    // Guards the divide-by-zero that would otherwise produce NaN and index -1.
    expect(getIntensity(0, 0)).toBe(quietStep)
    expect(getIntensity(500, 0)).toBe(quietStep)
  })

  it('paints a single-transaction month as one top step, not a full grid', () => {
    expect(getIntensity(750, 750)).toBe(intensitySteps[4])
    expect(getIntensity(0, 750)).toBe(quietStep)
  })

  it('spreads ratios across all five steps', () => {
    expect(getIntensity(100, 1000)).toBe(intensitySteps[0])
    expect(getIntensity(300, 1000)).toBe(intensitySteps[1])
    expect(getIntensity(500, 1000)).toBe(intensitySteps[2])
    expect(getIntensity(700, 1000)).toBe(intensitySteps[3])
    expect(getIntensity(900, 1000)).toBe(intensitySteps[4])
  })

  it('puts each fifth boundary in the lower step', () => {
    expect(getIntensity(200, 1000)).toBe(intensitySteps[0])
    expect(getIntensity(400, 1000)).toBe(intensitySteps[1])
    expect(getIntensity(1000, 1000)).toBe(intensitySteps[4])
  })

  it('never indexes past the ramp', () => {
    expect(getIntensity(2000, 1000)).toBe(intensitySteps[4])
  })
})

describe('getStats', () => {
  const cellsFor = (days: DailySpending[], month = '2026-03') =>
    buildCells(month, calendar(days, `${month}-01`))

  it('reports zeros for a month with no spending', () => {
    const stats = getStats(cellsFor([]), '2026-03-31')

    expect(stats).toMatchObject({ averageDaily: 0, highest: null, spent: 0 })
    expect(stats.elapsedDays).toBe(31)
    expect(stats.noSpendDays).toBe(31)
  })

  it('does not divide by zero when every day is still in the future', () => {
    const stats = getStats(cellsFor([]), '2026-02-28')

    expect(stats.elapsedDays).toBe(0)
    expect(stats.averageDaily).toBe(0)
    expect(Number.isNaN(stats.averageDaily)).toBe(false)
    expect(Number.isFinite(stats.averageDaily)).toBe(true)
  })

  it('counts only elapsed days, so future days are not no-spend days', () => {
    const stats = getStats(cellsFor([day('2026-03-01', 300)]), '2026-03-10')

    expect(stats.elapsedDays).toBe(10)
    expect(stats.noSpendDays).toBe(9)
    expect(stats.spent).toBe(300)
    expect(stats.averageDaily).toBe(30)
  })

  it('picks the highest spending day', () => {
    const stats = getStats(
      cellsFor([day('2026-03-02', 120), day('2026-03-09', 980), day('2026-03-20', 400)]),
      '2026-03-31',
    )

    expect(stats.highest).toMatchObject({ date: '2026-03-09', total: 980 })
  })

  it('ignores spending recorded after today when averaging', () => {
    const stats = getStats(
      cellsFor([day('2026-03-01', 100), day('2026-03-25', 900)]),
      '2026-03-05',
    )

    expect(stats.spent).toBe(100)
    expect(stats.averageDaily).toBe(20)
  })
})

describe('getCellLabel', () => {
  const cell = (total: number, transactionCount: number): CalendarCell => ({
    date: '2026-03-14',
    day: 14,
    total,
    transactionCount,
    transactions: [],
  })

  it('labels a zero-spend day as such', () => {
    expect(getCellLabel(cell(0, 0))).toBe('March 14, 2026 — no spending')
  })

  it('uses the singular for one transaction', () => {
    expect(getCellLabel(cell(1240, 1))).toBe(
      'March 14, 2026 — ₱1,240.00 across 1 transaction',
    )
  })

  it('uses the plural and the full amount for several', () => {
    expect(getCellLabel(cell(1240, 3))).toBe(
      'March 14, 2026 — ₱1,240.00 across 3 transactions',
    )
  })
})

describe('getCategorySplit', () => {
  const transaction = (categoryName: string | null, amount: number) => ({
    accountName: null,
    amount,
    categoryColor: null,
    categoryName,
    description: null,
    id: `${categoryName}-${amount}`,
  })

  it('folds a day into descending category totals', () => {
    expect(
      getCategorySplit([
        transaction('Food', 100),
        transaction('Transport', 300),
        transaction('Food', 50),
      ]),
    ).toEqual([
      { name: 'Transport', total: 300 },
      { name: 'Food', total: 150 },
    ])
  })

  it('names an absent category rather than dropping the row', () => {
    expect(getCategorySplit([transaction(null, 75)])).toEqual([
      { name: 'Uncategorized', total: 75 },
    ])
  })

  it('returns nothing for a day with no transactions', () => {
    expect(getCategorySplit([])).toEqual([])
  })
})
