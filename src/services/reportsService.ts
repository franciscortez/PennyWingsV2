import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/lib/database.types'
import type {
  DailySpending,
  DailySpendingCalendar,
  MonthlyReport,
  MonthlyReportRow,
  ReportAccountSnapshot,
  ReportCategoryBreakdown,
} from '@/types'

const isJsonRecord = (value: Json): value is Record<string, Json | undefined> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parseCategoryBreakdown = (value: Json): ReportCategoryBreakdown[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!isJsonRecord(item)) {
      return []
    }

    const categoryName = item.category_name
    const total = item.total
    const type = item.type

    if (
      typeof categoryName !== 'string' ||
      typeof total !== 'number' ||
      typeof type !== 'string'
    ) {
      return []
    }

    return [{
      categoryId:
        typeof item.category_id === 'string' ? item.category_id : null,
      categoryName,
      total,
      type,
    }]
  })
}

const parseAccountSnapshot = (value: Json): ReportAccountSnapshot[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (!isJsonRecord(item)) {
      return []
    }

    const { balance, id, is_active: isActive, kind, name } = item

    if (
      typeof balance !== 'number' ||
      typeof id !== 'string' ||
      typeof isActive !== 'boolean' ||
      (kind !== 'card' &&
        kind !== 'cash' &&
        kind !== 'lent' &&
        kind !== 'wallet') ||
      typeof name !== 'string'
    ) {
      return []
    }

    return [{ balance, id, isActive, kind, name }]
  })
}

const mapMonthlyReport = (report: MonthlyReportRow): MonthlyReport => ({
  accountSnapshot: parseAccountSnapshot(report.account_snapshot),
  categoryBreakdown: parseCategoryBreakdown(report.category_breakdown),
  expenseTotal: Number(report.expense_total),
  generatedAt: report.generated_at,
  id: report.id,
  incomeTotal: Number(report.income_total),
  netCashflow: Number(report.net_cashflow),
  reportMonth: report.report_month,
  transactionCount: report.transaction_count,
  transferTotal: Number(report.transfer_total),
  withdrawalTotal: Number(report.withdrawal_total),
})

export const fetchMonthlyReports = async (
  userId: string,
): Promise<MonthlyReport[]> => {
  const { error: syncError } = await supabase.rpc('sync_monthly_reports')

  if (syncError) throw AppError.from(syncError)

  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('user_id', userId)
    .order('report_month', { ascending: false })

  if (error) throw AppError.from(error)

  return (data ?? []).map(mapMonthlyReport)
}

const padMonth = (value: number) => String(value).padStart(2, '0')

// `transaction_date` is a `date` column with no time component, so the month
// bounds are built as plain strings. Parsing into `Date` and re-serializing
// would shift days for users east of UTC (Asia/Manila).
const getMonthBounds = (month: string) => {
  const monthKey = month.slice(0, 7)
  const year = Number(monthKey.slice(0, 4))
  const monthNumber = Number(monthKey.slice(5, 7))
  const rollsOver = monthNumber === 12

  return {
    monthStart: `${monthKey}-01`,
    nextMonthStart: `${rollsOver ? year + 1 : year}-${padMonth(
      rollsOver ? 1 : monthNumber + 1,
    )}-01`,
  }
}

export const fetchDailySpending = async (
  userId: string,
  month: string,
): Promise<DailySpendingCalendar> => {
  const { monthStart, nextMonthStart } = getMonthBounds(month)

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date, amount')
    // Scoped to the signed-in user on purpose. `save_monthly_report()`
    // aggregates `t.user_id = current_user_id` only, and shared-account
    // activity is recorded on the owner's ledger, so widening this to every
    // RLS-visible row would make the calendar disagree with the
    // `expense_total` that `ReportSummarySection` shows on the same page.
    .eq('user_id', userId)
    // `expense` only. `monthly_reports` keeps `withdrawal_total` separate from
    // `expense_total`, and a withdrawal moves cash between the user's own
    // accounts rather than out of their money.
    .eq('type', 'expense')
    .gte('transaction_date', monthStart)
    .lt('transaction_date', nextMonthStart)

  if (error) throw AppError.from(error)

  const dayTotals = new Map<string, DailySpending>()

  for (const row of data ?? []) {
    // `save_monthly_report()` sums `amount` alone for `expense_total` and
    // ignores `fee_amount`, so the calendar matches it exactly.
    const amount = Number(row.amount)
    // Bucket on the raw `YYYY-MM-DD` string; see `getMonthBounds`.
    const existing = dayTotals.get(row.transaction_date)

    if (existing) {
      existing.total += amount
      existing.transactionCount += 1
      continue
    }

    dayTotals.set(row.transaction_date, {
      date: row.transaction_date,
      total: amount,
      transactionCount: 1,
    })
  }

  const days = [...dayTotals.values()].sort((first, second) =>
    first.date.localeCompare(second.date),
  )

  return {
    days,
    // Seeded folds, so an empty month reports 0 instead of -Infinity or NaN.
    maxDailyTotal: days.reduce((max, day) => Math.max(max, day.total), 0),
    month: monthStart,
    totalSpent: days.reduce((total, day) => total + day.total, 0),
  }
}
