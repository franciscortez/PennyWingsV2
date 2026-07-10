import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'
import { AppError } from '@/lib/errors'
import type {
  Account,
  AccountCreateValues,
  AccountKind,
  AccountsData,
  AccountUpdateValues,
} from '@/types'

type CardRow = Pick<
  Tables<'bank_cards'>,
  | 'balance'
  | 'card_name'
  | 'card_type'
  | 'color'
  | 'created_at'
  | 'id'
  | 'is_active'
  | 'last_four'
  | 'text_color'
  | 'user_id'
>

type WalletRow = Pick<
  Tables<'e_wallets'>,
  | 'account_identifier'
  | 'balance'
  | 'color'
  | 'created_at'
  | 'id'
  | 'is_active'
  | 'text_color'
  | 'user_id'
  | 'wallet_name'
  | 'wallet_type'
>

type MembershipRow = Pick<
  Tables<'account_memberships'>,
  'resource_id' | 'resource_type' | 'role'
>

export const emptyAccountsData: AccountsData = {
  accounts: [],
  cardCount: 0,
  cashCount: 0,
  lentCount: 0,
  totalBalance: 0,
  walletCount: 0,
}

const toNumber = (value: unknown) => Number(value ?? 0)

const getAccess = (
  ownerId: string,
  userId: string,
  membershipRole?: string,
) => {
  const accessRole =
    ownerId === userId
      ? 'owner'
      : membershipRole === 'transactor'
        ? 'transactor'
        : 'viewer'

  return {
    accessRole,
    canManage: accessRole === 'owner',
    canTransact: accessRole === 'owner' || accessRole === 'transactor',
  } as const
}

const mapCardAccount = (
  card: CardRow,
  userId: string,
  membershipRole?: string,
): Account => ({
  ...getAccess(card.user_id, userId, membershipRole),
  accountType: card.card_type,
  balance: toNumber(card.balance),
  color: card.color ?? '#ec4899',
  createdAt: card.created_at,
  id: card.id,
  isActive: card.is_active !== false,
  kind: 'card',
  lastFour: card.last_four ?? undefined,
  name: card.card_name,
  textColor: card.text_color ?? '#ffffff',
  userId: card.user_id,
})

const mapWalletAccount = (
  wallet: WalletRow,
  userId: string,
  membershipRole?: string,
): Account => ({
  ...getAccess(wallet.user_id, userId, membershipRole),
  accountIdentifier: wallet.account_identifier ?? undefined,
  accountType: wallet.wallet_type,
  balance: toNumber(wallet.balance),
  color: wallet.color ?? '#ec4899',
  createdAt: wallet.created_at,
  id: wallet.id,
  isActive: wallet.is_active !== false,
  kind:
    wallet.wallet_type === 'cash'
      ? 'cash'
      : wallet.wallet_type === 'lent'
        ? 'lent'
        : 'wallet',
  name: wallet.wallet_name,
  textColor: wallet.text_color ?? '#ffffff',
  userId: wallet.user_id,
})

export const fetchAccounts = async (userId: string): Promise<AccountsData> => {
  if (!userId) {
    return emptyAccountsData
  }
  /* RLS returns both owned and member accounts automatically. */
  const [cardsResult, walletsResult, membershipsResult] = await Promise.all([
    supabase
      .from('bank_cards')
      .select(
        'id, card_name, card_type, balance, color, text_color, last_four, is_active, created_at, user_id',
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('e_wallets')
      .select(
        'id, wallet_name, wallet_type, balance, color, text_color, account_identifier, is_active, created_at, user_id',
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('account_memberships')
      .select('resource_type, resource_id, role')
      .eq('user_id', userId),
  ])

  const firstError =
    cardsResult.error ?? walletsResult.error ?? membershipsResult.error

  if (firstError) {
    throw firstError
  }

  const cards: CardRow[] = cardsResult.data ?? []
  const wallets: WalletRow[] = walletsResult.data ?? []
  const memberships: MembershipRow[] = membershipsResult.data ?? []
  const membershipRoles = new Map(
    memberships.map((membership) => [
      `${membership.resource_type}:${membership.resource_id}`,
      membership.role,
    ]),
  )
  const walletAccounts = wallets.map((wallet) =>
    mapWalletAccount(
      wallet,
      userId,
      membershipRoles.get(`e_wallet:${wallet.id}`),
    ),
  )
  const accounts = [
    ...cards.map((card) =>
      mapCardAccount(
        card,
        userId,
        membershipRoles.get(`bank_card:${card.id}`),
      ),
    ),
    ...walletAccounts,
  ].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )

  return {
    accounts,
    cardCount: cards.length,
    cashCount: walletAccounts.filter((account) => account.kind === 'cash').length,
    lentCount: walletAccounts.filter((account) => account.kind === 'lent').length,
    totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    walletCount: walletAccounts.filter((account) => account.kind === 'wallet').length,
  }
}

export const fetchArchivedAccounts = async (
  userId: string,
): Promise<AccountsData> => {
  if (!userId) {
    return emptyAccountsData
  }

  const [cardsResult, walletsResult] = await Promise.all([
    supabase
      .from('bank_cards')
      .select(
        'id, card_name, card_type, balance, color, text_color, last_four, is_active, created_at, user_id',
      )
      .eq('user_id', userId)
      .eq('is_active', false)
      .order('updated_at', { ascending: false }),
    supabase
      .from('e_wallets')
      .select(
        'id, wallet_name, wallet_type, balance, color, text_color, account_identifier, is_active, created_at, user_id',
      )
      .eq('user_id', userId)
      .eq('is_active', false)
      .order('updated_at', { ascending: false }),
  ])

  const firstError = cardsResult.error ?? walletsResult.error

  if (firstError) {
    throw firstError
  }

  const cards: CardRow[] = cardsResult.data ?? []
  const wallets: WalletRow[] = walletsResult.data ?? []
  const walletAccounts = wallets.map((wallet) =>
    mapWalletAccount(wallet, userId),
  )
  const accounts = [
    ...cards.map((card) => mapCardAccount(card, userId)),
    ...walletAccounts,
  ]

  return {
    accounts,
    cardCount: cards.length,
    cashCount: walletAccounts.filter((account) => account.kind === 'cash').length,
    lentCount: walletAccounts.filter((account) => account.kind === 'lent').length,
    totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    walletCount: walletAccounts.filter((account) => account.kind === 'wallet').length,
  }
}

export const createCardAccount = async (
  userId: string,
  values: AccountCreateValues,
) => {
  const { error } = await supabase.from('bank_cards').insert({
    balance: values.balance,
    card_name: values.name,
    card_type: values.accountType,
    color: values.color,
    is_active: true,
    last_four: values.lastFour || null,
    text_color: values.textColor,
    user_id: userId,
  })

  if (error) throw AppError.from(error)
}

export const createWalletAccount = async (
  userId: string,
  values: AccountCreateValues,
) => {
  const { error } = await supabase.from('e_wallets').insert({
    account_identifier: values.accountIdentifier || null,
    balance: values.balance,
    color: values.color,
    is_active: true,
    text_color: values.textColor,
    user_id: userId,
    wallet_name: values.name,
    wallet_type: values.accountType,
  })

  if (error) throw AppError.from(error)
}

export const createAccount = async (
  userId: string,
  values: AccountCreateValues,
) => {
  await (values.kind === 'card'
    ? createCardAccount(userId, values)
    : createWalletAccount(userId, values))
}

export const updateAccount = async (
  userId: string,
  accountId: string,
  values: AccountUpdateValues,
) => {
  const updatedAt = new Date().toISOString()

  if (values.kind === 'card') {
    const { error } = await supabase
      .from('bank_cards')
      .update({
        card_name: values.name,
        card_type: values.accountType,
        color: values.color,
        last_four: values.lastFour || null,
        text_color: values.textColor,
        updated_at: updatedAt,
      })
      .eq('id', accountId)
      .eq('user_id', userId)

    if (error) throw AppError.from(error)
    return
  }

  const { error } = await supabase
    .from('e_wallets')
    .update({
      account_identifier: values.accountIdentifier || null,
      color: values.color,
      text_color: values.textColor,
      updated_at: updatedAt,
      wallet_name: values.name,
      wallet_type: values.accountType,
    })
    .eq('id', accountId)
    .eq('user_id', userId)

  if (error) throw AppError.from(error)
}

export const archiveAccount = async (
  userId: string,
  accountId: string,
  kind: AccountKind,
) => {
  const updatedAt = new Date().toISOString()

  if (kind === 'card') {
    const { error } = await supabase
      .from('bank_cards')
      .update({ is_active: false, updated_at: updatedAt })
      .eq('id', accountId)
      .eq('user_id', userId)

    if (error) throw AppError.from(error)
    return
  }

  const { error } = await supabase
    .from('e_wallets')
    .update({ is_active: false, updated_at: updatedAt })
    .eq('id', accountId)
    .eq('user_id', userId)

  if (error) throw AppError.from(error)
}

export const restoreAccount = async (
  userId: string,
  accountId: string,
  kind: AccountKind,
) => {
  const updatedAt = new Date().toISOString()

  if (kind === 'card') {
    const { error } = await supabase
      .from('bank_cards')
      .update({ is_active: true, updated_at: updatedAt })
      .eq('id', accountId)
      .eq('user_id', userId)

    if (error) throw AppError.from(error)
    return
  }

  const { error } = await supabase
    .from('e_wallets')
    .update({ is_active: true, updated_at: updatedAt })
    .eq('id', accountId)
    .eq('user_id', userId)

  if (error) throw AppError.from(error)
}

export const deleteArchivedAccount = async (
  userId: string,
  accountId: string,
  kind: AccountKind,
) => {
  const resourceType = kind === 'card' ? 'bank_card' : 'e_wallet'

  const [membershipsResult, invitesResult] = await Promise.all([
    supabase
      .from('account_memberships')
      .delete()
      .eq('resource_type', resourceType)
      .eq('resource_id', accountId),
    supabase
      .from('joint_account_invites')
      .delete()
      .eq('resource_type', resourceType)
      .eq('resource_id', accountId)
      .eq('owner_id', userId),
  ])

  const cleanupError = membershipsResult.error ?? invitesResult.error

  if (cleanupError) {
    throw AppError.from(cleanupError)
  }

  if (kind === 'card') {
    const { error } = await supabase
      .from('bank_cards')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId)
      .eq('is_active', false)

    if (error) throw AppError.from(error)
    return
  }

  const { error } = await supabase
    .from('e_wallets')
    .delete()
    .eq('id', accountId)
    .eq('user_id', userId)
    .eq('is_active', false)

  if (error) throw AppError.from(error)
}

