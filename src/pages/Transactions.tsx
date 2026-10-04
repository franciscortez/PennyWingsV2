import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { AppButton, PageHeader } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useErrorAlert } from '@/hooks/useErrorAlert'
import { useTransactionsData } from '@/hooks/useTransactionsData'
import { alerts } from '@/lib/alert'
import {
  TransactionForm,
  TransactionsSkeleton,
  TransactionsTable,
} from '@/sections/transactions'
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

  const {
    cardAccounts,
    cashAccount,
    categories,
    createTransaction,
    deletingId,
    error,
    lentAccounts,
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
  useErrorAlert(error)

  const openCreateForm = useCallback(() => {
    setEditingTransaction(null)
    setFormOpen(true)
  }, [])

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

  if (loading) {
    return (
      <>
        <TransactionsSkeleton />
      </>
    )
  }

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

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormOpen(true)
  }

  const closeForm = () => {
    if (!saving) {
      setEditingTransaction(null)
      setFormOpen(false)
    }
  }

  const handleFormSubmit = async (values: TransactionFormValues) => {
    const action = editingTransaction ? 'updated' : 'created'

    const { error: saveError } = editingTransaction
      ? await updateTransaction(editingTransaction, values)
      : await createTransaction(values)

    if (saveError) {
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
    <>
      <div className="activity-design space-y-6 lg:space-y-8 motion-reduce:[&_button]:transform-none motion-reduce:[&_button]:transition-none">
        <PageHeader
          className="min-w-0 [&_h1]:[overflow-wrap:anywhere]"
          title="Transaction History"
          description="Manage your cashflow with precision."
          actions={
            <AppButton type="button" onClick={openCreateForm} className="min-w-0 max-w-full">
              <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 [overflow-wrap:anywhere]">New Transaction</span>
            </AppButton>
          }
        />

        <TransactionsTable
          currentUserId={user?.id}
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
          cashAccount={cashAccount}
          categories={categories}
          dismissDisabled={saving}
          lentAccounts={lentAccounts}
          saving={saving || optionsLoading}
          transaction={editingTransaction}
          walletAccounts={walletAccounts}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
        />
      ) : null}
    </>
  )
}
