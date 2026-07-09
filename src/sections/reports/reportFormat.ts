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
