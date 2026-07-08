import { z } from 'zod'

const budgetPeriods = ['weekly', 'monthly', 'yearly'] as const

const moneyValue = (fieldLabel: string) =>
  z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce
      .number({ message: `Enter ${fieldLabel}.` })
      .positive(`${fieldLabel} must be greater than zero.`),
  )

const optionalMoneyValue = z.preprocess(
  (value) => (value === '' ? 0 : value),
  z.coerce.number().min(0, 'Saved amount cannot be negative.'),
)

export const budgetSchema = z.object({
  categoryId: z.string().trim().min(1, 'Choose a category.'),
  limitAmount: moneyValue('a budget limit'),
  period: z.enum(budgetPeriods),
})

export const goalSchema = z
  .object({
    currentAmount: optionalMoneyValue,
    linkedCardId: z.string().nullable(),
    linkedWalletId: z.string().nullable(),
    name: z.string().trim().min(1, 'Goal name is required.'),
    targetAmount: moneyValue('a target amount'),
    targetDate: z.string().trim().nullable(),
  })
  .refine((data) => data.currentAmount <= data.targetAmount, {
    message: 'Saved amount cannot be greater than the target.',
    path: ['currentAmount'],
  })
  .refine((data) => !(data.linkedCardId && data.linkedWalletId), {
    message: 'Choose only one linked account.',
    path: ['linkedCardId'],
  })
