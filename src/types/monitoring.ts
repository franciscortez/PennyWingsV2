import type { AccountKind } from '@/types/accounts'

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly'

export type MonitoringTab = 'budgets' | 'goals'

export type MonitoringCategory = {
  color: string | null
  icon: string | null
  id: string
  name: string
  type: 'income' | 'expense'
}

export type Budget = {
  category: MonitoringCategory | null
  categoryId: string
  createdAt: string | null
  id: string
  limitAmount: number
  period: BudgetPeriod
  progress: number
  remainingAmount: number
  spentAmount: number
}

export type GoalLinkedAccount = {
  balance: number
  color: string | null
  id: string
  kind: AccountKind
  name: string
}

export type Goal = {
  createdAt: string | null
  currentAmount: number
  daysLeft: number | null
  id: string
  linkedAccount: GoalLinkedAccount | null
  linkedCardId: string | null
  linkedWalletId: string | null
  name: string
  progress: number
  remainingAmount: number
  targetAmount: number
  targetDate: string | null
}

export type BudgetFormValues = {
  categoryId: string
  limitAmount: number
  period: BudgetPeriod
}

export type GoalFormValues = {
  currentAmount: number
  linkedCardId: string | null
  linkedWalletId: string | null
  name: string
  targetAmount: number
  targetDate: string | null
}

export type MonitoringData = {
  budgets: Budget[]
  expenseCategories: MonitoringCategory[]
  goals: Goal[]
  summary: {
    averageBudgetProgress: number
    averageGoalProgress: number
    budgetLimitTotal: number
    budgetSpentTotal: number
    dueSoonGoals: number
    goalCurrentTotal: number
    goalTargetTotal: number
  }
}
