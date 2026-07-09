import { z } from 'zod'

export const profileDetailsSchema = z.object({
  fullName: z.string().trim().min(1, 'Display name is required.'),
  avatarUrl: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().url().safeParse(value).success, {
      message: 'Enter a valid image URL.',
    })
    .optional(),
})

export const changePasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirm: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })

export const deleteAccountFormSchema = z.object({
  password: z.string().min(1, 'Enter your password to verify.'),
})
