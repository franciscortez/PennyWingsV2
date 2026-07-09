import { ArrowLeft, CreditCard, RotateCcw, Wallet } from 'lucide-react'
import { Link } from 'react-router'

import Layout from '@/components/Layout'
import { useArchivedAccountsData } from '@/hooks/useArchivedAccountsData'
import { useAuth } from '@/hooks/useAuth'
import { useErrorAlert } from '@/hooks/useErrorAlert'
import { alerts } from '@/lib/alert'
import { formatDate } from '@/lib/date'
import type { Account } from '@/types'

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

  return account.accountIdentifier ?? formatAccountType(account.accountType)
}

export default function ArchivedAccounts() {
  const { user } = useAuth()
  const {
    accounts,
    error,
    loading,
    restoreAccount,
    restoringId,
    totalBalance,
  } = useArchivedAccountsData(user?.id)

  useErrorAlert(error)

  const handleRestore = async (account: Account) => {
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

    const { error: restoreError } = await restoreAccount(
      account.id,
      account.kind,
    )

    if (restoreError) {
      alerts.error(restoreError.message)
    } else {
      alerts.success('Account restored.')
    }
  }

  return (
    <Layout>
      <div className="pb-20">
        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link
              to="/accounts"
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-pink-500 transition hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Accounts
            </Link>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-pink-500 dark:text-pink-400">
              Account Archive
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Archived Accounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500 dark:text-slate-400">
              Review accounts removed from your active list and restore them
              when needed.
            </p>
          </div>

          <section className="rounded-3xl border border-pink-100 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Archived Total
            </p>
            <p className="mt-1 text-xl font-black text-gray-900 dark:text-slate-100">
              {loading ? 'Loading...' : currency.format(totalBalance)}
            </p>
          </section>
        </header>

        {loading ? (
          <ArchivedAccountsSkeleton />
        ) : accounts.length ? (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {accounts.map((account) => (
              <ArchivedAccountCard
                key={`${account.kind}-${account.id}`}
                account={account}
                restoring={restoringId === account.id}
                onRestore={handleRestore}
              />
            ))}
          </section>
        ) : (
          <EmptyArchive />
        )}
      </div>
    </Layout>
  )
}

function ArchivedAccountCard({
  account,
  onRestore,
  restoring,
}: {
  account: Account
  onRestore: (account: Account) => void
  restoring: boolean
}) {
  const Icon = account.kind === 'card' ? CreditCard : Wallet

  return (
    <article className="flex flex-col gap-5 rounded-[2rem] border border-pink-50 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ backgroundColor: account.color }}
      >
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="truncate text-xl font-black tracking-tight text-gray-900 dark:text-slate-100">
            {account.name}
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Archived
          </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
          {formatAccountType(account.accountType)} · {getAccountSubtitle(account)}
        </p>
        <p className="mt-3 text-2xl font-black text-gray-900 dark:text-slate-100">
          {currency.format(account.balance)}
        </p>
        <p className="mt-1 text-xs font-medium text-gray-400 dark:text-slate-500">
          Created {formatDate(account.createdAt)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRestore(account)}
        disabled={restoring}
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-pink-500 px-5 py-3 text-sm font-black text-white transition hover:bg-pink-600 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        {restoring ? 'Restoring...' : 'Restore'}
      </button>
    </article>
  )
}

function ArchivedAccountsSkeleton() {
  return (
    <section
      className="grid animate-pulse grid-cols-1 gap-5 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading archived accounts"
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex min-h-40 gap-5 rounded-[2rem] border border-pink-50 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-16 w-16 rounded-2xl bg-pink-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-4">
            <div className="h-5 w-1/2 rounded-full bg-pink-100 dark:bg-slate-800" />
            <div className="h-3 w-2/3 rounded-full bg-pink-50 dark:bg-slate-950" />
            <div className="h-7 w-36 rounded-full bg-pink-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </section>
  )
}

function EmptyArchive() {
  return (
    <section className="rounded-[2.5rem] border-2 border-dashed border-pink-200/70 bg-white px-6 py-20 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-50 text-pink-500 dark:bg-slate-850 dark:text-pink-400">
        <RotateCcw className="h-10 w-10" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
        No Archived Accounts
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-400 dark:text-slate-500">
        Deleted accounts will appear here while they are archived.
      </p>
      <Link
        to="/accounts"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-[2rem] bg-pink-500 px-7 py-4 font-black text-white transition hover:bg-pink-600"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        Back to Accounts
      </Link>
    </section>
  )
}
