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
import { AppButton } from '@/components/ui/Button'
import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { surface, surfaceNested, textMuted } from '@/components/ui/surfaces'

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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className={`${surface} min-w-0 overflow-hidden`}
          >
            <div className="h-28 motion-safe:animate-pulse bg-pink-100 dark:bg-slate-800" />
            <div className="space-y-4 p-5">
              <div className="h-4 w-2/3 motion-safe:animate-pulse rounded-full bg-pink-100 dark:bg-slate-800" />
              <div className="h-3 w-1/2 motion-safe:animate-pulse rounded-full bg-pink-50 dark:bg-slate-800" />
              <div className="h-16 motion-safe:animate-pulse rounded-2xl bg-pink-50 dark:bg-slate-950" />
              <div className="h-10 motion-safe:animate-pulse rounded-2xl bg-pink-50 dark:bg-slate-800" />
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
      <div className={`${surface} px-6 py-16 text-center`}>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-pink-50 text-pink-700 dark:bg-slate-950 dark:text-pink-400">
          <EmptyIcon className="h-10 w-10" aria-hidden="true" />
        </div>
        <p className="mb-2 text-lg font-semibold text-slate-950 dark:text-white">
          {emptyTitle}
        </p>
        <p className={`mx-auto max-w-sm text-sm leading-relaxed ${textMuted}`}>
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
      {accounts.map((account) => (
        <AccountCard
          key={`${account.kind}-${account.id}`}
          account={account}
          archivedView={archivedView}
          archivingId={archivingId}
          currentUserId={currentUserId}
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
    <span className={`flex flex-wrap items-center gap-1.5 text-sm ${textMuted}`}>
      <FaUsers className="h-3 w-3" aria-hidden="true" />
      {account.accessRole === 'transactor'
        ? 'Shared · Can transact'
        : 'Shared · View only'}
    </span>
  ) : (
    <span className={`flex flex-wrap items-center gap-1.5 text-sm ${textMuted}`}>
      <FaUser className="h-3 w-3" aria-hidden="true" />
      Owner
    </span>
  )

  return (
    <article
      aria-label={account.name}
      className={`${surface} flex w-full min-w-0 max-w-96 flex-col overflow-hidden`}
    >
      <header className="space-y-2 px-5 pt-5">
        <h3 className="break-words text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{account.name}</h3>
        {accessBadge}
      </header>
      <div className="p-4 pb-0" data-account-artwork>
        {isBankCard ? (
          <BankCardFace
            className="aspect-[8/5] w-full"
            design={faceDesign}
            holderName={account.name}
            numberLine={numberLine}
            typeLabel={
              account.kind === 'wallet'
                ? 'Wallet'
                : formatAccountType(account.accountType)
            }
          />
        ) : (
          <MoneyNoteFace
            className="aspect-[8/5] w-full"
            serial={getNoteSerial(
              account.kind === 'lent' ? 'lent' : 'cash',
              account.id,
            )}
            subtitle={getAccountSubtitle(account)}
            title={account.name}
            variant={account.kind === 'lent' ? 'lent' : 'cash'}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-3 sm:p-5">
        <div className={`${surfaceNested} min-w-0 p-3 sm:p-4`}>
          <div className="mb-1 flex items-center gap-2">
            <FaMoneyBillWave
              className="h-3.5 w-3.5 text-pink-700 dark:text-pink-400"
              aria-hidden="true"
            />
            <span className={`text-sm ${textMuted}`}>
              Current Balance
            </span>
          </div>
          <p className="text-xl font-semibold leading-snug sm:text-2xl text-slate-950 dark:text-white" data-account-balance>
            <FormattedFigure value={currency.format(account.balance)} />
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${textMuted}`}>
              {isDeleting ? 'Deleting' : account.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

  return (
    <AppButton
      type="button"
      size="icon"
      variant={tone === 'red' ? 'danger' : 'ghost'}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="h-11 w-11 shrink-0"
      aria-label={label}
    >
      {children}
    </AppButton>
  )
}
