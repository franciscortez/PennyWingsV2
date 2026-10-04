import { describe, expect, it } from 'vitest'
import {
  debtCreateSchema,
  debtPaySchema,
  debtUpdateSchema,
} from '@/validation/debtSchemas'

describe('debtSchemas', () => {
  describe('debtCreateSchema', () => {
    it('accepts valid debt creation data', () => {
      const result = debtCreateSchema.safeParse({
        provider_name: 'Atome',
        debt_type: 'bnpl',
        original_amount: 15000,
        due_date: '2026-10-31',
        note: 'Gadget installment',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.provider_name).toBe('Atome')
        expect(result.data.debt_type).toBe('bnpl')
        expect(result.data.original_amount).toBe(15000)
        expect(result.data.due_date).toBe('2026-10-31')
      }
    })

    it('rejects empty provider name', () => {
      const result = debtCreateSchema.safeParse({
        provider_name: '   ',
        debt_type: 'credit_card',
        original_amount: 5000,
      })

      expect(result.success).toBe(false)
    })

    it('rejects non-positive amount', () => {
      const result = debtCreateSchema.safeParse({
        provider_name: 'BDO',
        debt_type: 'credit_card',
        original_amount: 0,
      })

      expect(result.success).toBe(false)
    })

    it('rejects invalid debt type', () => {
      const result = debtCreateSchema.safeParse({
        provider_name: 'BDO',
        debt_type: 'mortgage',
        original_amount: 1000,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('debtUpdateSchema', () => {
    it('accepts valid update data', () => {
      const result = debtUpdateSchema.safeParse({
        provider_name: 'Updated Provider',
        debt_type: 'personal_loan',
        due_date: null,
        note: 'Updated note',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('debtPaySchema', () => {
    it('accepts valid card repayment', () => {
      const result = debtPaySchema.safeParse({
        amount: 2500,
        payment_method: 'card',
        card_id: 'card-123',
        wallet_id: null,
        payment_date: '2026-10-05',
        note: 'Partial pay',
      })

      expect(result.success).toBe(true)
    })

    it('accepts valid ewallet repayment', () => {
      const result = debtPaySchema.safeParse({
        amount: 1000,
        payment_method: 'ewallet',
        card_id: null,
        wallet_id: 'wallet-123',
        payment_date: '2026-10-05',
      })

      expect(result.success).toBe(true)
    })

    it('rejects payment with card payment_method but wallet_id', () => {
      const result = debtPaySchema.safeParse({
        amount: 1000,
        payment_method: 'card',
        card_id: null,
        wallet_id: 'wallet-123',
        payment_date: '2026-10-05',
      })

      expect(result.success).toBe(false)
    })

    it('rejects zero or negative payment amount', () => {
      const result = debtPaySchema.safeParse({
        amount: -50,
        payment_method: 'cash',
        card_id: null,
        wallet_id: 'wallet-cash',
        payment_date: '2026-10-05',
      })

      expect(result.success).toBe(false)
    })
  })
})
