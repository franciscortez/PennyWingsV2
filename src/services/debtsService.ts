import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'
import { AppError } from '@/lib/errors'
import type {
  Debt,
  DebtCharge,
  DebtChargeStatus,
  DebtChargeValues,
  DebtCreateValues,
  DebtPayment,
  DebtPaymentStatus,
  DebtPayMutationValues,
  DebtStatus,
  DebtType,
  DebtUpdateValues,
  PaymentMethod,
} from '@/types'

type RawDebtRow = Tables<'debts'>

type RawDebtChargeRow = Tables<'debt_charges'>

type AccountRelation = { card_name?: string | null; wallet_name?: string | null }

type RawDebtPaymentRow = Tables<'debt_payments'> & {
  card?: AccountRelation | AccountRelation[] | null
  wallet?: AccountRelation | AccountRelation[] | null
}

const firstRelation = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null)

const mapDebt = (row: RawDebtRow): Debt => ({
  id: row.id,
  userId: row.user_id,
  providerName: row.provider_name,
  debtType: row.debt_type as DebtType,
  originalAmount: Number(row.original_amount),
  outstandingAmount: Number(row.outstanding_amount),
  dueDate: row.due_date,
  note: row.note,
  status: row.status as DebtStatus,
  paidAt: row.paid_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const mapDebtCharge = (row: RawDebtChargeRow): DebtCharge => ({
  id: row.id,
  debtId: row.debt_id,
  userId: row.user_id,
  amount: Number(row.amount),
  chargeDate: row.charge_date,
  note: row.note,
  status: row.status as DebtChargeStatus,
  voidedAt: row.voided_at,
  voidReason: row.void_reason,
  createdAt: row.created_at,
})

const mapDebtPayment = (row: RawDebtPaymentRow): DebtPayment => {
  const card = firstRelation(row.card)
  const wallet = firstRelation(row.wallet)
  const accountName = card?.card_name ?? wallet?.wallet_name ?? null

  return {
    id: row.id,
    debtId: row.debt_id,
    userId: row.user_id,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method as PaymentMethod,
    cardId: row.card_id,
    walletId: row.wallet_id,
    note: row.note,
    status: row.status as DebtPaymentStatus,
    reversedAt: row.reversed_at,
    reversalReason: row.reversal_reason,
    createdAt: row.created_at,
    accountName,
  }
}

const checkedDebtError = (error: { code?: string; message?: string }) => {
  if (error.code === 'P0001' && error.message === 'Insufficient balance.') {
    return new AppError('Insufficient balance in selected account.', {
      cause: error,
      code: error.code,
    })
  }
  if (
    error.code === '22023' &&
    error.message === 'Payment amount exceeds remaining debt balance.'
  ) {
    return new AppError('Payment amount exceeds remaining debt balance.', {
      cause: error,
      code: error.code,
    })
  }
  if (
    error.code === '22023' &&
    error.message === 'Purchase has already been repaid. Reverse a payment first.'
  ) {
    return new AppError(error.message, { cause: error, code: error.code })
  }
  return AppError.from(error)
}

export const fetchDebts = async (status?: DebtStatus | 'all'): Promise<Debt[]> => {
  let query = supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw AppError.from(error)

  return (data ?? []).map(mapDebt)
}

export const fetchDebtById = async (id: string): Promise<Debt> => {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw AppError.from(error)

  return mapDebt(data)
}

export const fetchDebtPayments = async (debtId?: string): Promise<DebtPayment[]> => {
  let query = supabase
    .from('debt_payments')
    .select(`
      id, debt_id, user_id, amount, payment_date, payment_method,
      card_id, wallet_id, note, status, reversed_at, reversal_reason, created_at,
      card:bank_cards!debt_payments_card_id_fkey(card_name),
      wallet:e_wallets!debt_payments_wallet_id_fkey(wallet_name)
    `)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (debtId) {
    query = query.eq('debt_id', debtId)
  }

  const { data, error } = await query.overrideTypes<RawDebtPaymentRow[]>()

  if (error) throw AppError.from(error)

  return (data ?? []).map(mapDebtPayment)
}

export const fetchDebtCharges = async (debtId?: string): Promise<DebtCharge[]> => {
  let query = supabase
    .from('debt_charges')
    .select('*')
    .order('charge_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (debtId) {
    query = query.eq('debt_id', debtId)
  }

  const { data, error } = await query

  if (error) throw AppError.from(error)

  return (data ?? []).map(mapDebtCharge)
}

export const addDebtCharge = async (
  values: DebtChargeValues,
): Promise<{ id: string; outstanding_amount: number }> => {
  const { data, error } = await supabase.rpc('add_debt_charge_checked', {
    p_debt_id: values.debt_id,
    p_amount: values.amount,
    p_charge_date: values.charge_date ?? new Date().toISOString().slice(0, 10),
    p_note: values.note ?? undefined,
  })

  if (error) throw checkedDebtError(error)

  const parsed = data as { id?: string; outstanding_amount?: number } | null

  return {
    id: parsed?.id ?? '',
    outstanding_amount: Number(parsed?.outstanding_amount ?? 0),
  }
}

export const voidDebtCharge = async (
  chargeId: string,
  reason?: string,
): Promise<void> => {
  const { error } = await supabase.rpc('void_debt_charge_checked', {
    p_charge_id: chargeId,
    p_reason: reason ?? undefined,
  })

  if (error) throw checkedDebtError(error)
}

export const createDebt = async (values: DebtCreateValues): Promise<{ id: string }> => {
  const { data, error } = await supabase.rpc('create_debt_checked', {
    p_provider_name: values.provider_name,
    p_debt_type: values.debt_type,
    p_original_amount: values.original_amount,
    p_due_date: values.due_date ?? undefined,
    p_note: values.note ?? undefined,
  })

  if (error) throw checkedDebtError(error)

  const parsed = data as { id?: string } | null
  return { id: parsed?.id ?? '' }
}

export const updateDebt = async (id: string, values: DebtUpdateValues): Promise<void> => {
  const { error } = await supabase.rpc('update_debt_checked', {
    p_id: id,
    p_provider_name: values.provider_name,
    p_debt_type: values.debt_type,
    p_due_date: values.due_date ?? undefined,
    p_note: values.note ?? undefined,
  })

  if (error) throw checkedDebtError(error)
}

export const archiveDebt = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc('archive_debt_checked', { p_id: id })

  if (error) throw AppError.from(error)
}

export const unarchiveDebt = async (id: string): Promise<void> => {
  const { error } = await supabase.rpc('unarchive_debt_checked', { p_id: id })

  if (error) throw AppError.from(error)
}

export const payDebt = async (
  values: DebtPayMutationValues,
): Promise<{ id: string; remaining_balance: number; is_paid: boolean }> => {
  const { data, error } = await supabase.rpc('pay_debt_checked', {
    p_debt_id: values.debt_id,
    p_amount: values.amount,
    p_payment_method: values.payment_method,
    p_card_id: values.card_id ?? undefined,
    p_wallet_id: values.wallet_id ?? undefined,
    p_payment_date: values.payment_date ?? new Date().toISOString().slice(0, 10),
    p_note: values.note ?? undefined,
  })

  if (error) throw checkedDebtError(error)

  const parsed = data as {
    id?: string
    remaining_balance?: number
    is_paid?: boolean
  } | null

  return {
    id: parsed?.id ?? '',
    remaining_balance: Number(parsed?.remaining_balance ?? 0),
    is_paid: Boolean(parsed?.is_paid),
  }
}

export const reverseDebtPayment = async (
  paymentId: string,
  reason?: string,
): Promise<void> => {
  const { error } = await supabase.rpc('reverse_debt_payment_checked', {
    p_payment_id: paymentId,
    p_reason: reason ?? undefined,
  })

  if (error) throw AppError.from(error)
}
