import type { BudgetPeriod } from '@/types'

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

export const formatDate = (value: string | null) => {
  if (!value) {
    return 'No target date'
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

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
