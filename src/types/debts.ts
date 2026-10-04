import type { PaymentMethod } from '@/types/transactions'

export type DebtType = 'bnpl' | 'credit_card' | 'personal_loan' | 'other'

export type DebtStatus = 'outstanding' | 'paid' | 'archived'

export type Debt = {
  id: string
  userId: string
  providerName: string
  debtType: DebtType
  originalAmount: number
  outstandingAmount: number
  dueDate: string | null
  note: string | null
  status: DebtStatus
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export type DebtPaymentStatus = 'completed' | 'reversed'

export type DebtPayment = {
  id: string
  debtId: string
  userId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  cardId: string | null
  walletId: string | null
  note: string | null
  status: DebtPaymentStatus
  reversedAt: string | null
  reversalReason: string | null
  createdAt: string
  accountName?: string | null
}

export type DebtChargeStatus = 'active' | 'voided'

export type DebtCharge = {
  id: string
  debtId: string
  userId: string
  amount: number
  chargeDate: string
  note: string | null
  status: DebtChargeStatus
  voidedAt: string | null
  voidReason: string | null
  createdAt: string
}

export type DebtChargeValues = {
  debt_id: string
  amount: number
  charge_date?: string
  note?: string | null
}

export type DebtChargeFormValues = {
  amount: number
  charge_date: string
  note?: string | null
}

export type DebtActivityItem =
  | { kind: 'charge'; date: string; createdAt: string; charge: DebtCharge }
  | { kind: 'payment'; date: string; createdAt: string; payment: DebtPayment }

export type DebtCreateValues = {
  provider_name: string
  debt_type: DebtType
  original_amount: number
  due_date?: string | null
  note?: string | null
}

export type DebtUpdateValues = {
  provider_name: string
  debt_type: DebtType
  due_date?: string | null
  note?: string | null
}

export type DebtPayMutationValues = {
  debt_id: string
  amount: number
  payment_method: PaymentMethod
  card_id?: string | null
  wallet_id?: string | null
  payment_date?: string
  note?: string | null
}

export type DebtPayFormValues = {
  amount: number
  payment_method: PaymentMethod
  card_id?: string | null
  wallet_id?: string | null
  payment_date: string
  note?: string | null
}

export type DebtSummaryStats = {
  totalOutstanding: number
  totalSettled: number
  overdueCount: number
  dueSoonCount: number
  totalCount: number
}
