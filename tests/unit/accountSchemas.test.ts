import { describe, expect, it } from 'vitest'
import { accountSchema, joinAccountSchema } from '@/validation/accountSchemas'

describe('accountSchema validation', () => {
  it('accepts valid card account', () => {
    const validCard = {
      name: 'Main BDO',
      kind: 'card',
      accountType: 'debit',
      color: '#1e3a8a',
      textColor: '#ffffff',
      lastFour: '5678',
      balance: 2500,
    }
    const result = accountSchema.safeParse(validCard)
    expect(result.success).toBe(true)
  })

  it('accepts valid wallet account', () => {
    const validWallet = {
      name: 'My GCash',
      kind: 'wallet',
      accountType: 'gcash',
      accountIdentifier: '09123456789',
      color: '#0052cc',
      textColor: '#ffffff',
      balance: 100,
    }
    const result = accountSchema.safeParse(validWallet)
    expect(result.success).toBe(true)
  })

  it('rejects invalid card lastFour format', () => {
    const invalidCard = {
      name: 'Test Card',
      kind: 'card',
      accountType: 'credit',
      color: '#000',
      textColor: '#fff',
      lastFour: '12',
      balance: 0,
    }
    const result = accountSchema.safeParse(invalidCard)
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('lastFour'))
      expect(issue?.message).toBe('Card suffix must be exactly 4 digits.')
    }
  })

  it('rejects negative initial balance', () => {
    const invalidAccount = {
      name: 'Overdrawn',
      kind: 'card',
      accountType: 'debit',
      color: '#000',
      textColor: '#fff',
      balance: -100,
    }
    const result = accountSchema.safeParse(invalidAccount)
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('balance'))
      expect(issue?.message).toBe('Balance cannot be negative.')
    }
  })

  it('enforces cash kind to use cash accountType', () => {
    const invalidCash = {
      name: 'Cash Box',
      kind: 'cash',
      accountType: 'gcash',
      color: '#000',
      textColor: '#fff',
      balance: 50,
    }
    const result = accountSchema.safeParse(invalidCash)
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('accountType'))
      expect(issue?.message).toBe('Cash accounts must use the cash type.')
    }
  })
})

describe('joinAccountSchema validation', () => {
  it('accepts valid WING-XXXXXX code', () => {
    const result = joinAccountSchema.safeParse({ code: 'WING-123456' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('WING-123456')
    }
  })

  it('converts lowercase code to uppercase format', () => {
    const result = joinAccountSchema.safeParse({ code: 'wing-654321' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('WING-654321')
    }
  })

  it('rejects invalid invite code format', () => {
    const result = joinAccountSchema.safeParse({ code: 'INVALID-CODE' })
    expect(result.success).toBe(false)
  })
})
