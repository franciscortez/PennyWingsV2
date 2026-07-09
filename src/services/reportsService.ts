import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { MonthlyReport } from '@/types'

export const fetchMonthlyReports = async (
  userId: string,
): Promise<MonthlyReport[]> => {
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('user_id', userId)
    .order('report_month', { ascending: false })

  if (error) throw AppError.from(error)

  return data ?? []
}

export const saveMonthlyReport = async (
  reportMonth?: string,
): Promise<MonthlyReport> => {
  const { data, error } = await supabase.rpc(
    'save_monthly_report',
    reportMonth ? { p_report_month: reportMonth } : {},
  )

  if (error) throw AppError.from(error)

  if (!data) {
    throw new AppError('Monthly report was not returned after saving.')
  }

  return data
}
