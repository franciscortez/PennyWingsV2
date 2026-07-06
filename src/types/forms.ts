import type { z } from 'zod'

import type { accountSchema } from '@/validation/accountSchemas'
import type {
  forgotPasswordSchema as forgotPasswordAuthSchema,
  loginSchema as loginAuthSchema,
  registerSchema as registerAuthSchema,
  resetPasswordSchema as resetPasswordAuthSchema,
} from '@/validation/authSchemas'

export type AccountFormValues = z.infer<typeof accountSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordAuthSchema>
export type LoginValues = z.infer<typeof loginAuthSchema>
export type RegisterValues = z.infer<typeof registerAuthSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordAuthSchema>
