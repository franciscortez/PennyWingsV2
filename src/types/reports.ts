import type { Tables } from '@/lib/database.types'
import type { AccountKind } from '@/types/accounts'

export type DailySpendingTransaction = {
  accountName: string | null
  amount: number
  categoryColor: string | null
  categoryName: string | null
  description: string | null
  id: string
}

export type DailySpending = {
  date: string
  total: number
  transactionCount: number
  transactions: DailySpendingTransaction[]
}

export type DailySpendingCalendar = {
  days: DailySpending[]
  maxDailyTotal: number
  month: string
  totalSpent: number
}

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
  kind: Extract<AccountKind, 'card' | 'cash' | 'lent' | 'wallet'>
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
