import {
  FaBorderAll,
  FaBuildingColumns,
  FaHandHoldingDollar,
  FaMoneyBillWave,
  FaWallet,
} from 'react-icons/fa6'
import { ChevronDown, Plus, Search, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import Layout from '@/components/Layout'
import { useAccountsData } from '@/hooks/useAccountsData'
import { useArchivedAccountsData } from '@/hooks/useArchivedAccountsData'
import { useAccountMembership } from '@/hooks/useJointAccountData'
import { useAuth } from '@/hooks/useAuth'
import { useErrorAlert } from '@/hooks/useErrorAlert'
import { alerts } from '@/lib/alert'
import {
  AccountCreationWizard,
  AccountsListSection,
  AccountsSkeleton,
  CategoryBalanceCards,
  EditAccountModal,
  JoinAccountModal,
  ShareAccountModal,
  TotalBalanceSection,
} from '@/sections/accounts'
import type { Account, AccountCreateValues, AccountUpdateValues } from '@/types'

type AccountTab = 'all' | 'cards' | 'wallets' | 'cash' | 'lent'

const tabs: Array<{
  icon: typeof FaBorderAll
  id: AccountTab
  label: string
}> = [
  { id: 'all', label: 'All', icon: FaBorderAll },
  { id: 'cards', label: 'Cards', icon: FaBuildingColumns },
  { id: 'wallets', label: 'E-Wallet', icon: FaWallet },
  { id: 'cash', label: 'Cash', icon: FaMoneyBillWave },
  { id: 'lent', label: 'Lent', icon: FaHandHoldingDollar },
]

const getTabFromUrl = (value: string | null): AccountTab =>
  value === 'cards' ||
  value === 'wallets' ||
  value === 'cash' ||
  value === 'lent'
    ? value
    : 'all'

const matchesSearch = (account: Account, searchQuery: string) => {
  const query = searchQuery.trim().toLowerCase()

  if (!query) {
    return true
  }

  return (
    account.name.toLowerCase().includes(query) ||
    account.accountType.toLowerCase().includes(query) ||
    account.kind.toLowerCase().includes(query)
  )
}

export default function Accounts() {
  const { user } = useAuth()
  const {
    accounts,
    addAccount,
    archiveAccount,
    archivingId,
    editAccount,
    error,
    loading,
    saving,
    totalBalance,
    reload,
  } = useAccountsData(user?.id)
  useErrorAlert(error)
  const { leaveAccount, toggleHidden } = useAccountMembership(user?.id)
  const {
    accounts: archivedAccounts,
    deleteArchivedAccount,
    deletingId: archiveDeletingId,
    restoreAccount,
    restoringId: archiveRestoringId,
  } = useArchivedAccountsData(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [sharingAccount, setSharingAccount] = useState<Account | null>(null)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showHidden, setShowHidden] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const activeTab = getTabFromUrl(searchParams.get('tab'))

  const visibleAccounts = useMemo(
    () => accounts.filter((account) => !account.isHidden),
    [accounts],
  )
  const hiddenAccounts = useMemo(
    () => accounts.filter((account) => account.isHidden),
    [accounts],
  )

  const cardAccounts = useMemo(
    () =>
      visibleAccounts.filter(
        (account) => account.kind === 'card' && matchesSearch(account, searchQuery),
      ),
    [visibleAccounts, searchQuery],
  )
  const walletAccounts = useMemo(
    () =>
      visibleAccounts.filter(
        (account) =>
          account.kind === 'wallet' && matchesSearch(account, searchQuery),
      ),
    [visibleAccounts, searchQuery],
  )
  const cashAccounts = useMemo(
    () =>
      visibleAccounts.filter(
        (account) => account.kind === 'cash' && matchesSearch(account, searchQuery),
      ),
    [visibleAccounts, searchQuery],
  )
  const lentAccounts = useMemo(
    () =>
      visibleAccounts.filter(
        (account) => account.kind === 'lent' && matchesSearch(account, searchQuery),
      ),
    [visibleAccounts, searchQuery],
  )
  const allFilteredAccounts = useMemo(
    () => visibleAccounts.filter((account) => matchesSearch(account, searchQuery)),
    [visibleAccounts, searchQuery],
  )
  const accountCounts = useMemo(
    () => ({
      cards: visibleAccounts.filter((account) => account.kind === 'card').length,
      cash: visibleAccounts.filter((account) => account.kind === 'cash').length,
      lent: visibleAccounts.filter((account) => account.kind === 'lent').length,
      wallets: visibleAccounts.filter((account) => account.kind === 'wallet').length,
    }),
    [visibleAccounts],
  )
  const tabCounts: Record<AccountTab, number> = {
    all: allFilteredAccounts.length,
    cards: cardAccounts.length,
    cash: cashAccounts.length,
    lent: lentAccounts.length,
    wallets: walletAccounts.length,
  }

  const bankBalance = useMemo(
    () => visibleAccounts.filter((a) => a.kind === 'card').reduce((sum, a) => sum + a.balance, 0),
    [visibleAccounts],
  )
  const walletBalance = useMemo(
    () => visibleAccounts.filter((a) => a.kind === 'wallet').reduce((sum, a) => sum + a.balance, 0),
    [visibleAccounts],
  )
  const cashBalance = useMemo(
    () => visibleAccounts.filter((a) => a.kind === 'cash').reduce((sum, a) => sum + a.balance, 0),
    [visibleAccounts],
  )
  const lentBalance = useMemo(
    () => visibleAccounts.filter((a) => a.kind === 'lent').reduce((sum, a) => sum + a.balance, 0),
    [visibleAccounts],
  )

  if (loading) {
    return (
      <Layout>
        <AccountsSkeleton />
      </Layout>
    )
  }

  const openWizard = () => {
    setWizardOpen(true)
  }

  const closeWizard = () => {
    if (!saving) {
      setWizardOpen(false)
    }
  }

  const openEditModal = (account: Account) => {
    setEditingAccount(account)
  }

  const closeEditModal = () => {
    if (!saving) {
      setEditingAccount(null)
    }
  }

  const handleTabChange = (tab: AccountTab) => {
    setSearchParams({ tab })
  }

  const handleCreateAccount = async (values: AccountCreateValues) => {
    const { error: accountError } = await addAccount(values)

    if (accountError) {
      alerts.error(accountError.message)
      return false
    }

    alerts.success('Account created.')
    setWizardOpen(false)
    return true
  }

  const handleUpdateAccount = async (values: AccountUpdateValues) => {
    if (!editingAccount) {
      return false
    }

    const { error: updateError } = await editAccount(editingAccount.id, values)

    if (updateError) {
      alerts.error(updateError.message)
      return false
    }

    alerts.success('Account updated.')
    setEditingAccount(null)
    return true
  }

  const handleArchiveAccount = async (account: Account) => {
    const confirmed = await alerts.confirmDelete(
      'Account',
      `Delete "${account.name}"? This account will be removed from your active list.`,
    )

    if (!confirmed) {
      return
    }

    const { error: archiveError } = await archiveAccount(account.id, account.kind)

    if (archiveError) {
      alerts.error(archiveError.message)
    } else {
      alerts.success('Account deleted.')
    }
  }

  const handleToggleHidden = async (account: Account) => {
    if (!account.membershipId) return

    const { error: toggleError } = await toggleHidden(
      account.membershipId,
      !account.isHidden,
    )

    if (toggleError) {
      alerts.error(toggleError.message)
    } else {
      alerts.success(account.isHidden ? 'Account unhidden.' : 'Account hidden.')
    }
  }

  const handleLeaveAccount = async (account: Account) => {
    if (!account.membershipId) return

    const confirmed = await alerts.confirmDelete(
      'Shared Account',
      `Leave "${account.name}"? You'll lose access until re-invited.`,
    )

    if (!confirmed) {
      return
    }

    const { error: leaveError } = await leaveAccount(account.membershipId)

    if (leaveError) {
      alerts.error(leaveError.message)
    } else {
      alerts.success('You left the shared account.')
    }
  }

  const handleRestoreArchived = async (account: Account) => {
    const confirmed = await alerts.confirm({
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Restore Account',
      icon: 'question',
      text: `${account.name} will appear in your active accounts again.`,
      title: 'Restore archived account?',
    })

    if (!confirmed) {
      return
    }

    const { error: restoreError } = await restoreAccount(account.id, account.kind)

    if (restoreError) {
      alerts.error(restoreError.message)
    } else {
      alerts.success('Account restored.')
    }
  }

  const handleDeleteArchived = async (account: Account) => {
    const confirmed = await alerts.confirmDelete(
      'Archived Account',
      `Permanently delete "${account.name}"? This removes the account record and cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    const { error: deleteError } = await deleteArchivedAccount(
      account.id,
      account.kind,
    )

    if (deleteError) {
      alerts.error(deleteError.message)
    } else {
      alerts.success('Account permanently deleted.')
    }
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20 sm:space-y-8">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-pink-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-pink-500 dark:text-pink-400">
              Accounts
            </p>
            <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">
              My Accounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-gray-500 dark:text-slate-400">
              Track cards, wallets, cash, and lent money from one responsive
              command center.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto">
            <button
              type="button"
              onClick={openWizard}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 text-sm font-black text-white transition hover:bg-pink-600 active:scale-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </button>
            <button
              type="button"
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-pink-50 px-5 py-3 text-sm font-black text-pink-600 transition hover:border-pink-200 hover:bg-pink-100 dark:border-slate-800 dark:bg-slate-950 dark:text-pink-400 dark:hover:bg-slate-800"
            >
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              Join
            </button>
          </div>
        </header>

        <section className="space-y-4">
          <TotalBalanceSection
            cardCount={accountCounts.cards}
            cashCount={accountCounts.cash}
            lentCount={accountCounts.lent}
            loading={loading}
            total={totalBalance}
            walletCount={accountCounts.wallets}
          />

          <CategoryBalanceCards
            bankBalance={bankBalance}
            cashBalance={cashBalance}
            lentBalance={lentBalance}
            loading={loading}
            walletBalance={walletBalance}
          />
        </section>

        <section className="rounded-[2rem] border border-pink-100 bg-white/95 p-3 shadow-sm shadow-pink-100/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:w-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black transition sm:min-w-fit sm:px-5 ${
                      active
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                        : 'bg-pink-50 text-gray-500 hover:bg-pink-100 hover:text-pink-600 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-pink-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{tab.label}</span>
                    <span
                      className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[10px] ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-white text-gray-400 dark:bg-slate-900 dark:text-slate-500'
                      }`}
                    >
                      {tabCounts[tab.id]}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="relative w-full xl:w-80">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-300 dark:text-slate-500"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search accounts"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-pink-100 bg-pink-50/60 py-3 pl-11 pr-4 text-sm font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-pink-500 dark:focus:bg-slate-900"
              />
            </div>
          </div>
        </section>

        {hiddenAccounts.length > 0 ? (
          <section className="rounded-[2rem] border border-pink-100 bg-white/95 p-3 shadow-sm shadow-pink-100/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
            <button
              type="button"
              onClick={() => setShowHidden((value) => !value)}
              className="flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl px-3 text-sm font-black text-gray-500 transition hover:text-pink-600 dark:text-slate-400 dark:hover:text-pink-400"
            >
              <span>Hidden shared accounts ({hiddenAccounts.length})</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showHidden ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {showHidden ? (
              <div className="px-1 pb-1 pt-3">
                <AccountsListSection
                  accounts={hiddenAccounts}
                  currentUserId={user?.id}
                  emptyDescription=""
                  emptyTitle=""
                  loading={false}
                  onToggleHidden={handleToggleHidden}
                  variant="all"
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {archivedAccounts.length > 0 ? (
          <section className="rounded-[2rem] border border-pink-100 bg-white/95 p-3 shadow-sm shadow-pink-100/50 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
            <button
              type="button"
              onClick={() => setShowArchived((value) => !value)}
              className="flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl px-3 text-sm font-black text-gray-500 transition hover:text-pink-600 dark:text-slate-400 dark:hover:text-pink-400"
            >
              <span>Archived accounts ({archivedAccounts.length})</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showArchived ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {showArchived ? (
              <div className="px-1 pb-1 pt-3">
                <AccountsListSection
                  accounts={archivedAccounts}
                  archivedView
                  archivingId={archiveDeletingId}
                  currentUserId={user?.id}
                  emptyDescription=""
                  emptyTitle=""
                  loading={false}
                  onArchive={handleDeleteArchived}
                  onRestore={handleRestoreArchived}
                  restoringId={archiveRestoringId}
                  variant="all"
                />
              </div>
            ) : null}
          </section>
        ) : null}

        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'all' ? (
            <AccountsListSection
              accounts={allFilteredAccounts}
              archivingId={archivingId}
              currentUserId={user?.id}
              emptyDescription="Add your first card, digital wallet, or cash balance to start tracking."
              emptyTitle="No Accounts Found"
              loading={loading}
              onArchive={handleArchiveAccount}
              onEdit={openEditModal}
              onLeave={handleLeaveAccount}
              onShare={(account) => setSharingAccount(account)}
              onToggleHidden={handleToggleHidden}
              variant="all"
            />
          ) : activeTab === 'cards' ? (
            <AccountsListSection
              accounts={cardAccounts}
              archivingId={archivingId}
              currentUserId={user?.id}
              emptyDescription="Add your first card to start tracking your finances."
              emptyTitle="No Bank Cards Yet"
              loading={loading}
              onArchive={handleArchiveAccount}
              onEdit={openEditModal}
              onLeave={handleLeaveAccount}
              onShare={(account) => setSharingAccount(account)}
              onToggleHidden={handleToggleHidden}
              variant="card"
            />
          ) : activeTab === 'wallets' ? (
            <AccountsListSection
              accounts={walletAccounts}
              archivingId={archivingId}
              currentUserId={user?.id}
              emptyDescription="Add your first wallet to manage digital funds."
              emptyTitle="No E-Wallets Yet"
              loading={loading}
              onArchive={handleArchiveAccount}
              onEdit={openEditModal}
              onLeave={handleLeaveAccount}
              onShare={(account) => setSharingAccount(account)}
              onToggleHidden={handleToggleHidden}
              variant="wallet"
            />
          ) : activeTab === 'cash' ? (
            <AccountsListSection
              accounts={cashAccounts}
              archivingId={archivingId}
              currentUserId={user?.id}
              emptyDescription="Add a cash balance to track money on hand."
              emptyTitle="No Cash Yet"
              loading={loading}
              onArchive={handleArchiveAccount}
              onEdit={openEditModal}
              onLeave={handleLeaveAccount}
              onToggleHidden={handleToggleHidden}
              variant="cash"
            />
          ) : (
            <AccountsListSection
              accounts={lentAccounts}
              archivingId={archivingId}
              currentUserId={user?.id}
              emptyDescription="Add lent money to track amounts other people owe you."
              emptyTitle="No Lent Money Yet"
              loading={loading}
              onArchive={handleArchiveAccount}
              onEdit={openEditModal}
              onLeave={handleLeaveAccount}
              onToggleHidden={handleToggleHidden}
              variant="lent"
            />
          )}
        </div>
      </div>

      {wizardOpen ? (
        <AccountCreationWizard
          hasCashAccount={accountCounts.cash > 0}
          saving={saving}
          onClose={closeWizard}
          onCreate={handleCreateAccount}
        />
      ) : null}

      {editingAccount ? (
        <EditAccountModal
          key={editingAccount.id}
          account={editingAccount}
          saving={saving}
          onClose={closeEditModal}
          onUpdate={handleUpdateAccount}
        />
      ) : null}

      {sharingAccount ? (
        <ShareAccountModal
          key={sharingAccount.id}
          account={sharingAccount}
          onClose={() => setSharingAccount(null)}
        />
      ) : null}

      {joinModalOpen ? (
        <JoinAccountModal
          onClose={() => setJoinModalOpen(false)}
          onJoined={() => {
            setJoinModalOpen(false)
            reload()
          }}
        />
      ) : null}
    </Layout>
  )
}
