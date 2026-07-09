import type { Tables } from '@/lib/database.types'

export type ReportCategoryBreakdown = {
  categoryId: string | null
  categoryName: string
  total: number
  type: string
}

export type ReportAccountSnapshot = {
  balance: number
  id: string
  isActive: boolean
  kind: 'card' | 'cash' | 'wallet'
  name: string
}

export type MonthlyReport = {
  accountSnapshot: ReportAccountSnapshot[]
  categoryBreakdown: ReportCategoryBreakdown[]
  expenseTotal: number
  generatedAt: string
  id: string
  incomeTotal: number
  netCashflow: number
  reportMonth: string
  transactionCount: number
  transferTotal: number
  withdrawalTotal: number
}

export type MonthlyReportRow = Tables<'monthly_reports'>
