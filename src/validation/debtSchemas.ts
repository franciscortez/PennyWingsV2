import { z } from 'zod'

export const debtTypeSchema = z.enum([
  'bnpl',
  'credit_card',
  'personal_loan',
  'other',
])

export const debtCreateSchema = z.object({
  provider_name: z
    .string()
    .trim()
    .min(1, 'Provider name is required.')
    .max(100, 'Provider name is too long.'),
  debt_type: debtTypeSchema,
  original_amount: z
    .number({ message: 'Enter a valid amount.' })
    .positive('Amount must be greater than zero.'),
  due_date: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
  note: z
    .string()
    .trim()
    .max(500, 'Note is too long.')
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
})

export const debtUpdateSchema = z.object({
  provider_name: z
    .string()
    .trim()
    .min(1, 'Provider name is required.')
    .max(100, 'Provider name is too long.'),
  debt_type: debtTypeSchema,
  due_date: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
  note: z
    .string()
    .trim()
    .max(500, 'Note is too long.')
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
})

export const debtPaySchema = z
  .object({
    amount: z
      .number({ message: 'Enter a valid payment amount.' })
      .positive('Payment amount must be greater than zero.'),
    payment_method: z.enum(['cash', 'card', 'ewallet'], {
      message: 'Choose a valid payment method.',
    }),
    card_id: z.string().trim().optional().nullable(),
    wallet_id: z.string().trim().optional().nullable(),
    payment_date: z.string().trim().min(1, 'Payment date is required.'),
    note: z
      .string()
      .trim()
      .max(500, 'Note is too long.')
      .optional()
      .nullable()
      .transform((val) => (val ? val : null)),
  })
  .superRefine((data, ctx) => {
    if (data.payment_method === 'card') {
      if (!data.card_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'Choose a bank card to pay from.',
          path: ['card_id'],
        })
      }
      if (data.wallet_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'Choose only one source account.',
          path: ['wallet_id'],
        })
      }
    } else {
      if (!data.wallet_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'Choose an e-wallet or cash account to pay from.',
          path: ['wallet_id'],
        })
      }
      if (data.card_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'Choose only one source account.',
          path: ['card_id'],
        })
      }
    }
  })
