import { supabase } from '@/lib/supabase'
import { toDateInputValue } from '@/lib/date'
import { AppError } from '@/lib/errors'
import type {
  Budget,
  BudgetFormValues,
  BudgetPeriod,
  Goal,
  GoalFormValues,
  GoalLinkedAccount,
  MonitoringCategory,
  MonitoringData,
} from '@/types'

type CategoryRow = MonitoringCategory

type RawBudgetRow = {
  category?: CategoryRow | CategoryRow[] | null
  category_id: string
  created_at: string | null
  id: string
  limit_amount: number | string | null
  period: string | null
}

type ExpenseTransactionRow = {
  amount: number | string | null
  category_id: string | null
  transaction_date: string
}

type AccountRelationRow = {
  balance: number | string | null
  card_name?: string | null
  color: string | null
  id: string
  is_active?: boolean | null
  wallet_name?: string | null
  wallet_type?: string | null
}

type RawGoalRow = {
  created_at: string | null
  current_amount: number | string | null
  id: string
  linked_card?: AccountRelationRow | AccountRelationRow[] | null
  linked_card_id: string | null
  linked_wallet?: AccountRelationRow | AccountRelationRow[] | null
  linked_wallet_id: string | null
  name: string
  target_amount: number | string | null
  target_date: string | null
}

export const emptyMonitoringData: MonitoringData = {
  budgets: [],
  expenseCategories: [],
  goals: [],
  summary: {
    averageBudgetProgress: 0,
    averageGoalProgress: 0,
    budgetLimitTotal: 0,
    budgetSpentTotal: 0,
    dueSoonGoals: 0,
    goalCurrentTotal: 0,
    goalTargetTotal: 0,
  },
}

const budgetPeriods: BudgetPeriod[] = ['weekly', 'monthly', 'yearly']

const toNumber = (value: unknown) => Number(value ?? 0)

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

const firstRelation = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

const parseBudgetPeriod = (value: string | null): BudgetPeriod =>
  budgetPeriods.includes(value as BudgetPeriod)
    ? (value as BudgetPeriod)
    : 'monthly'

const getPeriodStart = (period: BudgetPeriod) => {
  const now = new Date()

  if (period === 'weekly') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    return toDateInputValue(start)
  }

  if (period === 'yearly') {
    return toDateInputValue(new Date(now.getFullYear(), 0, 1))
  }

  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
}

const getDaysLeft = (targetDate: string | null) => {
  if (!targetDate) {
    return null
  }

  const today = new Date()
  const target = new Date(`${targetDate}T00:00:00`)
  const msPerDay = 24 * 60 * 60 * 1000

  today.setHours(0, 0, 0, 0)

  return Math.ceil((target.getTime() - today.getTime()) / msPerDay)
}

const mapLinkedAccount = (
  relation: AccountRelationRow | AccountRelationRow[] | null | undefined,
  fallbackKind: 'card' | 'wallet',
): GoalLinkedAccount | null => {
  const account = firstRelation(relation)

  if (!account) {
    return null
  }

  const walletKind = account.wallet_type === 'cash' ? 'cash' : 'wallet'

  return {
    balance: toNumber(account.balance),
    color: account.color,
    id: account.id,
    kind: fallbackKind === 'card' ? 'card' : walletKind,
    name: account.card_name ?? account.wallet_name ?? 'Linked account',
  }
}

const getExpenseTotalsByCategory = (
  expenses: ExpenseTransactionRow[],
  startDate: string,
) =>
  expenses.reduce<Record<string, number>>((totals, transaction) => {
    if (!transaction.category_id || transaction.transaction_date < startDate) {
      return totals
    }

    totals[transaction.category_id] =
      (totals[transaction.category_id] ?? 0) + toNumber(transaction.amount)

    return totals
  }, {})

const mapBudget = (
  budget: RawBudgetRow,
  expenses: ExpenseTransactionRow[],
): Budget => {
  const period = parseBudgetPeriod(budget.period)
  const spentByCategory = getExpenseTotalsByCategory(
    expenses,
    getPeriodStart(period),
  )
  const limitAmount = toNumber(budget.limit_amount)
  const spentAmount = spentByCategory[budget.category_id] ?? 0

  return {
    category: firstRelation(budget.category),
    categoryId: budget.category_id,
    createdAt: budget.created_at,
    id: budget.id,
    limitAmount,
    period,
    progress:
      limitAmount > 0
        ? clampPercent(Math.round((spentAmount / limitAmount) * 100))
        : 0,
    remainingAmount: limitAmount - spentAmount,
    spentAmount,
  }
}

const mapGoal = (goal: RawGoalRow): Goal => {
  const linkedAccount =
    mapLinkedAccount(goal.linked_card, 'card') ??
    mapLinkedAccount(goal.linked_wallet, 'wallet')
  const targetAmount = toNumber(goal.target_amount)
  const currentAmount = linkedAccount?.balance ?? toNumber(goal.current_amount)

  return {
    createdAt: goal.created_at,
    currentAmount,
    daysLeft: getDaysLeft(goal.target_date),
    id: goal.id,
    linkedAccount,
    linkedCardId: goal.linked_card_id,
    linkedWalletId: goal.linked_wallet_id,
    name: goal.name,
    progress:
      targetAmount > 0
        ? clampPercent(Math.round((currentAmount / targetAmount) * 100))
        : 0,
    remainingAmount: Math.max(0, targetAmount - currentAmount),
    targetAmount,
    targetDate: goal.target_date,
  }
}

export const fetchMonitoringData = async (
  userId: string,
): Promise<MonitoringData> => {
  const yearStart = toDateInputValue(new Date(new Date().getFullYear(), 0, 1))
  const today = toDateInputValue()

  const [budgetsResult, goalsResult, categoriesResult, expensesResult] =
    await Promise.all([
      supabase
        .from('budgets')
        .select(
          'id, category_id, limit_amount, period, created_at, category:categories(id, name, type, icon, color)',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .overrideTypes<RawBudgetRow[]>(),
      supabase
        .from('goals')
        .select(
          `id, name, target_amount, current_amount, target_date, created_at,
          linked_card_id, linked_wallet_id,
          linked_card:bank_cards!goals_linked_card_id_fkey(id, card_name, balance, color, is_active),
          linked_wallet:e_wallets!goals_linked_wallet_id_fkey(id, wallet_name, wallet_type, balance, color, is_active)`,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .overrideTypes<RawGoalRow[]>(),
      supabase
        .from('categories')
        .select('id, name, type, icon, color')
        .eq('type', 'expense')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('name', { ascending: true }),
      supabase
        .from('transactions')
        .select('category_id, amount, transaction_date')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('transaction_date', yearStart)
        .lte('transaction_date', today),
    ])

  const firstError =
    budgetsResult.error ??
    goalsResult.error ??
    categoriesResult.error ??
    expensesResult.error

  if (firstError) {
    throw firstError
  }

  const expenses = (expensesResult.data ?? []) as ExpenseTransactionRow[]
  const budgets = (budgetsResult.data ?? []).map((budget) =>
    mapBudget(budget, expenses),
  )
  const goals = (goalsResult.data ?? []).map(mapGoal)
  const budgetSpentTotal = budgets.reduce(
    (sum, budget) => sum + budget.spentAmount,
    0,
  )
  const budgetLimitTotal = budgets.reduce(
    (sum, budget) => sum + budget.limitAmount,
    0,
  )
  const goalCurrentTotal = goals.reduce(
    (sum, goal) => sum + goal.currentAmount,
    0,
  )
  const goalTargetTotal = goals.reduce(
    (sum, goal) => sum + goal.targetAmount,
    0,
  )

  return {
    budgets,
    expenseCategories: (categoriesResult.data ?? []) as CategoryRow[],
    goals,
    summary: {
      averageBudgetProgress:
        budgetLimitTotal > 0
          ? clampPercent(Math.round((budgetSpentTotal / budgetLimitTotal) * 100))
          : 0,
      averageGoalProgress:
        goalTargetTotal > 0
          ? clampPercent(Math.round((goalCurrentTotal / goalTargetTotal) * 100))
          : 0,
      budgetLimitTotal,
      budgetSpentTotal,
      dueSoonGoals: goals.filter(
        (goal) => goal.daysLeft !== null && goal.daysLeft >= 0 && goal.daysLeft <= 30,
      ).length,
      goalCurrentTotal,
      goalTargetTotal,
    },
  }
}

export const createBudget = async (
  userId: string,
  values: BudgetFormValues,
) => {
  const { error } = await supabase.from('budgets').insert({
    category_id: values.categoryId,
    limit_amount: values.limitAmount,
    period: values.period,
    user_id: userId,
  })

  if (error) throw AppError.from(error)
}

export const updateBudget = async (
  userId: string,
  budgetId: string,
  values: BudgetFormValues,
) => {
  const { error } = await supabase
    .from('budgets')
    .update({
      category_id: values.categoryId,
      limit_amount: values.limitAmount,
      period: values.period,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', userId)

  if (error) throw AppError.from(error)
}

export const deleteBudget = async (userId: string, budgetId: string) => {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', userId)

  if (error) throw AppError.from(error)
}

export const createGoal = async (userId: string, values: GoalFormValues) => {
  const { error } = await supabase.from('goals').insert({
    current_amount: values.currentAmount,
    linked_card_id: values.linkedCardId,
    linked_wallet_id: values.linkedWalletId,
    name: values.name,
    target_amount: values.targetAmount,
    target_date: values.targetDate,
    user_id: userId,
  })

  if (error) throw AppError.from(error)
}

export const updateGoal = async (
  userId: string,
  goalId: string,
  values: GoalFormValues,
) => {
  const { error } = await supabase
    .from('goals')
    .update({
      current_amount: values.currentAmount,
      linked_card_id: values.linkedCardId,
      linked_wallet_id: values.linkedWalletId,
      name: values.name,
      target_amount: values.targetAmount,
      target_date: values.targetDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) throw AppError.from(error)
}

export const deleteGoal = async (userId: string, goalId: string) => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) throw AppError.from(error)
}
