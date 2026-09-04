import { AlertTriangle, CalendarDays, CalendarOff, Receipt, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { formatLongDate, formatShortDate, toDateInputValue } from '@/lib/date'
import { useErrorAlert } from '@/hooks/useErrorAlert'
import {
  categoryBarColors,
  compactReportCurrency,
  microReportCurrency,
  reportCurrency,
} from '@/lib/currency'
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
import type { DailySpendingCalendar } from '@/types'

type DailySpendingCalendarSectionProps = {
  calendar: DailySpendingCalendar
  error: string | null
  loading: boolean
  month: string
}

function CalendarStat({
  hint,
  label,
  value,
}: {
  hint?: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-pink-50 bg-pink-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/45">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-black text-gray-900 dark:text-slate-200">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10px] font-bold text-gray-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function CalendarGridSkeleton() {
  return (
    <div
      className="animate-pulse grid grid-cols-7 gap-1.5 sm:gap-2"
      aria-busy="true"
      aria-label="Loading daily spending"
    >
      {Array.from({ length: 42 }, (_, cell) => (
        <div
          key={cell}
          className="min-h-12 rounded-xl bg-pink-50 sm:min-h-16 sm:rounded-2xl dark:bg-slate-950"
        />
      ))}
    </div>
  )
}

function CalendarNotice({
  description,
  icon: Icon,
  title,
}: {
  description: string
  icon: typeof CalendarDays
  title: string
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-pink-200 dark:bg-slate-950 dark:text-slate-800">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="font-bold text-gray-700 dark:text-slate-300">{title}</p>
      <p className="mt-1 max-w-xs text-sm font-medium text-gray-400 dark:text-slate-500">
        {description}
      </p>
    </div>
  )
}

// Holds the panel column open while no day is selected, so tapping a day never
// reflows the grid, and says what the column is for.
function DayDetailPlaceholder() {
  return (
    <div className="hidden rounded-3xl border border-dashed border-pink-100 p-5 xl:flex xl:col-span-2 xl:flex-col xl:items-center xl:justify-center xl:text-center dark:border-slate-800">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-300 dark:bg-slate-950 dark:text-slate-700">
        <CalendarDays className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-bold text-gray-500 dark:text-slate-400">
        Select a day
      </p>
      <p className="mt-1 max-w-[16rem] text-xs font-medium text-gray-400 dark:text-slate-500">
        Its categories and transactions appear here.
      </p>
    </div>
  )
}

function DayDetailPanel({
  day,
  onClose,
}: {
  day: CalendarCell
  onClose: () => void
}) {
  const panelRef = useRef<HTMLElement>(null)
  const headline = formatLongDate(day.date)
  const categories = getCategorySplit(day.transactions)
  // Scaled to the biggest category, matching `CategoryAllocationSection`, so
  // the two charts on this page read the same way. The seed keeps a day whose
  // rows all total zero from dividing by zero.
  const maximum = Math.max(...categories.map((category) => category.total), 1)

  // Selecting a day moves focus into the panel so the region is announced and
  // the close control is the next stop for keyboard users.
  useEffect(() => {
    panelRef.current?.focus()
  }, [day.date])

  // Same Escape handling `ReportMonthPicker` uses for its month dialog.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label={`Spending on ${headline}`}
      className="rounded-3xl border border-pink-50 bg-pink-50/40 p-5 xl:col-span-2 dark:border-slate-800 dark:bg-slate-950/40"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Day detail
          </p>
          <h3 className="mt-1 truncate text-lg font-black tracking-tight text-gray-950 dark:text-white">
            {headline}
          </h3>
          <p className="mt-1 text-2xl font-black tracking-tight text-pink-600 dark:text-pink-400">
            {reportCurrency.format(day.total)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close day details"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-400 transition hover:bg-pink-100 hover:text-pink-600 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-pink-400"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {day.transactions.length ? (
        <>
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={category.name}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-bold text-gray-700 dark:text-slate-300">
                    {category.name}
                  </span>
                  <span className="shrink-0 text-sm font-black text-gray-950 dark:text-slate-100">
                    {compactReportCurrency.format(category.total)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white dark:bg-slate-950">
                  <div
                    className={`h-full rounded-full ${categoryBarColors[index % categoryBarColors.length]}`}
                    style={{ width: `${(category.total / maximum) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <ul className="mt-6 space-y-2">
            {day.transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5 dark:bg-slate-900"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-gray-800 dark:text-slate-200">
                    {transaction.description ||
                      transaction.categoryName ||
                      'Transaction'}
                  </span>
                  <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    {[transaction.categoryName, transaction.accountName]
                      .filter(Boolean)
                      .join(' · ') || 'No category'}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-black text-gray-950 dark:text-slate-100">
                  {reportCurrency.format(transaction.amount)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex min-h-40 flex-col items-center justify-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-pink-200 dark:bg-slate-900 dark:text-slate-700">
            <Receipt className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="font-bold text-gray-700 dark:text-slate-300">
            No spending on this day
          </p>
          <p className="mt-1 max-w-xs text-sm font-medium text-gray-400 dark:text-slate-500">
            Nothing left your accounts on {headline}.
          </p>
        </div>
      )}
    </section>
  )
}

export function DailySpendingCalendarSection({
  calendar,
  error,
  loading,
  month,
}: DailySpendingCalendarSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = toDateInputValue()
  const cells = buildCells(month, calendar)
  const stats = getStats(cells, today)
  // The calendar owns this query, so it owns the alert. `Reports.tsx` must not
  // pass the same error to `useErrorAlert` again or it would fire twice.
  useErrorAlert(error)
  // Derived rather than reset in an effect: a day from March has no meaning
  // once the picker moves to April, so it is simply not active any more.
  const activeSelection =
    selectedDate?.startsWith(`${month.slice(0, 7)}-`) === true
      ? selectedDate
      : null
  // The grid and panel column spans are fixed rather than conditional. Letting
  // the grid widen while nothing was selected meant every cell resized the
  // moment a day was tapped.
  const selectedDay =
    cells.find((cell) => cell?.date === activeSelection) ?? null

  // Stable identity, so the panel's Escape listener is registered once rather
  // than torn down and rebuilt on every parent render.
  const closeDay = useCallback(() => {
    setSelectedDate(null)
  }, [])

  const toggleDay = (date: string) => {
    setSelectedDate(activeSelection === date ? null : date)
  }

  return (
    <article className="rounded-[2.5rem] border border-pink-50 bg-white p-4 sm:p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 dark:bg-slate-800 dark:text-pink-400">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-950 dark:text-white">
            Daily Spending
          </h2>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {compactReportCurrency.format(calendar.totalSpent)} this month
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <CalendarStat
          label="Highest day"
          value={
            stats.highest && stats.highest.total > 0
              ? compactReportCurrency.format(stats.highest.total)
              : 'N/A'
          }
          hint={
            stats.highest && stats.highest.total > 0
              ? formatShortDate(stats.highest.date)
              : undefined
          }
        />
        <CalendarStat
          label="Average daily"
          value={
            stats.spent > 0
              ? compactReportCurrency.format(stats.averageDaily)
              : 'N/A'
          }
          hint={
            stats.spent > 0 ? `Across ${stats.elapsedDays} days` : undefined
          }
        />
        <CalendarStat
          label="No-spend days"
          value={
            stats.elapsedDays > 0 ? String(stats.noSpendDays) : 'N/A'
          }
          hint={
            stats.elapsedDays > 0
              ? `Of ${stats.elapsedDays} so far`
              : undefined
          }
        />
      </div>

      {loading ? (
        <CalendarGridSkeleton />
      ) : error ? (
        <CalendarNotice
          icon={AlertTriangle}
          title="Daily spending is unavailable"
          description="The rest of this report is still accurate. Reload to try the calendar again."
        />
      ) : calendar.totalSpent <= 0 ? (
        <CalendarNotice
          icon={CalendarOff}
          title="No spending this month"
          description="Every day is clear. Expenses will fill the calendar as you record them."
        />
      ) : (
        <div className="grid gap-7 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekdays.map((weekday) => (
                <span
                  key={weekday}
                  className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400"
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
                    <span className="text-xs font-bold leading-none">
                      {cell.day}
                    </span>
                    {cell.total > 0 ? (
                      <>
                        {/* Compact notation below `sm`, where a cell is about
                            36px wide and the full amount does not fit. */}
                        <span className="w-full truncate text-[10px] font-bold leading-none sm:hidden">
                          {microReportCurrency.format(cell.total)}
                        </span>
                        <span className="hidden w-full truncate text-[10px] font-bold leading-none sm:block">
                          {compactReportCurrency.format(cell.total)}
                        </span>
                      </>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Less
              </span>
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className={`h-3 w-3 rounded-sm ${quietStep}`} />
                {intensitySteps.map((step) => (
                  <span key={step} className={`h-3 w-3 rounded-sm ${step}`} />
                ))}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                More
              </span>
            </div>
          </div>

          {selectedDay ? (
            <DayDetailPanel day={selectedDay} onClose={closeDay} />
          ) : (
            <DayDetailPlaceholder />
          )}
        </div>
      )}
    </article>
  )
}
