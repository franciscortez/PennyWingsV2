import type { Account, TransactionFormValues, TransactionType } from '@/types'

/** Form-side values: money fields stay strings until the schema parses them. */
export type TransactionFormState = Omit<TransactionFormValues, 'amount' | 'fee_amount'> & {
  amount: string
  fee_amount: string
}

/**
 * Switching type keeps what still applies and clears what does not: the
 * category (income and expense lists differ), destination fields outside a
 * transfer, a fee typed for another type, a cash source for a withdrawal and a
 * lent wallet outside transfer or withdrawal.
 */
export const applyType = (
  current: TransactionFormState,
  type: TransactionType,
  lentAccounts: Account[],
): TransactionFormState => ({
  ...current,
  card_id: current.payment_method === 'card' ? current.card_id : '',
  category_id: '',
  fee_amount: type === current.type ? current.fee_amount : '0',
  payment_method:
    type === 'withdrawal' && current.payment_method === 'cash'
      ? 'card'
      : type !== 'transfer' &&
          type !== 'withdrawal' &&
          current.payment_method === 'lent'
        ? 'ewallet'
        : current.payment_method,
  to_card_id: type === 'transfer' ? current.to_card_id : '',
  to_wallet_id: type === 'transfer' ? current.to_wallet_id : '',
  type,
  wallet_id:
    (current.payment_method === 'ewallet' ||
      current.payment_method === 'lent') &&
    (type === 'transfer' ||
      type === 'withdrawal' ||
      (current.payment_method === 'ewallet' &&
        !lentAccounts.some((account) => account.id === current.wallet_id)))
      ? current.wallet_id
      : '',
})
