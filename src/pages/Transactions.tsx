import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useTransactionsData } from '@/hooks/useTransactionsData'
import { alerts } from '@/lib/alert'
import { TransactionForm, TransactionsTable } from '@/sections/transactions'
import type {
  Transaction,
  TransactionFilterType,
  TransactionFormValues,
} from '@/types'

const pageSize = 10

const getPageFromUrl = (value: string | null) =>
  Math.max(1, Number.parseInt(value ?? '1', 10) || 1)

const getTypeFromUrl = (value: string | null): TransactionFilterType =>
  value === 'income' ||
  value === 'expense' ||
  value === 'withdrawal' ||
  value === 'transfer'
    ? value
    : 'all'

export default function Transactions() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = getPageFromUrl(searchParams.get('page'))
  const filterType = getTypeFromUrl(searchParams.get('type'))
  const searchQuery = searchParams.get('search') ?? ''
  const [formOpen, setFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null,
  )
  const [formError, setFormError] = useState('')

  const {
    cardAccounts,
    categories,
    createTransaction,
    deletingId,
    error,
    loading,
    optionsLoading,
    removeTransaction,
    saving,
    totalCount,
    totalPages,
    transactions,
    updateTransaction,
    walletAccounts,
  } = useTransactionsData({
    page,
    pageSize,
    search: searchQuery,
    type: filterType,
    userId: user?.id,
  })

  const setPage = useCallback((nextPage: number, replace = false) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('page', String(nextPage))
        return next
      },
      { replace },
    )
  }, [setSearchParams])

  useEffect(() => {
    if (!loading && totalPages > 0 && page > totalPages) {
      setPage(totalPages, true)
    }

    if (!loading && totalPages === 0 && page > 1) {
      setPage(1, true)
    }
  }, [loading, page, setPage, totalPages])

  const setFilterType = (type: TransactionFilterType) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('type', type)
      next.set('page', '1')
      return next
    })
  }

  const setSearchQuery = (value: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)

        if (value) {
          next.set('search', value)
        } else {
          next.delete('search')
        }

        next.set('page', '1')
        return next
      },
      { replace: true },
    )
  }

  const openCreateForm = () => {
    setFormError('')
    setEditingTransaction(null)
    setFormOpen(true)
  }

  const openEditForm = (transaction: Transaction) => {
    setFormError('')
    setEditingTransaction(transaction)
    setFormOpen(true)
  }

  const closeForm = () => {
    if (!saving) {
      setFormError('')
      setEditingTransaction(null)
      setFormOpen(false)
    }
  }

  const handleFormSubmit = async (values: TransactionFormValues) => {
    setFormError('')
    const action = editingTransaction ? 'updated' : 'created'

    const { error: saveError } = editingTransaction
      ? await updateTransaction(editingTransaction, values)
      : await createTransaction(values)

    if (saveError) {
      setFormError(saveError.message)
      alerts.error(saveError.message)
      return false
    }

    alerts.success(`Transaction ${action}.`)
    return true
  }

  const handleDelete = async (transaction: Transaction) => {
    const confirmed = await alerts.confirmDelete(
      'Transaction',
      'Delete this transaction? The balance changes will be reversed.',
    )

    if (!confirmed) {
      return
    }

    const { error: deleteError } = await removeTransaction(transaction)

    if (deleteError) {
      alerts.error(deleteError.message)
    } else {
      alerts.success('Transaction deleted.')
    }
  }

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-4xl font-black tracking-tight text-gray-900">
              Transaction History
            </h1>
            <p className="font-bold text-gray-500">
              Manage your cashflow with precision.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 rounded-[2rem] bg-pink-500 px-8 py-4 font-black text-white transition hover:bg-pink-600"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            New Transaction
          </button>
        </header>

        {error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <TransactionsTable
          deletingId={deletingId}
          filterType={filterType}
          loading={loading}
          page={page}
          pageSize={pageSize}
          searchQuery={searchQuery}
          totalCount={totalCount}
          totalPages={totalPages}
          transactions={transactions}
          onDelete={handleDelete}
          onEdit={openEditForm}
          onFilterChange={setFilterType}
          onPageChange={setPage}
          onSearchChange={setSearchQuery}
        />
      </div>

      {formOpen ? (
        <TransactionForm
          key={editingTransaction?.id ?? 'new-transaction'}
          cardAccounts={cardAccounts}
          categories={categories}
          error={formError}
          saving={saving || optionsLoading}
          transaction={editingTransaction}
          walletAccounts={walletAccounts}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
        />
      ) : null}
    </Layout>
  )
}
