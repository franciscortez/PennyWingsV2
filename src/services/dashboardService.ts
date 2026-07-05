import { supabase } from '@/lib/supabase'
import type {
  DashboardAccount,
  DashboardData,
  DashboardMonthlyStats,
  DashboardTransaction,
} from '@/types'

type CardRow = {
  id: string
  card_name: string
  card_type: string | null
  balance: number | string | null
  color: string | null
  text_color: string | null
}

type WalletRow = {
  id: string
  wallet_name: string
  wallet_type: string | null
  balance: number | string | null
  color: string | null
  text_color: string | null
}

type MonthTransactionRow = {
  amount: number | string | null
  category_id: string | null
  type: string
}

type BudgetRow = {
  category_id: string
  limit_amount: number | string | null
}

type GoalRow = {
  current_amount: number | string | null
  linked_card_id: string | null
  linked_wallet_id: string | null
  target_amount: number | string | null
}

type RawDashboardTransaction = DashboardTransaction & {
  category?: DashboardTransaction['category'] | DashboardTransaction['category'][]
  card?: DashboardTransaction['card'] | DashboardTransaction['card'][]
  wallet?: DashboardTransaction['wallet'] | DashboardTransaction['wallet'][]
  to_card?: DashboardTransaction['to_card'] | DashboardTransaction['to_card'][]
  to_wallet?: DashboardTransaction['to_wallet'] | DashboardTransaction['to_wallet'][]
}

export const emptyDashboardData: DashboardData = {
  accounts: [],
  totalBalance: 0,
  monthlyStats: {
    income: 0,
    expenses: 0,
  },
  progress: {
    budget: 0,
    goals: 0,
  },
  transactions: [],
}

const toNumber = (value: unknown) => Number(value ?? 0)

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

const getMonthRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

const getMonthlyStats = (
  transactions: MonthTransactionRow[],
): DashboardMonthlyStats =>
  transactions.reduce(
    (stats, transaction) => {
      const amount = toNumber(transaction.amount)

      if (transaction.type === 'income') {
        stats.income += amount
      }

      if (transaction.type === 'expense') {
        stats.expenses += amount
      }

      return stats
    },
    { income: 0, expenses: 0 },
  )

const getBudgetProgress = (
  budgets: BudgetRow[],
  transactions: MonthTransactionRow[],
) => {
  const expenseByCategory = transactions.reduce<Record<string, number>>(
    (stats, transaction) => {
      if (transaction.type !== 'expense' || !transaction.category_id) {
        return stats
      }

      stats[transaction.category_id] =
        (stats[transaction.category_id] ?? 0) + toNumber(transaction.amount)

      return stats
    },
    {},
  )

  const totalLimit = budgets.reduce(
    (sum, budget) => sum + toNumber(budget.limit_amount),
    0,
  )
  const totalSpent = budgets.reduce(
    (sum, budget) => sum + (expenseByCategory[budget.category_id] ?? 0),
    0,
  )

  return totalLimit > 0
    ? clampPercent(Math.round((totalSpent / totalLimit) * 100))
    : 0
}

const getGoalProgress = (
  goals: GoalRow[],
  cards: CardRow[],
  wallets: WalletRow[],
) => {
  const cardBalanceById = new Map(
    cards.map((card) => [card.id, toNumber(card.balance)]),
  )
  const walletBalanceById = new Map(
    wallets.map((wallet) => [wallet.id, toNumber(wallet.balance)]),
  )

  const totals = goals.reduce(
    (sum, goal) => {
      const linkedCardBalance = goal.linked_card_id
        ? cardBalanceById.get(goal.linked_card_id)
        : undefined
      const linkedWalletBalance = goal.linked_wallet_id
        ? walletBalanceById.get(goal.linked_wallet_id)
        : undefined

      sum.current +=
        linkedCardBalance ?? linkedWalletBalance ?? toNumber(goal.current_amount)
      sum.target += toNumber(goal.target_amount)

      return sum
    },
    { current: 0, target: 0 },
  )

  return totals.target > 0
    ? clampPercent(Math.round((totals.current / totals.target) * 100))
    : 0
}

const mapCardAccount = (card: CardRow): DashboardAccount => ({
  accountType: card.card_type,
  balance: toNumber(card.balance),
  color: card.color,
  id: card.id,
  kind: 'card',
  name: card.card_name,
  textColor: card.text_color,
})

const mapWalletAccount = (wallet: WalletRow): DashboardAccount => ({
  accountType: wallet.wallet_type,
  balance: toNumber(wallet.balance),
  color: wallet.color,
  id: wallet.id,
  kind: 'wallet',
  name: wallet.wallet_name,
  textColor: wallet.text_color,
})

const firstRelation = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

const mapDashboardTransaction = (
  transaction: RawDashboardTransaction,
): DashboardTransaction => ({
  ...transaction,
  card: firstRelation(transaction.card),
  category: firstRelation(transaction.category),
  to_card: firstRelation(transaction.to_card),
  to_wallet: firstRelation(transaction.to_wallet),
  wallet: firstRelation(transaction.wallet),
})

export const fetchDashboardData = async (
  userId: string,
  txLimit = 5,
): Promise<DashboardData> => {
  const { start, end } = getMonthRange()

  const [
    cardsResult,
    walletsResult,
    transactionsResult,
    monthTransactionsResult,
    budgetsResult,
    goalsResult,
  ] = await Promise.all([
    supabase
      .from('bank_cards')
      .select('id, card_name, card_type, balance, color, text_color')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('e_wallets')
      .select('id, wallet_name, wallet_type, balance, color, text_color')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select(`
        id, type, amount, description, transaction_date,
        to_card_id, to_wallet_id,
        category:categories(name, icon, color),
        card:bank_cards!transactions_card_id_fkey(card_name, color),
        wallet:e_wallets!transactions_wallet_id_fkey(wallet_name, color),
        to_card:bank_cards!transactions_to_card_id_fkey(card_name, color),
        to_wallet:e_wallets!transactions_to_wallet_id_fkey(wallet_name, color)
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(txLimit),
    supabase
      .from('transactions')
      .select('type, amount, category_id')
      .eq('user_id', userId)
      .gte('transaction_date', start)
      .lte('transaction_date', end),
    supabase
      .from('budgets')
      .select('category_id, limit_amount')
      .eq('user_id', userId),
    supabase
      .from('goals')
      .select('target_amount, current_amount, linked_card_id, linked_wallet_id')
      .eq('user_id', userId),
  ])

  const firstError =
    cardsResult.error ??
    walletsResult.error ??
    transactionsResult.error ??
    monthTransactionsResult.error ??
    budgetsResult.error ??
    goalsResult.error

  if (firstError) {
    throw firstError
  }

  const cards = (cardsResult.data ?? []) as CardRow[]
  const wallets = (walletsResult.data ?? []) as WalletRow[]
  const monthTransactions = (monthTransactionsResult.data ??
    []) as MonthTransactionRow[]
  const budgets = (budgetsResult.data ?? []) as BudgetRow[]
  const goals = (goalsResult.data ?? []) as GoalRow[]
  const accounts = [
    ...cards.map(mapCardAccount),
    ...wallets.map(mapWalletAccount),
  ]
  const monthlyStats = getMonthlyStats(monthTransactions)
  const transactions = ((transactionsResult.data ?? []) as unknown as RawDashboardTransaction[])
    .map(mapDashboardTransaction)

  return {
    accounts,
    monthlyStats,
    progress: {
      budget: getBudgetProgress(budgets, monthTransactions),
      goals: getGoalProgress(goals, cards, wallets),
    },
    totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    transactions,
  }
}
