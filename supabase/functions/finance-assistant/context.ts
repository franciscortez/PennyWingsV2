// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult = any

import {
  getPeriodStart,
  toNumber,
  relationName,
  relationNumber,
} from './helpers.ts'

interface BuildContextParams {
  user: { id: string }
  now: Date
  today: string
  monthStart: string
  profile: QueryResult
  cards: QueryResult[] | null
  wallets: QueryResult[] | null
  memberships: QueryResult[] | null
  monthTransactions: QueryResult[] | null
  recentTransactions: QueryResult[] | null
  budgets: QueryResult[] | null
  budgetExpenses: QueryResult[] | null
  goals: QueryResult[] | null
  reports: QueryResult[] | null
}

export function buildFinancialContext({
  user,
  now,
  today,
  monthStart,
  profile,
  cards,
  wallets,
  memberships: rawMemberships,
  monthTransactions,
  recentTransactions,
  budgets: rawBudgets,
  budgetExpenses,
  goals: rawGoals,
  reports,
}: BuildContextParams) {
  const memberships = new Map(
    (rawMemberships ?? []).map((membership) => [
      `${membership.resource_type}:${membership.resource_id}`,
      membership.role,
    ]),
  )

  const accounts = [
    ...(cards ?? []).map((card) => ({
      accessRole:
        card.user_id === user.id
          ? 'owner'
          : (memberships.get(`bank_card:${card.id}`) ?? 'viewer'),
      accountType: card.card_type,
      balance: toNumber(card.balance),
      kind: 'card',
      name: card.card_name,
    })),
    ...(wallets ?? []).map((wallet) => ({
      accessRole:
        wallet.user_id === user.id
          ? 'owner'
          : (memberships.get(`e_wallet:${wallet.id}`) ?? 'viewer'),
      accountType: wallet.wallet_type,
      balance: toNumber(wallet.balance),
      kind:
        wallet.wallet_type === 'cash' || wallet.wallet_type === 'lent'
          ? wallet.wallet_type
          : 'wallet',
      name: wallet.wallet_name,
    })),
  ]

  const monthlyTotals = (monthTransactions ?? []).reduce(
    (totals, transaction) => {
      const amount = toNumber(transaction.amount)
      if (transaction.type === 'income') totals.income += amount
      if (transaction.type === 'expense') totals.expenses += amount
      return totals
    },
    { expenses: 0, income: 0 },
  )

  const expenses = budgetExpenses ?? []
  const budgets = (rawBudgets ?? []).map((budget) => {
    const period = ['weekly', 'yearly'].includes(budget.period)
      ? budget.period
      : 'monthly'
    const periodStart = getPeriodStart(period, now)
    const spent = expenses.reduce((total, transaction) => {
      if (
        transaction.category_id !== budget.category_id ||
        transaction.transaction_date < periodStart
      ) {
        return total
      }

      return total + toNumber(transaction.amount)
    }, 0)
    const limit = toNumber(budget.limit_amount)

    return {
      category: relationName(budget.category, 'name') ?? 'Uncategorized',
      limit,
      period,
      progressPercent:
        limit > 0 ? Math.min(100, Math.max(0, Math.round((spent / limit) * 100))) : 0,
      remaining: limit - spent,
      spent,
    }
  })

  const goals = (rawGoals ?? []).map((goal) => {
    const current =
      relationNumber(goal.linked_card, 'balance') ??
      relationNumber(goal.linked_wallet, 'balance') ??
      toNumber(goal.current_amount)
    const target = toNumber(goal.target_amount)

    return {
      current,
      name: goal.name,
      progressPercent:
        target > 0 ? Math.min(100, Math.max(0, Math.round((current / target) * 100))) : 0,
      remaining: Math.max(0, target - current),
      target,
      targetDate: goal.target_date,
    }
  })

  return {
    accounts,
    asOfDate: today,
    budgets,
    goals,
    monthlyReports: (reports ?? []).map((report) => ({
      expenses: toNumber(report.expense_total),
      income: toNumber(report.income_total),
      month: report.report_month,
      netCashflow: toNumber(report.net_cashflow),
      transactionCount: report.transaction_count,
      transfers: toNumber(report.transfer_total),
      withdrawals: toNumber(report.withdrawal_total),
    })),
    currentMonth: {
      ...monthlyTotals,
      transactionLimitReached: (monthTransactions ?? []).length === 1_000,
      net: monthlyTotals.income - monthlyTotals.expenses,
      start: monthStart,
    },
    displayName: profile?.full_name ?? 'PennyWings user',
    recentTransactions: (recentTransactions ?? []).map((transaction) => ({
      amount: toNumber(transaction.amount),
      category: relationName(transaction.category, 'name'),
      date: transaction.transaction_date,
      description: transaction.description,
      destinationAccount:
        relationName(transaction.to_card, 'card_name') ??
        relationName(transaction.to_wallet, 'wallet_name'),
      paymentMethod: transaction.payment_method,
      sourceAccount:
        relationName(transaction.card, 'card_name') ??
        relationName(transaction.wallet, 'wallet_name'),
      type: transaction.type,
    })),
    spendingHistoryLimitReached: (budgetExpenses ?? []).length === 1_000,
    totalAccessibleBalance: accounts.reduce(
      (total, account) => total + account.balance,
      0,
    ),
  }
}
