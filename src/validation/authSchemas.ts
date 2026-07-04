import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export const registerSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirm: z.string().min(1, 'Please confirm your password.'),
    acceptedTerms: z.boolean().refine((value) => value, {
      message: 'Please accept the Terms and Agreement.',
    }),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirm: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })
