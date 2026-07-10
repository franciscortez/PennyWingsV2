export type AccountKind = 'card' | 'wallet' | 'cash' | 'lent'

export type ResourceType = 'bank_card' | 'e_wallet'

export type AccountMemberRole = 'viewer' | 'transactor'

export type AccountAccessRole = 'owner' | AccountMemberRole

export type AccountColor = {
  background: string
  label: string
  text: string
  value: string
}

export type Account = {
  accessRole: AccountAccessRole
  accountIdentifier?: string
  accountType: string
  balance: number
  canManage: boolean
  canTransact: boolean
  color: string
  createdAt: string
  id: string
  isActive: boolean
  kind: AccountKind
  lastFour?: string
  name: string
  textColor: string
  userId: string
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

export type AccountUpdateValues = Omit<AccountCreateValues, 'balance'>

export type AccountsData = {
  accounts: Account[]
  cardCount: number
  cashCount: number
  lentCount: number
  totalBalance: number
  walletCount: number
}

export type AccountMember = {
  fullName: string | null
  id: string
  invitedBy: string
  joinedAt: string
  resourceId: string
  resourceType: ResourceType
  role: AccountMemberRole
  userId: string
}

export type AccountInvite = {
  acceptedAt: string | null
  acceptedBy: string | null
  createdAt: string
  expiresAt: string
  id: string
  ownerId: string
  resourceId: string
  resourceType: ResourceType
  role: AccountMemberRole
  revokedAt: string | null
}

