import { CreditCard, Grid2X2, Landmark, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import Layout from '@/components/Layout'
import { useAccountsData } from '@/hooks/useAccountsData'
import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'
import {
  AccountCreationWizard,
  AccountsListSection,
  TotalBalanceSection,
} from '@/sections/accounts'
import type { Account, AccountCreateValues } from '@/types'

type AccountTab = 'all' | 'cards' | 'wallets' | 'cash'

const tabs: Array<{
  icon: typeof Grid2X2
  id: AccountTab
  label: string
}> = [
  { id: 'all', label: 'All', icon: Grid2X2 },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'wallets', label: 'E-Wallet', icon: Wallet },
  { id: 'cash', label: 'Cash', icon: Landmark },
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
    cashCount,
    error,
    loading,
    saving,
    totalBalance,
    walletCount,
  } = useAccountsData(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()
  const [wizardOpen, setWizardOpen] = useState(false)
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
  const filteredWalletsAndCash = useMemo(
    () => [...walletAccounts, ...cashAccounts],
    [cashAccounts, walletAccounts],
  )
  const tabCounts: Record<AccountTab, number> = {
    all: accounts.filter((account) => matchesSearch(account, searchQuery)).length,
    cards: cardAccounts.length,
    cash: cashCount,
    wallets: walletCount,
  }

  const openWizard = () => {
    setWizardOpen(true)
  }

  const closeWizard = () => {
    if (!saving) {
      setWizardOpen(false)
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

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-900">
          My Accounts
        </h1>
        <p className="text-gray-500">
          Manage your bank cards and digital wallets in one place.
        </p>
      </div>

      <TotalBalanceSection
        loading={loading}
        total={totalBalance}
        onAddClick={openWizard}
      />

      {error ? (
        <div className="mb-8 rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : null}

      <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="no-scrollbar flex w-full snap-x gap-2 overflow-x-auto whitespace-nowrap rounded-[2rem] border border-pink-100 bg-pink-100/30 p-1.5 backdrop-blur-sm md:w-fit">
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
                    ? 'scale-105 bg-white text-pink-600'
                    : 'text-gray-400 hover:text-pink-400'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {tab.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    active
                      ? 'bg-pink-100 text-pink-600'
                      : 'bg-gray-100 text-gray-400'
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
            className="w-full rounded-2xl border border-pink-100 bg-white px-5 py-3 text-sm font-bold text-gray-700 outline-none transition-all focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
          />
        </div>
      </div>

      <div className="pb-20">
        <div key={activeTab} className="animate-fade-in">
          {activeTab === 'all' ? (
            <div className="space-y-12">
              <AccountSectionHeader icon={CreditCard} title="Bank Cards" />
              <AccountsListSection
                accounts={cardAccounts}
                emptyDescription="Add your first card to start tracking your finances."
                emptyTitle="No Bank Cards Yet"
                loading={loading}
                variant="card"
              />

              <AccountSectionHeader icon={Wallet} title="Digital Wallets & Cash" />
              <AccountsListSection
                accounts={filteredWalletsAndCash}
                emptyDescription="Add your first wallet or cash balance to manage funds."
                emptyTitle="No E-Wallets Yet"
                loading={loading}
                variant="wallet"
              />
            </div>
          ) : activeTab === 'cards' ? (
            <AccountsListSection
              accounts={cardAccounts}
              emptyDescription="Add your first card to start tracking your finances."
              emptyTitle="No Bank Cards Yet"
              loading={loading}
              variant="card"
            />
          ) : activeTab === 'wallets' ? (
            <AccountsListSection
              accounts={walletAccounts}
              emptyDescription="Add your first wallet to manage digital funds."
              emptyTitle="No E-Wallets Yet"
              loading={loading}
              variant="wallet"
            />
          ) : (
            <AccountsListSection
              accounts={cashAccounts}
              emptyDescription="Add a cash balance to track money on hand."
              emptyTitle="No Cash Yet"
              loading={loading}
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
    </Layout>
  )
}

function AccountSectionHeader({
  icon: Icon,
  title,
}: {
  icon: typeof CreditCard
  title: string
}) {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
    </section>
  )
}
