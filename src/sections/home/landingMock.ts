// Illustrative figures for the landing page previews. They are fixed so the
// hero balance, the account stack and the monthly report agree with each
// other. None of this is user data.

export type MockAccount = {
  kind: 'card' | 'e-wallet' | 'cash' | 'lent'
  typeLabel: string
  label: string
  detail: string
  balance: number
  tone: string
}

export const mockAccounts: MockAccount[] = [
  {
    kind: 'card',
    typeLabel: 'Card',
    label: 'Savings card',
    detail: '•••• 4821',
    balance: 52300,
    tone: 'bg-pink-800',
  },
  {
    kind: 'e-wallet',
    typeLabel: 'E-wallet',
    label: 'Everyday e-wallet',
    detail: 'Daily spending',
    balance: 18640.5,
    tone: 'bg-pink-600',
  },
  {
    kind: 'cash',
    typeLabel: 'Cash',
    label: 'Cash on hand',
    detail: 'Wallet and coin jar',
    balance: 9480,
    tone: 'bg-pink-400',
  },
  {
    kind: 'lent',
    typeLabel: 'Lent',
    label: 'Lent to Mika',
    detail: 'Owed back to you',
    balance: 6000,
    tone: 'bg-pink-200',
  },
]

export const mockTotalBalance = mockAccounts.reduce(
  (total, account) => total + account.balance,
  0,
)

export type MockLedgerRow = {
  label: string
  meta: string
  amount: number
  direction: 'in' | 'out' | 'move'
  fee?: number
}

export const mockLedger: MockLedgerRow[] = [
  { label: 'Salary', meta: 'Income · Savings card', amount: 45000, direction: 'in' },
  { label: 'Groceries', meta: 'Expense · E-wallet', amount: 2450.2, direction: 'out' },
  {
    label: 'Card to e-wallet',
    meta: 'Transfer',
    amount: 5000,
    direction: 'move',
    fee: 15,
  },
  {
    label: 'ATM withdrawal',
    meta: 'Withdrawal · to Cash',
    amount: 3000,
    direction: 'move',
    fee: 18,
  },
]

export const mockBudgets = {
  weekly: { spent: 1640, limit: 2000 },
  monthly: { spent: 6200, limit: 8000 },
  yearly: { spent: 61850, limit: 96000 },
} as const

export type BudgetPeriod = keyof typeof mockBudgets

export const mockGoal = {
  name: 'Emergency fund',
  linkedAccount: 'Savings card',
  current: 38500,
  target: 60000,
  daysLeft: 112,
}

export const mockReport = {
  month: 'August',
  income: 52000,
  expenses: 31480,
  categories: [
    { name: 'Food & dining', amount: 9820, tone: 'bg-pink-800' },
    { name: 'Bills & utilities', amount: 7640, tone: 'bg-pink-600' },
    { name: 'Transport', amount: 5210, tone: 'bg-pink-400' },
    { name: 'Shopping', amount: 3960, tone: 'bg-pink-300' },
  ],
}

// Five weeks of daily spend intensity for the calendar preview. 0 means no
// expense that day; 1 to 5 map onto the `heat-*` tokens in `index.css`.
export const mockSpendingWeeks: number[][] = [
  [0, 1, 2, 1, 3, 4, 2],
  [1, 0, 2, 3, 1, 5, 3],
  [2, 1, 0, 1, 2, 4, 1],
  [3, 2, 1, 0, 2, 3, 5],
  [1, 2, 4, 1, 0, 0, 0],
]
