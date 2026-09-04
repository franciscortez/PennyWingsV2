import { formatLongDate } from '@/lib/date'
import { reportCurrency } from '@/lib/currency'
import type { DailySpendingCalendar, DailySpendingTransaction } from '@/types'

// Pure grid, intensity and summary maths, kept beside the component rather
// than inside it: a file that exports a component cannot also export plain
// functions without tripping `react-refresh/only-export-components`, and these
// need to be unit-testable on their own.

export type CalendarCell = {
  date: string
  day: number
  total: number
  transactionCount: number
  transactions: DailySpendingTransaction[]
}

const pad = (value: number) => String(value).padStart(2, '0')

// 2024-01-07 was a Sunday, so this walks Sunday through Saturday without
// hardcoding names the locale may spell differently.
export const weekdays = Array.from({ length: 7 }, (_, dayIndex) =>
  new Intl.DateTimeFormat('en-PH', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(new Date(Date.UTC(2024, 0, 7 + dayIndex))),
)

// The quiet cell and the five heat steps. A zero-spend day never borrows a
// heat step, so intensity always means money left the account. Every pairing
// below is AA-verified; see the ramp comment in `src/index.css`.
export const quietStep =
  'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'

export const intensitySteps = [
  'bg-heat-1 text-pink-900 dark:bg-heat-dark-1 dark:text-pink-200',
  'bg-heat-2 text-pink-900 dark:bg-heat-dark-2 dark:text-pink-200',
  'bg-heat-3 text-slate-950 dark:bg-heat-dark-3 dark:text-white',
  'bg-heat-4 text-white dark:bg-heat-dark-4',
  'bg-heat-5 text-white dark:bg-heat-dark-5 dark:text-slate-950',
]

// Built from `YYYY-MM-DD` strings in UTC, matching `fetchDailySpending`. Using
// a local-time `Date` here would shift the first-of-month weekday for users
// east of UTC (Asia/Manila) and rotate the whole grid by a day.
export const buildCells = (month: string, calendar: DailySpendingCalendar) => {
  const monthKey = month.slice(0, 7)
  const year = Number(monthKey.slice(0, 4))
  const monthNumber = Number(monthKey.slice(5, 7))
  const leadingBlanks = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay()
  // Day 0 of the next month is the last day of this one, so this covers 28,
  // 29, 30 and 31 day months without a lookup table.
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const totalsByDate = new Map(calendar.days.map((day) => [day.date, day]))

  const cells: (CalendarCell | null)[] = Array.from(
    { length: leadingBlanks },
    () => null,
  )

  for (let day = 1; day <= dayCount; day += 1) {
    const date = `${monthKey}-${pad(day)}`
    const spending = totalsByDate.get(date)

    cells.push({
      date,
      day,
      total: spending?.total ?? 0,
      transactionCount: spending?.transactionCount ?? 0,
      transactions: spending?.transactions ?? [],
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export const getIntensity = (total: number, maxDailyTotal: number) => {
  if (total <= 0 || maxDailyTotal <= 0) {
    return quietStep
  }

  // Scaled against the month's own peak, so a month with one transaction
  // paints a single dark cell rather than a full grid of them.
  const step = Math.ceil((total / maxDailyTotal) * intensitySteps.length)

  return intensitySteps[Math.min(step, intensitySteps.length) - 1]
}

export const getCellLabel = (cell: CalendarCell) => {
  const date = formatLongDate(cell.date)

  if (cell.total <= 0) {
    return `${date} — no spending`
  }

  const transactions =
    cell.transactionCount === 1
      ? '1 transaction'
      : `${cell.transactionCount} transactions`

  return `${date} — ${reportCurrency.format(cell.total)} across ${transactions}`
}

export const getCategorySplit = (transactions: DailySpendingTransaction[]) => {
  const totals = new Map<string, number>()

  for (const transaction of transactions) {
    const name = transaction.categoryName ?? 'Uncategorized'

    totals.set(name, (totals.get(name) ?? 0) + transaction.amount)
  }

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((first, second) => second.total - first.total)
}

// Only elapsed days count. A future day in the current month has not had the
// chance to be a no-spend day, and including it would drag the average down.
export const getStats = (cells: (CalendarCell | null)[], today: string) => {
  const elapsed = cells.filter(
    (cell): cell is CalendarCell => cell !== null && cell.date <= today,
  )
  const spent = elapsed.reduce((total, day) => total + day.total, 0)
  const highest = elapsed.reduce<CalendarCell | null>(
    (best, day) => (day.total > (best?.total ?? 0) ? day : best),
    null,
  )

  return {
    // Guarded: a month whose days are all in the future divides by zero.
    averageDaily: elapsed.length > 0 ? spent / elapsed.length : 0,
    elapsedDays: elapsed.length,
    highest,
    noSpendDays: elapsed.filter((day) => day.total <= 0).length,
    spent,
  }
}

