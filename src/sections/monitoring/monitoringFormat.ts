import type { BudgetPeriod } from '@/types'
import { formatDate as formatSharedDate } from '@/lib/date'

export const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export const compactCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency',
})

export const formatPeriod = (period: BudgetPeriod) =>
  period.charAt(0).toUpperCase() + period.slice(1)

export const formatDate = (value: string | null) =>
  formatSharedDate(value, undefined, 'No target date')

export const getDaysLeftLabel = (daysLeft: number | null) => {
  if (daysLeft === null) {
    return 'Flexible'
  }

  if (daysLeft < 0) {
    return 'Past due'
  }

  if (daysLeft === 0) {
    return 'Due today'
  }

  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
}
