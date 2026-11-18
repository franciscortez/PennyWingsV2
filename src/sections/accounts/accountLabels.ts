import type { Account } from '@/types'

export const formatAccountType = (value: string) =>
  value
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export const getAccountSubtitle = (account: Account) => {
  if (account.kind === 'cash') {
    return 'Cash on hand'
  }

  if (account.kind === 'lent') {
    return 'Money lent out'
  }

  if (account.lastFour) {
    return `**** **** **** ${account.lastFour}`
  }

  return account.accountIdentifier ?? formatAccountType(account.accountType)
}

/** Short kind line for pickers and summaries: "Debit card", "E-wallet", "Cash". */
export const getAccountKindLabel = (account: Account) => {
  if (account.kind === 'cash') return 'Cash'
  if (account.kind === 'lent') return 'Lent'
  if (account.kind === 'wallet') return 'E-wallet'
  return `${formatAccountType(account.accountType)} card`
}
