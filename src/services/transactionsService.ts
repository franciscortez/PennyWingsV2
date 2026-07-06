import { supabase } from '@/lib/supabase'
import type {
  PaymentMethod,
  Transaction,
  TransactionAccountRelation,
  TransactionCategory,
  TransactionMutationValues,
  TransactionsListData,
  TransactionsListParams,
  TransactionType,
} from '@/types'

const TX_SELECT = `
  id, type, payment_method, amount, description, transaction_date, created_at,
  card_id, wallet_id, category_id, to_card_id, to_wallet_id,
  category:categories(id, name, type, icon, color),
  card:bank_cards!transactions_card_id_fkey(card_name, color),
  wallet:e_wallets!transactions_wallet_id_fkey(wallet_name, color),
  to_card:bank_cards!transactions_to_card_id_fkey(card_name, color),
  to_wallet:e_wallets!transactions_to_wallet_id_fkey(wallet_name, color)
`

type AccountRelationRow = {
  card_name?: string | null
  color?: string | null
  wallet_name?: string | null
}

type RawTransactionRow = {
  amount: number | string
  card?: AccountRelationRow | AccountRelationRow[] | null
  card_id: string | null
  category?: TransactionCategory | TransactionCategory[] | null
  category_id: string | null
  created_at?: string | null
  description: string | null
  id: string
  payment_method: PaymentMethod
  to_card?: AccountRelationRow | AccountRelationRow[] | null
  to_card_id: string | null
  to_wallet?: AccountRelationRow | AccountRelationRow[] | null
  to_wallet_id: string | null
  transaction_date: string
  type: TransactionType
  wallet?: AccountRelationRow | AccountRelationRow[] | null
  wallet_id: string | null
}

type BalanceRow = {
  balance: number | string | null
}

const firstRelation = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

const mapAccountRelation = (
  relation: AccountRelationRow | AccountRelationRow[] | null | undefined,
): TransactionAccountRelation | null => {
  const account = firstRelation(relation)

  if (!account) {
    return null
  }

  return {
    color: account.color ?? null,
    name: account.card_name ?? account.wallet_name ?? null,
  }
}

const mapCategory = (
  category: TransactionCategory | TransactionCategory[] | null | undefined,
) => firstRelation(category)

const mapTransaction = (transaction: RawTransactionRow): Transaction => ({
  amount: Number(transaction.amount ?? 0),
  card: mapAccountRelation(transaction.card),
  card_id: transaction.card_id,
  category: mapCategory(transaction.category),
  category_id: transaction.category_id,
  created_at: transaction.created_at,
  description: transaction.description,
  id: transaction.id,
  payment_method: transaction.payment_method,
  to_card: mapAccountRelation(transaction.to_card),
  to_card_id: transaction.to_card_id,
  to_wallet: mapAccountRelation(transaction.to_wallet),
  to_wallet_id: transaction.to_wallet_id,
  transaction_date: transaction.transaction_date,
  type: transaction.type,
  wallet: mapAccountRelation(transaction.wallet),
  wallet_id: transaction.wallet_id,
})

export const emptyTransactionsListData: TransactionsListData = {
  totalCount: 0,
  totalPages: 0,
  transactions: [],
}

export const fetchTransactions = async ({
  page,
  pageSize,
  search,
  type,
  userId,
}: TransactionsListParams): Promise<TransactionsListData> => {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const cleanedSearch = search.trim()

  let countQuery = supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  let dataQuery = supabase
    .from('transactions')
    .select(TX_SELECT)
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (type !== 'all') {
    countQuery = countQuery.eq('type', type)
    dataQuery = dataQuery.eq('type', type)
  }

  if (cleanedSearch) {
    countQuery = countQuery.ilike('description', `%${cleanedSearch}%`)
    dataQuery = dataQuery.ilike('description', `%${cleanedSearch}%`)
  }

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery])
  const firstError = countResult.error ?? dataResult.error

  if (firstError) {
    throw firstError
  }

  const totalCount = countResult.count ?? 0

  return {
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    transactions: ((dataResult.data ?? []) as unknown as RawTransactionRow[]).map(
      mapTransaction,
    ),
  }
}

export const fetchAccountBalance = async (
  account: Pick<TransactionMutationValues, 'card_id' | 'wallet_id'>,
) => {
  if (account.card_id) {
    const { data, error } = await supabase
      .from('bank_cards')
      .select('balance')
      .eq('id', account.card_id)
      .single<BalanceRow>()

    if (error) {
      throw error
    }

    return Number(data?.balance ?? 0)
  }

  if (account.wallet_id) {
    const { data, error } = await supabase
      .from('e_wallets')
      .select('balance')
      .eq('id', account.wallet_id)
      .single<BalanceRow>()

    if (error) {
      throw error
    }

    return Number(data?.balance ?? 0)
  }

  return 0
}

export const processTransaction = async (values: TransactionMutationValues) =>
  supabase.rpc('process_transaction', {
    p_amount: values.amount,
    p_card_id: values.card_id,
    p_category_id: values.category_id,
    p_description: values.description,
    p_payment_method: values.payment_method,
    p_to_card_id: values.to_card_id,
    p_to_wallet_id: values.to_wallet_id,
    p_transaction_date: values.transaction_date,
    p_type: values.type,
    p_wallet_id: values.wallet_id,
  })

export const updateTransaction = async (
  id: string,
  values: TransactionMutationValues,
) =>
  supabase.rpc('update_transaction', {
    p_amount: values.amount,
    p_card_id: values.card_id,
    p_category_id: values.category_id,
    p_description: values.description,
    p_id: id,
    p_payment_method: values.payment_method,
    p_to_card_id: values.to_card_id,
    p_to_wallet_id: values.to_wallet_id,
    p_transaction_date: values.transaction_date,
    p_type: values.type,
    p_wallet_id: values.wallet_id,
  })

export const deleteTransaction = async (id: string) =>
  supabase.rpc('delete_transaction', {
    p_id: id,
  })

