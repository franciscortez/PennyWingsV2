import { appChoice, appChoiceActive, appChoiceIdle } from '@/sections/shared/appDesignStyles'
import {
  Check,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import {
  currentMonthInput,
  formatReportMonth,
} from '@/sections/reports/reportFormat'

type ReportMonthPickerProps = {
  onChange: (month: string) => void
  value: string
}

const months = Array.from({ length: 12 }, (_, monthIndex) => ({
  long: new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, monthIndex, 1))),
  short: new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, monthIndex, 1))),
  value: monthIndex + 1,
}))

const getYear = (month: string) =>
  Number.parseInt(month.slice(0, 4), 10) || new Date().getFullYear()

const toMonthValue = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}`

export function ReportMonthPicker({
  onChange,
  value,
}: ReportMonthPickerProps) {
  const maximumMonth = currentMonthInput()
  const maximumYear = getYear(maximumMonth)
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => getYear(value))
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const togglePicker = () => {
    if (!open) {
      setViewYear(getYear(value))
    }

    setOpen(!open)
  }

  const selectMonth = (month: number) => {
    onChange(toMonthValue(viewYear, month))
    setOpen(false)
    triggerRef.current?.focus()
  }

  const selectCurrentMonth = () => {
    onChange(maximumMonth)
    setViewYear(maximumYear)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={pickerRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        ref={triggerRef}
        onClick={togglePicker}
        className={`${appChoice} group flex min-h-12 w-full items-center gap-3 rounded-full border bg-white px-4 py-3 text-left transition sm:min-w-56 dark:border-slate-800 dark:bg-slate-900 ${
          open
            ? 'border-pink-400 ring-4 ring-pink-500/10'
            : 'border-pink-100 hover:border-pink-300 hover:bg-pink-50/40 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800'
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[1.25rem] bg-pink-100 sm:flex text-pink-800 transition group-hover:bg-pink-700 group-hover:text-white dark:bg-slate-950 dark:text-pink-400 dark:group-hover:bg-pink-800 dark:group-hover:text-white">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block min-w-0 max-w-full [overflow-wrap:anywhere] text-sm font-semibold text-pink-800 dark:text-pink-400">
            Report period
          </span>
          <span className="block min-w-0 max-w-full [overflow-wrap:anywhere] text-sm font-semibold text-slate-800 dark:text-slate-200">
            {formatReportMonth(`${value}-01`)}
          </span>
        </span>
        <ChevronRight
          className={`h-4 w-4 text-pink-800 dark:text-pink-400 transition-transform ${
            open ? 'rotate-90' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Choose report month"
          className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-2rem))] sm:left-auto sm:right-0 max-h-[70dvh] overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white shadow-wing-lg dark:border-slate-850 dark:bg-slate-900 dark:shadow-none"
        >
          <div className="bg-pink-50 px-4 py-4 text-slate-950 dark:bg-slate-800 dark:text-slate-100">
            <div className="relative flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewYear((year) => year - 1)}
                className={`${appChoice} h-11 w-11 shrink-0 p-0 bg-white text-slate-600 hover:bg-pink-100 dark:bg-slate-900 dark:text-slate-300`}
                aria-label="Previous year"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Choose a month
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {viewYear}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewYear((year) => year + 1)}
                disabled={viewYear >= maximumYear}
                className={`${appChoice} h-11 w-11 shrink-0 p-0 bg-white text-slate-600 hover:bg-pink-100 dark:bg-slate-900 dark:text-slate-300 disabled:cursor-not-allowed disabled:opacity-30`}
                aria-label="Next year"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {months.map((month) => {
                const monthValue = toMonthValue(viewYear, month.value)
                const selected = monthValue === value
                const current = monthValue === maximumMonth
                const disabled = monthValue > maximumMonth

                return (
                  <button
                    key={month.value}
                    type="button"
                    onClick={() => selectMonth(month.value)}
                    disabled={disabled}
                    className={`${appChoice} relative min-h-16 flex-col px-2 py-3 text-center ${
                      selected
                        ? appChoiceActive
                        : current
                          ? 'border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 dark:border-pink-900/60 dark:bg-pink-950/40 dark:text-pink-400 dark:hover:bg-pink-900/40'
                          : appChoiceIdle
                    } disabled:cursor-not-allowed disabled:bg-transparent disabled:text-gray-200 dark:disabled:text-slate-700`}
                    aria-label={`${month.long} ${viewYear}`}
                    aria-pressed={selected}
                  >
                    <span className="block text-xs font-semibold ">
                      {month.short}
                    </span>
                    {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                    {current ? (
                      <span
                        className={`mt-1 block text-xs font-semibold ${
                          selected ? 'text-white' : 'text-pink-800 dark:text-pink-400'
                        }`}
                      >
                        Current
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            {value !== maximumMonth ? (
              <button
                type="button"
                onClick={selectCurrentMonth}
                className={`${appChoice} mt-3 flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-pink-50 px-4 py-3 text-xs font-semibold text-pink-800 transition hover:bg-pink-100 dark:bg-slate-800 dark:text-pink-400 dark:hover:bg-slate-750`}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Jump to current month
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}
