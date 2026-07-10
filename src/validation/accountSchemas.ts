import { z } from 'zod'

const accountKinds = ['card', 'wallet', 'cash', 'lent'] as const
const cardTypes = ['credit', 'debit', 'savings'] as const
const walletTypes = ['gcash', 'maya', 'grabpay', 'paypal', 'other', 'cash', 'lent'] as const

const moneyValue = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce
    .number({ message: 'Enter an initial balance.' })
    .min(0, 'Balance cannot be negative.'),
)

const lastFourSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}$/.test(value), {
    message: 'Card suffix must be exactly 4 digits.',
  })
  .optional()

const accountDetailsShape = {
  accountIdentifier: z.string().trim().optional(),
  accountType: z.string().trim().min(1, 'Account type is required.'),
  color: z.string().trim().min(1, 'Choose an account color.'),
  kind: z.enum(accountKinds),
  lastFour: lastFourSchema,
  name: z.string().trim().min(1, 'Account name is required.'),
  textColor: z.string().trim().min(1, 'Choose a text color.'),
}

type AccountDetails = {
  accountType: string
  kind: (typeof accountKinds)[number]
}

const validateAccountType = (
  data: AccountDetails,
  context: z.RefinementCtx,
) => {
  const validCardType =
    data.kind === 'wallet' ||
    data.kind === 'cash' ||
    data.kind === 'lent' ||
    cardTypes.includes(data.accountType as (typeof cardTypes)[number])

  if (!validCardType) {
    context.addIssue({
      code: 'custom',
      message: 'Choose a valid card type.',
      path: ['accountType'],
    })
  }

  const validWalletType =
    data.kind === 'card' ||
    walletTypes.includes(data.accountType as (typeof walletTypes)[number])

  if (!validWalletType) {
    context.addIssue({
      code: 'custom',
      message: 'Choose a valid wallet type.',
      path: ['accountType'],
    })
  }

  if (data.kind === 'cash' && data.accountType !== 'cash') {
    context.addIssue({
      code: 'custom',
      message: 'Cash accounts must use the cash type.',
      path: ['accountType'],
    })
  }

  if (data.kind === 'lent' && data.accountType !== 'lent') {
    context.addIssue({
      code: 'custom',
      message: 'Lent accounts must use the lent type.',
      path: ['accountType'],
    })
  }
}

export const accountSchema = z
  .object({
    ...accountDetailsShape,
    balance: moneyValue,
  })
  .superRefine(validateAccountType)

export const accountUpdateSchema = z
  .object(accountDetailsShape)
  .superRefine(validateAccountType)

export const joinAccountSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, 'Enter an invitation code.')
    .regex(/^WING-\d{6}$/, 'Code must be in WING-XXXXXX format (e.g., WING-123456).'),
})


