import { formatDateTime } from '@/lib/date'

export {
  currentMonthInput,
  formatReportMonth,
  toReportMonth,
} from '@/lib/date'

// Re-exported so every existing `@/sections/reports/reportFormat` import keeps
// working; the definitions moved to `@/lib/currency` when the calendar became
// a shared section.
export {
  categoryBarColors,
  compactReportCurrency,
  microReportCurrency,
  reportCurrency,
} from '@/lib/currency'

export const formatGeneratedAt = (value: string) =>
  formatDateTime(value)
