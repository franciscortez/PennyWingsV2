import {
  FaBuildingColumns,
  FaMoneyBillWave,
  FaPencil,
  FaTrashCan,
  FaWallet,
} from 'react-icons/fa6'

import type { Account, AccountKind } from '@/types'

type AccountsListSectionProps = {
  accounts: Account[]
  archivingId?: string | null
  emptyDescription: string
  emptyTitle: string
  loading: boolean
  onArchive?: (account: Account) => void
  onEdit?: (account: Account) => void
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

  if (account.lastFour) {
    return `•••• •••• •••• ${account.lastFour}`
  }

  if (account.accountIdentifier) {
    return account.accountIdentifier
  }

  return formatAccountType(account.accountType)
}

function KindIconDisplay({ kind, className }: { kind: AccountKind; className?: string }) {
  if (kind === 'card') return <FaBuildingColumns className={className} aria-hidden="true" />
  if (kind === 'cash') return <FaMoneyBillWave className={className} aria-hidden="true" />
  return <FaWallet className={className} aria-hidden="true" />
}

/**
 * Generates a subtle SVG pattern unique to each account kind.
 * Cards get a circuit-board feel, wallets get a wave pattern, cash gets concentric rings.
 */
function KindPattern({ kind }: { kind: AccountKind }) {
  if (kind === 'card') {
    return (
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <line x1="0" y1="30" x2="200" y2="30" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="60" x2="200" y2="60" stroke="white" strokeWidth="0.5" />
        <line x1="0" y1="90" x2="200" y2="90" stroke="white" strokeWidth="0.5" />
        <line x1="50" y1="0" x2="50" y2="120" stroke="white" strokeWidth="0.5" />
        <line x1="100" y1="0" x2="100" y2="120" stroke="white" strokeWidth="0.5" />
        <line x1="150" y1="0" x2="150" y2="120" stroke="white" strokeWidth="0.5" />
        <rect x="45" y="25" width="12" height="12" rx="2" stroke="white" strokeWidth="0.7" />
        <rect x="95" y="55" width="12" height="12" rx="2" stroke="white" strokeWidth="0.7" />
        <rect x="145" y="85" width="12" height="12" rx="2" stroke="white" strokeWidth="0.7" />
      </svg>
    )
  }

  if (kind === 'wallet') {
    return (
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M0 60 Q 25 30, 50 60 T 100 60 T 150 60 T 200 60" stroke="white" strokeWidth="1" fill="none" />
        <path d="M0 80 Q 25 50, 50 80 T 100 80 T 150 80 T 200 80" stroke="white" strokeWidth="0.7" fill="none" />
        <path d="M0 40 Q 25 10, 50 40 T 100 40 T 150 40 T 200 40" stroke="white" strokeWidth="0.5" fill="none" />
        <path d="M0 100 Q 25 70, 50 100 T 100 100 T 150 100 T 200 100" stroke="white" strokeWidth="0.3" fill="none" />
      </svg>
    )
  }

  // Cash pattern — concentric rings
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.06]"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="160" cy="60" r="20" stroke="white" strokeWidth="0.7" />
      <circle cx="160" cy="60" r="35" stroke="white" strokeWidth="0.5" />
      <circle cx="160" cy="60" r="50" stroke="white" strokeWidth="0.4" />
      <circle cx="160" cy="60" r="65" stroke="white" strokeWidth="0.3" />
      <circle cx="160" cy="60" r="80" stroke="white" strokeWidth="0.2" />
    </svg>
  )
}

export function AccountsListSection({
  accounts,
  archivingId,
  emptyDescription,
  emptyTitle,
  loading,
  onArchive,
  onEdit,
  variant,
}: AccountsListSectionProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-[2rem] border border-pink-100/60 bg-white/70 backdrop-blur-sm"
            style={{ animationDelay: `${item * 80}ms` }}
          >
            <div className="h-32 animate-pulse bg-gradient-to-br from-pink-100 to-pink-50" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-pink-100" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-pink-50" />
              <div className="mt-4 h-14 w-full animate-pulse rounded-2xl bg-pink-50/80" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!accounts.length) {
    const EmptyIcon =
      variant === 'card' ? FaBuildingColumns : variant === 'cash' ? FaMoneyBillWave : FaWallet

    return (
      <div className="animate-fade-in rounded-[2.5rem] border-2 border-dashed border-pink-200/60 bg-gradient-to-br from-pink-50/80 to-white py-20 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-100 to-pink-200/60 shadow-lg shadow-pink-200/40">
          <EmptyIcon className="h-10 w-10 text-pink-500" aria-hidden="true" />
        </div>
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-gray-400">
          {emptyTitle}
        </p>
        <p className="mx-auto max-w-xs text-xs font-medium leading-relaxed text-gray-400">
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account, index) => (
        <AccountCard
          key={`${account.kind}-${account.id}`}
          account={account}
          archivingId={archivingId}
          index={index}
          onArchive={onArchive}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

function AccountCard({
  account,
  archivingId,
  index,
  onArchive,
  onEdit,
}: {
  account: Account
  archivingId?: string | null
  index: number
  onArchive?: (account: Account) => void
  onEdit?: (account: Account) => void
}) {
  const isDeleting = archivingId === account.id
  const primaryColor = account.color || '#F472B6'
  const secondaryColor = adjustColorBrightness(primaryColor, -25)

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/40 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
      style={{
        animationDelay: `${index * 60}ms`,
        boxShadow: `0 4px 24px ${primaryColor}12, 0 1px 3px ${primaryColor}08`,
      }}
    >
      {/* ─── Gradient Header ─── */}
      <div
        className="relative h-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 60%, ${adjustColorBrightness(primaryColor, -45)} 100%)`,
        }}
      >
        {/* SVG pattern overlay */}
        <KindPattern kind={account.kind} />

        {/* Floating accent orbs */}
        <div
          className="absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-20 transition-transform duration-700 group-hover:scale-125"
          style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-110"
          style={{ background: `radial-gradient(circle, white 0%, transparent 70%)` }}
        />

        {/* Header Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-5">
          {/* Top Row: Kind icon left — Account type badge right */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
              <KindIconDisplay kind={account.kind} className="h-5 w-5 text-white" />
            </div>

            {/* Account Type Badge — top right */}
            <span
              className="rounded-full bg-white/15 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              {formatAccountType(account.accountType)}
            </span>
          </div>

          {/* Account Name + Subtitle */}
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black tracking-tight text-white drop-shadow-sm">
              {account.name}
            </h3>
            <p className="mt-0.5 truncate text-xs font-semibold text-white/60">
              {getAccountSubtitle(account)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Card Body ─── */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Balance Display */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-100/80 bg-gradient-to-br from-gray-50/80 to-white p-4">
          {/* Subtle decorative sparkline */}
          <svg
            className="absolute bottom-0 right-0 h-12 w-24 opacity-[0.06]"
            viewBox="0 0 100 50"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0 40 Q 15 10, 30 25 T 60 15 T 90 20 L100 50 L0 50Z"
              fill={primaryColor}
            />
          </svg>

          <div className="relative z-10">
            <div className="mb-1 flex items-center gap-2">
              <FaMoneyBillWave
                className="h-3.5 w-3.5"
                style={{ color: primaryColor }}
                aria-hidden="true"
              />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                Current Balance
              </span>
            </div>
            <p className="text-2xl font-black tracking-tight text-gray-900">
              {currency.format(account.balance)}
            </p>
          </div>
        </div>

        {/* Footer Row: Status left — Edit/Delete buttons right */}
        <div className="mt-auto flex items-center justify-between gap-3">
          {/* Status indicator */}
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {isDeleting ? 'Deleting' : account.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Action Buttons — lower right */}
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(account)}
                disabled={isDeleting}
                title="Edit account"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 transition-all duration-200 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 active:scale-90 disabled:opacity-40"
                aria-label={`Edit ${account.name}`}
              >
                <FaPencil className="h-4 w-4" />
              </button>
            )}
            {onArchive && (
              <button
                type="button"
                onClick={() => onArchive(account)}
                disabled={isDeleting}
                title="Delete account"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-90 disabled:opacity-40"
                aria-label={`Delete ${account.name}`}
              >
                <FaTrashCan className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * Adjusts hex color brightness by the given amount (negative = darker).
 */
function adjustColorBrightness(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
