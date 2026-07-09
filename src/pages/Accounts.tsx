import { FaBorderAll, FaBuildingColumns, FaMoneyBillWave, FaWallet } from 'react-icons/fa6'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import Layout from '@/components/Layout'
import { useAccountsData } from '@/hooks/useAccountsData'
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

type AccountTab = 'all' | 'cards' | 'wallets' | 'cash'

const tabs: Array<{
  icon: typeof FaBorderAll
  id: AccountTab
  label: string
}> = [
  { id: 'all', label: 'All', icon: FaBorderAll },
  { id: 'cards', label: 'Cards', icon: FaBuildingColumns },
  { id: 'wallets', label: 'E-Wallet', icon: FaWallet },
  { id: 'cash', label: 'Cash', icon: FaMoneyBillWave },
]

const getTabFromUrl = (value: string | null): AccountTab =>
  value === 'cards' || value === 'wallets' || value === 'cash' ? value : 'all'

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
    cashCount,
    editAccount,
    error,
    loading,
    saving,
    totalBalance,
    walletCount,
    reload,
  } = useAccountsData(user?.id)
  useErrorAlert(error)
  const [searchParams, setSearchParams] = useSearchParams()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [sharingAccount, setSharingAccount] = useState<Account | null>(null)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const activeTab = getTabFromUrl(searchParams.get('tab'))

  const cardAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.kind === 'card' && matchesSearch(account, searchQuery),
      ),
    [accounts, searchQuery],
  )
  const walletAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.kind === 'wallet' && matchesSearch(account, searchQuery),
      ),
    [accounts, searchQuery],
  )
  const cashAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.kind === 'cash' && matchesSearch(account, searchQuery),
      ),
    [accounts, searchQuery],
  )
  const allFilteredAccounts = useMemo(
    () => accounts.filter((account) => matchesSearch(account, searchQuery)),
    [accounts, searchQuery],
  )
  const tabCounts: Record<AccountTab, number> = {
    all: allFilteredAccounts.length,
    cards: cardAccounts.length,
    cash: cashCount,
    wallets: walletCount,
  }

  const bankBalance = useMemo(
    () => accounts.filter((a) => a.kind === 'card').reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  )
  const walletBalance = useMemo(
    () => accounts.filter((a) => a.kind === 'wallet').reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  )
  const cashBalance = useMemo(
    () => accounts.filter((a) => a.kind === 'cash').reduce((sum, a) => sum + a.balance, 0),
    [accounts],
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

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          My Accounts
        </h1>
        <p className="text-gray-500 dark:text-slate-400">
          Manage your bank cards and digital wallets in one place.
        </p>
      </div>

      <TotalBalanceSection
        loading={loading}
        total={totalBalance}
        onAddClick={openWizard}
        onJoinClick={() => setJoinModalOpen(true)}
      />

      <CategoryBalanceCards
        bankBalance={bankBalance}
        cashBalance={cashBalance}
        loading={loading}
        walletBalance={walletBalance}
      />

      <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="no-scrollbar flex w-full snap-x gap-2 overflow-x-auto whitespace-nowrap rounded-4xl border border-pink-100 bg-pink-100/30 p-1.5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/30 md:w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-1 snap-center items-center justify-center gap-2 rounded-[1.2rem] px-6 py-3 font-bold transition-all md:flex-none ${
                  active
                    ? 'scale-105 bg-white text-pink-600 dark:bg-slate-800 dark:text-pink-400'
                    : 'text-gray-400 hover:text-pink-400 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {tab.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    active
                      ? 'bg-pink-100 text-pink-600 dark:bg-slate-700 dark:text-pink-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}
                >
                  {loading ? '...' : tabCounts[tab.id]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-white px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-pink-500"
          />
        </div>
      </div>

      <div className="pb-20">
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
              onShare={(account) => setSharingAccount(account)}
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
              onShare={(account) => setSharingAccount(account)}
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
              onShare={(account) => setSharingAccount(account)}
              variant="wallet"
            />
          ) : (
            <AccountsListSection
              accounts={cashAccounts}
              archivingId={archivingId}
              currentUserId={user?.id}
              emptyDescription="Add a cash balance to track money on hand."
              emptyTitle="No Cash Yet"
              loading={loading}
              onArchive={handleArchiveAccount}
              onEdit={openEditModal}
              variant="cash"
            />
          )}
        </div>
      </div>

      {wizardOpen ? (
        <AccountCreationWizard
          hasCashAccount={cashCount > 0}
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
