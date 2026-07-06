import { supabase } from '@/lib/supabase'
import type { Account, AccountCreateValues, AccountsData } from '@/types'

type CardRow = {
  balance: number | string | null
  card_name: string
  card_type: string
  color: string | null
  created_at: string
  id: string
  is_active: boolean | null
  text_color: string | null
}

type WalletRow = {
  balance: number | string | null
  color: string | null
  created_at: string
  id: string
  is_active: boolean | null
  text_color: string | null
  wallet_name: string
  wallet_type: string
}

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
  name: card.card_name,
  textColor: card.text_color ?? '#ffffff',
})

const mapWalletAccount = (wallet: WalletRow): Account => ({
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
        'id, card_name, card_type, balance, color, text_color, is_active, created_at',
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('e_wallets')
      .select(
        'id, wallet_name, wallet_type, balance, color, text_color, is_active, created_at',
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  const firstError = cardsResult.error ?? walletsResult.error

  if (firstError) {
    throw firstError
  }

  const cards = (cardsResult.data ?? []) as CardRow[]
  const wallets = (walletsResult.data ?? []) as WalletRow[]
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
    text_color: values.textColor,
    user_id: userId,
  })

export const createWalletAccount = async (
  userId: string,
  values: AccountCreateValues,
) =>
  supabase.from('e_wallets').insert({
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
