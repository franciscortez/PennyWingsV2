import type { AccountKind } from '@/types/accounts'

export type DashboardAccount = {
  accountType: string | null
  id: string
  name: string
  kind: Extract<AccountKind, 'card' | 'cash' | 'lent' | 'wallet'>
  balance: number
  color: string | null
  textColor: string | null
}

export type DashboardMonthlyStats = {
  income: number
  expenses: number
}

export type DashboardProgress = {
  budget: number
  goals: number
}

export type DashboardTransaction = {
  id: string
  type: 'income' | 'expense' | 'withdrawal' | 'transfer'
  amount: number
  description: string | null
  transaction_date: string | null
  category?: {
    color?: string | null
    icon?: string | null
    name: string | null
  } | null
  card?: {
    card_name: string | null
    color?: string | null
  } | null
  wallet?: {
    wallet_name: string | null
    color?: string | null
  } | null
  to_card?: {
    card_name: string | null
    color?: string | null
  } | null
  to_wallet?: {
    wallet_name: string | null
    color?: string | null
  } | null
}

export type DashboardData = {
  accounts: DashboardAccount[]
  totalBalance: number
  monthlyStats: DashboardMonthlyStats
  progress: DashboardProgress
  transactions: DashboardTransaction[]
}
