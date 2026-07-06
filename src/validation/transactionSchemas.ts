import { z } from 'zod'

const transactionTypes = ['income', 'expense', 'withdrawal', 'transfer'] as const
const paymentMethods = ['cash', 'card', 'ewallet'] as const
const destinationPaymentMethods = ['card', 'ewallet'] as const

const optionalId = z.string().optional()

const moneyValue = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce
    .number({ message: 'Enter an amount.' })
    .positive('Amount must be greater than zero.'),
)

export const transactionSchema = z
  .object({
    amount: moneyValue,
    card_id: optionalId,
    category_id: z.string().trim().min(1, 'Choose a category.'),
    description: z.string().trim().optional(),
    payment_method: z.enum(paymentMethods),
    to_card_id: optionalId,
    to_payment_method: z.enum(destinationPaymentMethods).optional(),
    to_wallet_id: optionalId,
    transaction_date: z.string().trim().min(1, 'Choose a date.'),
    type: z.enum(transactionTypes),
    wallet_id: optionalId,
  })
  .superRefine((data, context) => {
    if (data.type === 'withdrawal' && data.payment_method === 'cash') {
      context.addIssue({
        code: 'custom',
        message: 'Withdrawals must come from a card or e-wallet.',
        path: ['payment_method'],
      })
    }

    if (data.payment_method === 'card' && !data.card_id) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a source card.',
        path: ['card_id'],
      })
    }

    if (data.payment_method === 'ewallet' && !data.wallet_id) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a source wallet.',
        path: ['wallet_id'],
      })
    }

    if (data.type !== 'transfer') {
      return
    }

    if (data.to_payment_method === 'card' && !data.to_card_id) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a destination card.',
        path: ['to_card_id'],
      })
    }

    if (data.to_payment_method === 'ewallet' && !data.to_wallet_id) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a destination wallet.',
        path: ['to_wallet_id'],
      })
    }

    if (
      data.payment_method === 'card' &&
      data.to_payment_method === 'card' &&
      data.card_id &&
      data.card_id === data.to_card_id
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a different destination card.',
        path: ['to_card_id'],
      })
    }

    if (
      data.payment_method === 'ewallet' &&
      data.to_payment_method === 'ewallet' &&
      data.wallet_id &&
      data.wallet_id === data.to_wallet_id
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Choose a different destination wallet.',
        path: ['to_wallet_id'],
      })
    }
  })

