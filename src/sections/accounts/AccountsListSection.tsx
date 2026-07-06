import { CreditCard, Landmark, Wallet } from 'lucide-react'

import { AccountCardChip } from '@/sections/accounts'
import type { Account, AccountKind } from '@/types'

type AccountsListSectionProps = {
  accounts: Account[]
  emptyDescription: string
  emptyTitle: string
  loading: boolean
  variant: AccountKind | 'all'
}

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const formatAccountType = (value: string) =>
  value
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export function AccountsListSection({
  accounts,
  emptyDescription,
  emptyTitle,
  loading,
  variant,
}: AccountsListSectionProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="space-y-4 rounded-[2rem] border border-pink-50 bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-pink-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-pink-100" />
                <div className="h-3 w-1/3 animate-pulse rounded-full bg-pink-100" />
              </div>
            </div>
            <div className="h-8 w-1/2 animate-pulse rounded-full bg-pink-100" />
            <div className="h-3 w-full animate-pulse rounded-full bg-pink-100" />
          </div>
        ))}
      </div>
    )
  }

  if (!accounts.length) {
    const EmptyIcon =
      variant === 'card' ? CreditCard : variant === 'cash' ? Landmark : Wallet

    return (
      <div className="animate-fade-in rounded-[3rem] border-2 border-dashed border-pink-100 bg-pink-50/30 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-pink-100">
          <EmptyIcon className="h-10 w-10 text-pink-600" aria-hidden="true" />
        </div>
        <p className="mb-2 text-lg font-black uppercase tracking-widest text-gray-400">
          {emptyTitle}
        </p>
        <p className="text-sm text-gray-400">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <AccountTile key={`${account.kind}-${account.id}`} account={account} />
      ))}
    </div>
  )
}

function AccountTile({ account }: { account: Account }) {
  if (account.kind === 'card') {
    return <BankCardTile account={account} />
  }

  return <WalletTile account={account} />
}

function BankCardTile({ account }: { account: Account }) {
  const bgColor = account.color || '#F472B6'

  return (
    <article className="animate-fade-in relative flex flex-col overflow-hidden rounded-[2.5rem] border border-pink-50 bg-white p-6 transition-all duration-300 sm:hover:-translate-y-2">
      <div
        className="relative mb-4 h-48 cursor-pointer overflow-hidden rounded-[2rem] p-6 transition-transform duration-300 sm:hover:scale-[1.02]"
        style={{
          background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`,
          color: account.textColor || '#ffffff',
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-5 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute right-6 top-4 opacity-30">
          <Landmark className="h-10 w-10" aria-hidden="true" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                {account.accountType === 'credit' ? 'Premium Credit' : 'Bank Debit'}
              </p>
              <h3 className="max-w-[150px] truncate text-xl font-bold tracking-tight">
                {account.name}
              </h3>
            </div>
            <AccountCardChip className="mt-1 h-8 w-10" />
          </div>

          <div className="mt-auto">
            <p className="mb-2 text-sm font-mono uppercase tracking-[0.3em] opacity-80">
              {formatAccountType(account.accountType)}
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-70">
                  Balance
                </p>
                <p className="text-2xl font-black tracking-tight">
                  {currency.format(account.balance)}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <CreditCard className="mb-1 h-8 w-8 opacity-20" aria-hidden="true" />
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                  VISA / MC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end px-2">
        <div
          className="h-2.5 w-2.5 animate-pulse rounded-full"
          style={{ backgroundColor: account.isActive ? '#10B981' : '#EF4444' }}
        />
      </div>
    </article>
  )
}

function WalletTile({ account }: { account: Account }) {
  const bgColor = account.color || '#FFB6C1'
  const Icon = account.kind === 'cash' ? Landmark : Wallet

  return (
    <article className="animate-fade-in relative overflow-hidden rounded-[2.5rem] border border-pink-50 bg-white p-6 transition-all duration-300 sm:hover:-translate-y-2">
      <div
        className="relative mb-4 h-48 cursor-pointer overflow-hidden rounded-[2rem] p-6 transition-transform duration-300 sm:hover:scale-[1.02]"
        style={{
          background: `linear-gradient(135deg, ${bgColor}, ${bgColor}DD)`,
          color: account.textColor || '#ffffff',
        }}
      >
        <div className="absolute right-[-10%] top-[-20%] h-40 w-40 animate-pulse rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                {account.kind === 'cash' ? 'cash' : account.accountType}
              </p>
              <h3 className="truncate text-xl font-bold tracking-tight">
                {account.name}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/20 p-2 backdrop-blur-md transition-transform duration-300 sm:hover:-rotate-12">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-auto">
            <p className="mb-2 max-w-[150px] truncate text-xs font-medium opacity-80">
              {account.kind === 'cash' ? 'On hand' : formatAccountType(account.accountType)}
            </p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase opacity-70">
                  Balance
                </p>
                <p className="text-2xl font-black tracking-tight">
                  {currency.format(account.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end px-2">
        <div
          className="h-2 w-2 animate-pulse rounded-full"
          style={{ backgroundColor: account.isActive ? '#10B981' : '#EF4444' }}
        />
      </div>
    </article>
  )
}
