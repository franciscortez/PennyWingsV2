import { describe, expect, it } from 'vitest'
import { transactionSchema } from '@/validation/transactionSchemas'

describe('transactionSchema validation', () => {
  const validExpense = {
    amount: 150.5,
    category_id: 'cat-123',
    description: 'Dinner with friends',
    fee_amount: 0,
    payment_method: 'card',
    card_id: 'card-123',
    transaction_date: '2026-08-17',
    type: 'expense',
  }

  it('accepts valid expense transaction with card', () => {
    const result = transactionSchema.safeParse(validExpense)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount).toBe(150.5)
      expect(result.data.fee_amount).toBe(0)
    }
  })

  it('defaults fee_amount to 0 when omitted or empty', () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      fee_amount: undefined,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fee_amount).toBe(0)
    }
  })

  it('rejects non-positive amounts', () => {
    const zeroResult = transactionSchema.safeParse({
      ...validExpense,
      amount: 0,
    })
    expect(zeroResult.success).toBe(false)

    const negativeResult = transactionSchema.safeParse({
      ...validExpense,
      amount: -50,
    })
    expect(negativeResult.success).toBe(false)
  })

  it('rejects negative fee amounts', () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      fee_amount: -5,
    })
    expect(result.success).toBe(false)
  })

  it('requires card_id when payment_method is card', () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      card_id: undefined,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('card_id'))
      expect(issue).toBeDefined()
      expect(issue?.message).toBe('Choose a source card.')
    }
  })

  it('requires wallet_id when payment_method is ewallet', () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      payment_method: 'ewallet',
      card_id: undefined,
      wallet_id: undefined,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('wallet_id'))
      expect(issue?.message).toBe('Choose a source wallet.')
    }
  })

  it('rejects withdrawal with cash payment method', () => {
    const result = transactionSchema.safeParse({
      ...validExpense,
      type: 'withdrawal',
      payment_method: 'cash',
      card_id: undefined,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('payment_method'))
      expect(issue?.message).toBe('Withdrawals must come from a card, e-wallet, or lent account.')
    }
  })

  describe('transfer validations', () => {
    const validTransfer = {
      amount: 500,
      category_id: 'cat-transfer',
      fee_amount: 15,
      payment_method: 'card',
      card_id: 'card-src',
      to_payment_method: 'ewallet',
      to_wallet_id: 'wallet-dest',
      transaction_date: '2026-08-17',
      type: 'transfer',
    }

    it('accepts valid cross-account transfer with fee', () => {
      const result = transactionSchema.safeParse(validTransfer)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.fee_amount).toBe(15)
        expect(result.data.type).toBe('transfer')
      }
    })

    it('rejects transfer between identical cards', () => {
      const result = transactionSchema.safeParse({
        ...validTransfer,
        to_payment_method: 'card',
        to_card_id: 'card-src',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('to_card_id'))
        expect(issue?.message).toBe('Choose a different destination card.')
      }
    })

    it('rejects transfer between identical wallets', () => {
      const result = transactionSchema.safeParse({
        ...validTransfer,
        payment_method: 'ewallet',
        wallet_id: 'wallet-1',
        to_payment_method: 'ewallet',
        to_wallet_id: 'wallet-1',
        card_id: undefined,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('to_wallet_id'))
        expect(issue?.message).toBe('Choose a different destination wallet.')
      }
    })

    it('rejects cash-to-cash transfer', () => {
      const result = transactionSchema.safeParse({
        ...validTransfer,
        payment_method: 'cash',
        to_payment_method: 'cash',
        card_id: undefined,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('to_payment_method'))
        expect(issue?.message).toBe('Choose a different destination account.')
      }
    })
  })
})
