import {
  FaBuildingColumns,
  FaEye,
  FaEyeSlash,
  FaHandHoldingDollar,
  FaMoneyBillWave,
  FaPencil,
  FaRightFromBracket,
  FaRotateLeft,
  FaShareNodes,
  FaTrashCan,
  FaUser,
  FaUsers,
  FaWallet,
} from 'react-icons/fa6'
import type { ReactNode } from 'react'

import { BankCardFace } from '@/sections/accounts/BankCardFace'
import { MoneyNoteFace } from '@/sections/accounts/MoneyNoteFace'
import {
  buildCustomCardDesign,
  getAccountCardDesign,
  getNoteSerial,
  noteColors,
} from '@/sections/accounts/bankCardDesigns'
import type { Account, AccountKind } from '@/types'

type AccountsListSectionProps = {
  accounts: Account[]
  archivedView?: boolean
  archivingId?: string | null
  currentUserId?: string
  emptyDescription: string
  emptyTitle: string
  loading: boolean
  onArchive?: (account: Account) => void
  onEdit?: (account: Account) => void
  onLeave?: (account: Account) => void
  onRestore?: (account: Account) => void
  onShare?: (account: Account) => void
  onToggleHidden?: (account: Account) => void
  restoringId?: string | null
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

export function AccountsListSection({
  accounts,
  archivedView,
  archivingId,
  currentUserId,
  emptyDescription,
  emptyTitle,
  loading,
  onArchive,
  onEdit,
  onLeave,
  onRestore,
  onShare,
  onToggleHidden,
  restoringId,
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
          archivedView={archivedView}
          archivingId={archivingId}
          currentUserId={currentUserId}
          index={index}
          onArchive={onArchive}
          onEdit={onEdit}
          onLeave={onLeave}
          onRestore={onRestore}
          onShare={onShare}
          onToggleHidden={onToggleHidden}
          restoringId={restoringId}
        />
      ))}
    </div>
  )
}

function AccountCard({
  account,
  archivedView,
  archivingId,
  currentUserId,
  index,
  onArchive,
  onEdit,
  onLeave,
  onRestore,
  onShare,
  onToggleHidden,
  restoringId,
}: {
  account: Account
  archivedView?: boolean
  archivingId?: string | null
  currentUserId?: string
  index: number
  onArchive?: (account: Account) => void
  onEdit?: (account: Account) => void
  onLeave?: (account: Account) => void
  onRestore?: (account: Account) => void
  onShare?: (account: Account) => void
  onToggleHidden?: (account: Account) => void
  restoringId?: string | null
}) {
  const isDeleting = archivingId === account.id
  const isRestoring = restoringId === account.id
  const isOwner = account.canManage || !currentUserId
  const isShared = !isOwner
  const isBankCard = account.kind === 'card' || account.kind === 'wallet'
  const design = getAccountCardDesign(account)
  const primaryColor = isBankCard
    ? (design?.primary ?? (account.color || '#F472B6'))
    : noteColors[account.kind === 'lent' ? 'lent' : 'cash']
  const faceDesign =
    design ?? buildCustomCardDesign(primaryColor, account.textColor || '#ffffff')
  const numberLine =
    account.kind === 'card'
      ? `••••  ••••  ••••  ${account.lastFour || '••••'}`
      : account.accountIdentifier || '••••  ••••  ••••  ••••'

  const accessBadge = isShared ? (
    <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest opacity-95 backdrop-blur-sm">
      <FaUsers className="h-3 w-3" aria-hidden="true" />
      {account.accessRole === 'transactor'
        ? 'Shared · Can transact'
        : 'Shared · View only'}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest opacity-95 backdrop-blur-sm">
      <FaUser className="h-3 w-3" aria-hidden="true" />
      Owner
    </span>
  )

  return (
    <article
      className={`group relative flex min-h-72 flex-col overflow-hidden rounded-[2rem] border border-pink-100 bg-white transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-lg hover:shadow-pink-100/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-none ${account.isHidden ? 'opacity-60' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="p-4 pb-0">
        {isBankCard ? (
          <BankCardFace
            className="aspect-[8/5] w-full transition group-hover:-translate-y-0.5"
            design={faceDesign}
            holderName={account.name}
            numberLine={numberLine}
            topRight={accessBadge}
            typeLabel={
              account.kind === 'wallet'
                ? 'Wallet'
                : formatAccountType(account.accountType)
            }
          />
        ) : (
          <MoneyNoteFace
            className="aspect-[8/5] w-full transition group-hover:-translate-y-0.5"
            serial={getNoteSerial(
              account.kind === 'lent' ? 'lent' : 'cash',
              account.id,
            )}
            subtitle={getAccountSubtitle(account)}
            title={account.name}
            topRight={accessBadge}
            variant={account.kind === 'lent' ? 'lent' : 'cash'}
          />
        )}
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
            {archivedView && onRestore ? (
              <IconButton
                disabled={isDeleting || isRestoring}
                label={`Restore ${account.name}`}
                title="Restore account"
                tone="blue"
                onClick={() => onRestore(account)}
              >
                <FaRotateLeft className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            ) : null}
            {archivedView && onArchive ? (
              <IconButton
                disabled={isDeleting || isRestoring}
                label={`Permanently delete ${account.name}`}
                title="Permanently delete account"
                tone="red"
                onClick={() => onArchive(account)}
              >
                <FaTrashCan className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            ) : null}
            {!archivedView && isOwner && onShare && account.kind !== 'cash' && account.kind !== 'lent' ? (
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
            {!archivedView && isOwner && onEdit ? (
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
            {!archivedView && isOwner && onArchive ? (
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
            {!archivedView && isShared && onToggleHidden ? (
              <IconButton
                disabled={false}
                label={
                  account.isHidden
                    ? `Unhide ${account.name}`
                    : `Hide ${account.name}`
                }
                title={account.isHidden ? 'Unhide account' : 'Hide account'}
                tone="blue"
                onClick={() => onToggleHidden(account)}
              >
                {account.isHidden ? (
                  <FaEye className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <FaEyeSlash className="h-4 w-4" aria-hidden="true" />
                )}
              </IconButton>
            ) : null}
            {!archivedView && isShared && onLeave ? (
              <IconButton
                disabled={false}
                label={`Leave ${account.name}`}
                title="Leave shared account"
                tone="red"
                onClick={() => onLeave(account)}
              >
                <FaRightFromBracket className="h-4 w-4" aria-hidden="true" />
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
