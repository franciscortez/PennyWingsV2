import {
  FaBuildingColumns,
  FaHandHoldingDollar,
  FaMoneyBillWave,
  FaPencil,
  FaShareNodes,
  FaTrashCan,
  FaUser,
  FaUsers,
  FaWallet,
} from 'react-icons/fa6'
import type { ReactNode } from 'react'

import type { Account, AccountKind } from '@/types'

type AccountsListSectionProps = {
  accounts: Account[]
  archivingId?: string | null
  currentUserId?: string
  emptyDescription: string
  emptyTitle: string
  loading: boolean
  onArchive?: (account: Account) => void
  onEdit?: (account: Account) => void
  onShare?: (account: Account) => void
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

const getAccountSubtitle = (account: Account) => {
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

function KindIconDisplay({
  className,
  kind,
}: {
  className?: string
  kind: AccountKind
}) {
  if (kind === 'card') {
    return <FaBuildingColumns className={className} aria-hidden="true" />
  }

  if (kind === 'cash') {
    return <FaMoneyBillWave className={className} aria-hidden="true" />
  }

  if (kind === 'lent') {
    return <FaHandHoldingDollar className={className} aria-hidden="true" />
  }

  return <FaWallet className={className} aria-hidden="true" />
}

function KindPattern({ kind }: { kind: AccountKind }) {
  if (kind === 'card') {
    return (
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.08]"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M0 34H200M0 72H200M55 0V120M132 0V120" stroke="white" strokeWidth="0.7" />
        <rect x="24" y="18" width="28" height="18" rx="4" stroke="white" strokeWidth="0.8" />
        <rect x="142" y="78" width="30" height="18" rx="4" stroke="white" strokeWidth="0.8" />
      </svg>
    )
  }

  if (kind === 'wallet') {
    return (
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.08]"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M0 42C25 20 46 20 70 42C94 64 116 64 140 42C164 20 182 20 200 42" stroke="white" strokeWidth="1" />
        <path d="M0 78C25 56 46 56 70 78C94 100 116 100 140 78C164 56 182 56 200 78" stroke="white" strokeWidth="0.8" />
      </svg>
    )
  }

  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.08]"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20 90C54 44 88 44 122 90C144 120 172 120 198 84" stroke="white" strokeWidth="1" />
      <path d="M34 100C66 62 98 62 130 100" stroke="white" strokeWidth="0.7" />
    </svg>
  )
}

export function AccountsListSection({
  accounts,
  archivingId,
  currentUserId,
  emptyDescription,
  emptyTitle,
  loading,
  onArchive,
  onEdit,
  onShare,
  variant,
}: AccountsListSectionProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="min-h-72 overflow-hidden rounded-[2rem] border border-pink-100 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-28 animate-pulse bg-pink-100 dark:bg-slate-800" />
            <div className="space-y-4 p-5">
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-pink-100 dark:bg-slate-800" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-pink-50 dark:bg-slate-850" />
              <div className="h-16 animate-pulse rounded-2xl bg-pink-50 dark:bg-slate-950" />
              <div className="h-10 animate-pulse rounded-2xl bg-pink-50 dark:bg-slate-850" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!accounts.length) {
    const EmptyIcon =
      variant === 'card'
        ? FaBuildingColumns
        : variant === 'cash'
          ? FaMoneyBillWave
          : variant === 'lent'
            ? FaHandHoldingDollar
            : FaWallet

    return (
      <div className="animate-fade-in rounded-[2rem] border-2 border-dashed border-pink-200 bg-white px-6 py-20 text-center dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-50 text-pink-500 dark:bg-slate-950 dark:text-pink-400">
          <EmptyIcon className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
          {emptyTitle}
        </p>
        <p className="mx-auto max-w-sm text-sm font-medium leading-relaxed text-gray-400 dark:text-slate-500">
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account, index) => (
        <AccountCard
          key={`${account.kind}-${account.id}`}
          account={account}
          archivingId={archivingId}
          currentUserId={currentUserId}
          index={index}
          onArchive={onArchive}
          onEdit={onEdit}
          onShare={onShare}
        />
      ))}
    </div>
  )
}

function AccountCard({
  account,
  archivingId,
  currentUserId,
  index,
  onArchive,
  onEdit,
  onShare,
}: {
  account: Account
  archivingId?: string | null
  currentUserId?: string
  index: number
  onArchive?: (account: Account) => void
  onEdit?: (account: Account) => void
  onShare?: (account: Account) => void
}) {
  const isDeleting = archivingId === account.id
  const isOwner = account.canManage || !currentUserId
  const isShared = !isOwner
  const primaryColor = account.color || '#F472B6'
  const secondaryColor = adjustColorBrightness(primaryColor, -28)

  return (
    <article
      className="group relative flex min-h-72 flex-col overflow-hidden rounded-[2rem] border border-pink-100 bg-white transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-100/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-none"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className="relative min-h-36 overflow-hidden p-5"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        <KindPattern kind={account.kind} />

        <div className="relative z-10 flex min-h-26 flex-col justify-between gap-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md transition group-hover:scale-105">
              <KindIconDisplay kind={account.kind} className="h-5 w-5 text-white" />
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
              {isShared ? (
                <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
                  <FaUsers className="h-3 w-3" aria-hidden="true" />
                  {account.accessRole === 'transactor'
                    ? 'Shared · Can transact'
                    : 'Shared · View only'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
                  <FaUser className="h-3 w-3" aria-hidden="true" />
                  Owner
                </span>
              )}

              <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
                {formatAccountType(account.accountType)}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-xl font-black tracking-tight text-white drop-shadow-sm">
              {account.name}
            </h3>
            <p className="mt-1 truncate text-xs font-semibold text-white/70">
              {getAccountSubtitle(account)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="rounded-2xl border border-pink-50 bg-pink-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/45">
          <div className="mb-1 flex items-center gap-2">
            <FaMoneyBillWave
              className="h-3.5 w-3.5"
              style={{ color: primaryColor }}
              aria-hidden="true"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-slate-500">
              Current Balance
            </span>
          </div>
          <p className="break-words text-2xl font-black tracking-tight text-gray-900 dark:text-slate-100">
            {currency.format(account.balance)}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              className="flex h-2 w-2 rounded-full"
              style={{
                backgroundColor: isDeleting
                  ? '#f59e0b'
                  : account.isActive
                    ? '#22c55e'
                    : '#9ca3af',
                boxShadow: isDeleting
                  ? '0 0 6px #f59e0b60'
                  : account.isActive
                    ? '0 0 6px #22c55e50'
                    : 'none',
              }}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              {isDeleting ? 'Deleting' : account.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
            {isOwner && onShare && account.kind !== 'cash' && account.kind !== 'lent' ? (
              <IconButton
                disabled={isDeleting}
                label={`Share ${account.name}`}
                title="Share account"
                tone="blue"
                onClick={() => onShare(account)}
              >
                <FaShareNodes className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            ) : null}
            {isOwner && onEdit ? (
              <IconButton
                disabled={isDeleting}
                label={`Edit ${account.name}`}
                title="Edit account"
                tone="pink"
                onClick={() => onEdit(account)}
              >
                <FaPencil className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            ) : null}
            {isOwner && onArchive ? (
              <IconButton
                disabled={isDeleting}
                label={`Delete ${account.name}`}
                title="Delete account"
                tone="red"
                onClick={() => onArchive(account)}
              >
                <FaTrashCan className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
  title,
  tone,
}: {
  children: ReactNode
  disabled: boolean
  label: string
  onClick: () => void
  title: string
  tone: 'blue' | 'pink' | 'red'
}) {
  const toneClass =
    tone === 'blue'
      ? 'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-500 dark:hover:border-blue-900 dark:hover:bg-blue-950/40 dark:hover:text-blue-400'
      : tone === 'red'
        ? 'hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400'
        : 'hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 dark:hover:border-pink-900/60 dark:hover:bg-pink-950/30 dark:hover:text-pink-400'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-10 min-w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 transition active:scale-95 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 ${toneClass}`}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function adjustColorBrightness(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
