import { z } from 'zod'

const accountKinds = ['card', 'wallet', 'cash'] as const
const cardTypes = ['credit', 'debit', 'savings'] as const
const walletTypes = ['gcash', 'maya', 'grabpay', 'paypal', 'other', 'cash'] as const

const moneyValue = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce
    .number({ message: 'Enter an initial balance.' })
    .min(0, 'Balance cannot be negative.'),
)

export const accountSchema = z
  .object({
    accountType: z.string().trim().min(1, 'Account type is required.'),
    balance: moneyValue,
    color: z.string().trim().min(1, 'Choose an account color.'),
    kind: z.enum(accountKinds),
    name: z.string().trim().min(1, 'Account name is required.'),
    textColor: z.string().trim().min(1, 'Choose a text color.'),
  })
  .refine(
    (data) =>
      data.kind === 'wallet' ||
      data.kind === 'cash' ||
      cardTypes.includes(data.accountType as (typeof cardTypes)[number]),
    {
      message: 'Choose a valid card type.',
      path: ['accountType'],
    },
  )
  .refine(
    (data) =>
      data.kind === 'card' ||
      walletTypes.includes(data.accountType as (typeof walletTypes)[number]),
    {
      message: 'Choose a valid wallet type.',
      path: ['accountType'],
    },
  )
  .refine((data) => data.kind !== 'cash' || data.accountType === 'cash', {
    message: 'Cash accounts must use the cash type.',
    path: ['accountType'],
  })
