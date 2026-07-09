import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'
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
  | 'wallet_name'
  | 'wallet_type'
>

export const emptyAccountsData: AccountsData = {
  accounts: [],
  cardCount: 0,
  cashCount: 0,
  totalBalance: 0,
  walletCount: 0,
}

const toNumber = (value: unknown) => Number(value ?? 0)

const mapCardAccount = (card: CardRow): Account => ({
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
})

const mapWalletAccount = (wallet: WalletRow): Account => ({
  accountIdentifier: wallet.account_identifier ?? undefined,
  accountType: wallet.wallet_type,
  balance: toNumber(wallet.balance),
  color: wallet.color ?? '#ec4899',
  createdAt: wallet.created_at,
  id: wallet.id,
  isActive: wallet.is_active !== false,
  kind: wallet.wallet_type === 'cash' ? 'cash' : 'wallet',
  name: wallet.wallet_name,
  textColor: wallet.text_color ?? '#ffffff',
})

export const fetchAccounts = async (userId: string): Promise<AccountsData> => {
  const [cardsResult, walletsResult] = await Promise.all([
    supabase
      .from('bank_cards')
      .select(
        'id, card_name, card_type, balance, color, text_color, last_four, is_active, created_at',
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('e_wallets')
      .select(
        'id, wallet_name, wallet_type, balance, color, text_color, account_identifier, is_active, created_at',
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  const firstError = cardsResult.error ?? walletsResult.error

  if (firstError) {
    throw firstError
  }

  const cards: CardRow[] = cardsResult.data ?? []
  const wallets: WalletRow[] = walletsResult.data ?? []
  const walletAccounts = wallets.map(mapWalletAccount)
  const accounts = [
    ...cards.map(mapCardAccount),
    ...walletAccounts,
  ].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )

  return {
    accounts,
    cardCount: cards.length,
    cashCount: walletAccounts.filter((account) => account.kind === 'cash').length,
    totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    walletCount: walletAccounts.filter((account) => account.kind === 'wallet').length,
  }
}

export const createCardAccount = async (
  userId: string,
  values: AccountCreateValues,
) =>
  supabase.from('bank_cards').insert({
    balance: values.balance,
    card_name: values.name,
    card_type: values.accountType,
    color: values.color,
    is_active: true,
    last_four: values.lastFour || null,
    text_color: values.textColor,
    user_id: userId,
  })

export const createWalletAccount = async (
  userId: string,
  values: AccountCreateValues,
) =>
  supabase.from('e_wallets').insert({
    account_identifier: values.accountIdentifier || null,
    balance: values.balance,
    color: values.color,
    is_active: true,
    text_color: values.textColor,
    user_id: userId,
    wallet_name: values.name,
    wallet_type: values.accountType,
  })

export const createAccount = async (
  userId: string,
  values: AccountCreateValues,
) =>
  values.kind === 'card'
    ? createCardAccount(userId, values)
    : createWalletAccount(userId, values)

export const updateAccount = async (
  userId: string,
  accountId: string,
  values: AccountUpdateValues,
) => {
  const updatedAt = new Date().toISOString()

  if (values.kind === 'card') {
    return supabase
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
  }

  return supabase
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
}

export const archiveAccount = async (
  userId: string,
  accountId: string,
  kind: AccountKind,
) => {
  const updatedAt = new Date().toISOString()

  if (kind === 'card') {
    return supabase
      .from('bank_cards')
      .update({ is_active: false, updated_at: updatedAt })
      .eq('id', accountId)
      .eq('user_id', userId)
  }

  return supabase
    .from('e_wallets')
    .update({ is_active: false, updated_at: updatedAt })
    .eq('id', accountId)
    .eq('user_id', userId)
}

