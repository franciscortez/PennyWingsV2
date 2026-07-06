export type AccountKind = 'card' | 'wallet' | 'cash'

export type AccountColor = {
  background: string
  label: string
  text: string
  value: string
}

export type Account = {
  accountType: string
  balance: number
  color: string
  createdAt: string
  id: string
  isActive: boolean
  kind: AccountKind
  name: string
  textColor: string
}

export type AccountCreateValues = {
  accountType: string
  balance: number
  color: string
  kind: AccountKind
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
