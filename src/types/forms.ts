import type { z } from 'zod'

import type {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/validation/authSchemas'

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
