import { formatDateTime } from '@/lib/date'

export {
  currentMonthInput,
  formatReportMonth,
  toReportMonth,
} from '@/lib/date'

export const reportCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export const compactReportCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency',
})

export const formatGeneratedAt = (value: string) =>
  formatDateTime(value)

// Shared by the category allocation bars and the calendar's day detail split,
// so a category keeps the same colour wherever it is charted on `/reports`.
export const categoryBarColors = [
  'bg-pink-500',
  'bg-rose-400',
  'bg-amber-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-sky-400',
]
