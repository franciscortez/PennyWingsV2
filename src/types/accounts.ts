export type AccountKind = 'card' | 'wallet' | 'cash'

export type AccountColor = {
  background: string
  label: string
  text: string
  value: string
}

export type Account = {
  accountIdentifier?: string
  accountType: string
  balance: number
  color: string
  createdAt: string
  id: string
  isActive: boolean
  kind: AccountKind
  lastFour?: string
  name: string
  textColor: string
}

export type AccountCreateValues = {
  accountIdentifier?: string
  accountType: string
  balance: number
  color: string
  kind: AccountKind
  lastFour?: string
  name: string
  textColor: string
}

export type AccountUpdateValues = {
  accountIdentifier?: string
  accountType: string
  balance: number
  color: string
  kind: AccountKind
  lastFour?: string
  name: string
  textColor: string
}

export type AccountsData = {
  accounts: Account[]
  cardCount: number
  cashCount: number
  totalBalance: number
  walletCount: number
}

