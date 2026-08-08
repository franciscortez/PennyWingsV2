export type TransactionType = 'income' | 'expense' | 'withdrawal' | 'transfer'

export type TransactionFilterType = TransactionType | 'all'

export type PaymentMethod = 'cash' | 'card' | 'ewallet'

export type FormPaymentMethod = PaymentMethod | 'lent'

export type DestinationPaymentMethod = FormPaymentMethod

export type TransactionCategory = {
  color: string | null
  icon: string | null
  id: string
  name: string
  type: 'income' | 'expense'
}

export type TransactionAccountRelation = {
  color?: string | null
  name: string | null
  walletType?: string | null
}

export type Transaction = {
  amount: number
  card?: TransactionAccountRelation | null
  card_id: string | null
  category?: TransactionCategory | null
  category_id: string | null
  created_at?: string | null
  created_by: string | null
  description: string | null
  fee_amount?: number
  id: string
  payment_method: PaymentMethod
  to_card?: TransactionAccountRelation | null
  to_card_id: string | null
  to_wallet?: TransactionAccountRelation | null
  to_wallet_id: string | null
  transaction_date: string
  type: TransactionType
  user_id: string
  wallet?: TransactionAccountRelation | null
  wallet_id: string | null
}

export type TransactionsListParams = {
  page: number
  pageSize: number
  search: string
  type: TransactionFilterType
  userId: string
}

export type TransactionsListData = {
  totalCount: number
  totalPages: number
  transactions: Transaction[]
}

export type TransactionFormValues = {
  amount: number
  card_id?: string
  category_id: string
  description?: string
  fee_amount?: number
  payment_method: FormPaymentMethod
  to_card_id?: string
  to_payment_method?: DestinationPaymentMethod
  to_wallet_id?: string
  transaction_date: string
  type: TransactionType
  wallet_id?: string
}

export type TransactionMutationValues = {
  amount: number
  card_id: string | null
  category_id: string
  description: string | null
  fee_amount?: number
  payment_method: PaymentMethod
  to_card_id: string | null
  to_wallet_id: string | null
  transaction_date: string
  type: TransactionType
  wallet_id: string | null
}

