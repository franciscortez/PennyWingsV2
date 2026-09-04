import { CalendarDays } from 'lucide-react'
import { useState } from 'react'

import { formatLongDate, toDateInputValue } from '@/lib/date'
import {
  compactReportCurrency,
  reportCurrency,
} from '@/sections/reports/reportFormat'
import type { DailySpendingCalendar } from '@/types'

type DailySpendingCalendarSectionProps = {
  calendar: DailySpendingCalendar
  month: string
}

type CalendarCell = {
  date: string
  day: number
  total: number
  transactionCount: number
}

const pad = (value: number) => String(value).padStart(2, '0')

// 2024-01-07 was a Sunday, so this walks Sunday through Saturday without
// hardcoding names the locale may spell differently.
const weekdays = Array.from({ length: 7 }, (_, dayIndex) =>
  new Intl.DateTimeFormat('en-PH', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(new Date(Date.UTC(2024, 0, 7 + dayIndex))),
)

// The quiet cell and the five brand steps. A zero-spend day never borrows a
// pink step, so intensity always means money left the account.
const quietStep =
  'bg-gray-50 text-gray-400 dark:bg-slate-800/60 dark:text-slate-500'

const intensitySteps = [
  'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-200',
  'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-200',
  'bg-pink-300 text-pink-900 dark:bg-pink-900/60 dark:text-pink-100',
  'bg-pink-500 text-white dark:bg-pink-800',
  'bg-pink-700 text-white',
]

// Built from `YYYY-MM-DD` strings in UTC, matching `fetchDailySpending`. Using
// a local-time `Date` here would shift the first-of-month weekday for users
// east of UTC (Asia/Manila) and rotate the whole grid by a day.
const buildCells = (month: string, calendar: DailySpendingCalendar) => {
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
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

const getIntensity = (total: number, maxDailyTotal: number) => {
  if (total <= 0 || maxDailyTotal <= 0) {
    return quietStep
  }

  // Scaled against the month's own peak, so a month with one transaction
  // paints a single dark cell rather than a full grid of them.
  const step = Math.ceil((total / maxDailyTotal) * intensitySteps.length)

  return intensitySteps[Math.min(step, intensitySteps.length) - 1]
}

const getCellLabel = (cell: CalendarCell) => {
  const date = formatLongDate(cell.date)

  if (cell.total <= 0) {
    return `${date} — no spending`
  }

  const transactions =
    cell.transactionCount === 1 ? '1 transaction' : `${cell.transactionCount} transactions`

  return `${date} — ${reportCurrency.format(cell.total)} across ${transactions}`
}

export function DailySpendingCalendarSection({
  calendar,
  month,
}: DailySpendingCalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = toDateInputValue()
  const cells = buildCells(month, calendar)
  // Derived rather than reset in an effect: a day from March has no meaning
  // once the picker moves to April, so it is simply not active any more.
  const activeSelection =
    selectedDate?.startsWith(`${month.slice(0, 7)}-`) === true
      ? selectedDate
      : null

  const toggleDay = (date: string) => {
    setSelectedDate(activeSelection === date ? null : date)
  }

  return (
    <article className="rounded-[2.5rem] border border-pink-50 bg-white p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 dark:bg-slate-800 dark:text-pink-400">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-950 dark:text-white">
            Daily Spending
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
            {compactReportCurrency.format(calendar.totalSpent)} this month
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekdays.map((weekday) => (
          <span
            key={weekday}
            className="pb-1 text-center text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500"
          >
            {weekday}
          </span>
        ))}

        {cells.map((cell, index) => {
          if (!cell) {
            return <span key={`blank-${index}`} aria-hidden="true" />
          }

          const selected = cell.date === activeSelection
          const isToday = cell.date === today

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => toggleDay(cell.date)}
              disabled={cell.date > today}
              className={`flex min-h-12 flex-col items-start justify-between rounded-xl p-1.5 text-left transition sm:min-h-16 sm:rounded-2xl sm:p-2 ${getIntensity(
                cell.total,
                calendar.maxDailyTotal,
              )} ${
                selected
                  ? 'ring-2 ring-gray-900 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-slate-900'
                  : isToday
                    ? 'ring-2 ring-pink-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                    : ''
              } disabled:cursor-not-allowed disabled:bg-transparent disabled:text-gray-200 disabled:ring-0 dark:disabled:text-slate-700`}
              aria-label={getCellLabel(cell)}
              aria-pressed={selected}
            >
              <span className="text-[11px] font-black leading-none sm:text-xs">
                {cell.day}
              </span>
              {cell.total > 0 ? (
                // Hidden below `sm` because a peso amount cannot fit a 320px
                // seven-column grid; the `aria-label` still carries it.
                <span className="hidden w-full truncate text-[10px] font-bold leading-none sm:block">
                  {compactReportCurrency.format(cell.total)}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
          Less
        </span>
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className={`h-3 w-3 rounded-sm ${quietStep}`} />
          {intensitySteps.map((step) => (
            <span key={step} className={`h-3 w-3 rounded-sm ${step}`} />
          ))}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
          More
        </span>
      </div>
    </article>
  )
}
