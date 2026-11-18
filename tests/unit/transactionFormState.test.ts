import { describe, expect, it } from 'vitest'

import {
  applyType,
  type TransactionFormState,
} from '@/sections/transactions/transactionFormState'
import type { Account } from '@/types'

const base: TransactionFormState = {
  amount: '120',
  card_id: '',
  category_id: 'cat-2',
  description: '',
  fee_amount: '0',
  payment_method: 'cash',
  to_card_id: '',
  to_payment_method: 'card',
  to_wallet_id: '',
  transaction_date: '2026-11-18',
  type: 'expense',
  wallet_id: '',
}

const lent = [{ id: 'lent-1' }] as Account[]

describe('applyType', () => {
  it('moves a cash source to a card for a withdrawal and clears the category', () => {
    const next = applyType(base, 'withdrawal', [])
    expect(next.type).toBe('withdrawal')
    expect(next.payment_method).toBe('card')
    expect(next.category_id).toBe('')
    expect(next.amount).toBe('120')
  })

  it('keeps a cash source for income and transfer', () => {
    expect(applyType(base, 'income', []).payment_method).toBe('cash')
    expect(applyType(base, 'transfer', []).payment_method).toBe('cash')
  })

  it('clears destination fields and the fee outside a transfer', () => {
    const transfer = { ...base, type: 'transfer' as const, fee_amount: '15', to_wallet_id: 'wallet-1' }
    const next = applyType(transfer, 'expense', [])
    expect(next.to_wallet_id).toBe('')
    expect(next.fee_amount).toBe('0')
  })

  it('drops a lent wallet when switching to expense', () => {
    const fromLent = { ...base, payment_method: 'lent' as const, wallet_id: 'lent-1', type: 'transfer' as const }
    const next = applyType(fromLent, 'expense', lent)
    expect(next.payment_method).toBe('ewallet')
    expect(next.wallet_id).toBe('')
  })
})
