import { supabase } from '@/lib/supabase'
import { getCurrentMonthRange } from '@/lib/date'
import type { Tables } from '@/lib/database.types'
import { AppError } from '@/lib/errors'
import type {
  DashboardAccount,
  DashboardData,
  DashboardMonthlyStats,
  DashboardTransaction,
} from '@/types'

type CardRow = Pick<
  Tables<'bank_cards'>,
  'balance' | 'card_name' | 'card_type' | 'color' | 'id' | 'text_color'
>

type WalletRow = Pick<
  Tables<'e_wallets'>,
  'balance' | 'color' | 'id' | 'text_color' | 'wallet_name' | 'wallet_type'
>

type MonthTransactionRow = Pick<
  Tables<'transactions'>,
  'amount' | 'category_id' | 'fee_amount' | 'type'
>

type BudgetRow = Pick<Tables<'budgets'>, 'category_id' | 'limit_amount'>

type GoalRow = Pick<
  Tables<'goals'>,
  'current_amount' | 'linked_card_id' | 'linked_wallet_id' | 'target_amount'
>

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

const getMonthlyStats = (
  transactions: MonthTransactionRow[],
): DashboardMonthlyStats =>
  transactions.reduce(
    (stats, transaction) => {
      const amount = toNumber(transaction.amount)
      const fee = toNumber(transaction.fee_amount)

      if (transaction.type === 'income') {
        stats.income += amount
      }

      if (transaction.type === 'expense') {
        stats.expenses += amount
      }

      if (fee > 0) {
        stats.expenses += fee
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
  kind:
    wallet.wallet_type === 'cash'
      ? 'cash'
      : wallet.wallet_type === 'lent'
        ? 'lent'
        : 'wallet',
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
  const { start, end } = getCurrentMonthRange()

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
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('e_wallets')
      .select('id, wallet_name, wallet_type, balance, color, text_color')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select(`
        id, type, amount, fee_amount, description, transaction_date,
        to_card_id, to_wallet_id,
        category:categories(name, icon, color),
        card:bank_cards!transactions_card_id_fkey(card_name, color),
        wallet:e_wallets!transactions_wallet_id_fkey(wallet_name, color),
        to_card:bank_cards!transactions_to_card_id_fkey(card_name, color),
        to_wallet:e_wallets!transactions_to_wallet_id_fkey(wallet_name, color)
      `)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(txLimit)
      .overrideTypes<RawDashboardTransaction[]>(),
    supabase
      .from('transactions')
      .select('type, amount, fee_amount, category_id')
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
    throw AppError.from(firstError)
  }

  const cards: CardRow[] = cardsResult.data ?? []
  const wallets: WalletRow[] = walletsResult.data ?? []
  const monthTransactions: MonthTransactionRow[] =
    monthTransactionsResult.data ?? []
  const budgets: BudgetRow[] = budgetsResult.data ?? []
  const goals: GoalRow[] = goalsResult.data ?? []
  const accounts = [
    ...cards.map(mapCardAccount),
    ...wallets.map(mapWalletAccount),
  ]
  const monthlyStats = getMonthlyStats(monthTransactions)
  const transactions = (transactionsResult.data ?? []).map(
    mapDashboardTransaction,
  )

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
