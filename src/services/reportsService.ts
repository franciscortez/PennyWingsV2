import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/lib/database.types'
import type {
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
