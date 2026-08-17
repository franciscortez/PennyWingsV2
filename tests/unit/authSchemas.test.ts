import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema, resetPasswordSchema } from '@/validation/authSchemas'

describe('authSchemas validation', () => {
  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'secretPassword123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'secretPassword123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Enter a valid email address.')
      }
    })
  })

  describe('registerSchema', () => {
    it('accepts matching passwords and accepted terms', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'secretPassword123',
        confirm: 'secretPassword123',
        acceptedTerms: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'passwordA',
        confirm: 'passwordB',
        acceptedTerms: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('confirm'))
        expect(issue?.message).toBe('Passwords do not match.')
      }
    })

    it('rejects when terms not accepted', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'passwordA',
        confirm: 'passwordA',
        acceptedTerms: false,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('acceptedTerms'))
        expect(issue?.message).toBe('Please accept the Terms and Agreement.')
      }
    })

    it('rejects passwords shorter than 6 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: '123',
        confirm: '123',
        acceptedTerms: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    it('enforces password confirmation matching', () => {
      const mismatched = resetPasswordSchema.safeParse({
        password: 'newPassword1',
        confirm: 'differentPassword',
      })
      expect(mismatched.success).toBe(false)

      const matched = resetPasswordSchema.safeParse({
        password: 'newPassword1',
        confirm: 'newPassword1',
      })
      expect(matched.success).toBe(true)
    })
  })
})
