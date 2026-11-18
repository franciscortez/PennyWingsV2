import { useCallback } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useTransactionComposer } from '@/hooks/useTransactionComposer'
import { AppError } from '@/lib/errors'
import { queryKeys } from '@/lib/queryClient'
import {
  deleteTransaction as deleteTransactionService,
  emptyTransactionsListData,
  fetchTransactions,
  updateTransaction as updateTransactionService,
} from '@/services/transactionsService'
import type {
  Transaction,
  TransactionFilterType,
  TransactionFormValues,
} from '@/types'

type UseTransactionsDataOptions = {
  page: number
  pageSize: number
  search: string
  type: TransactionFilterType
  userId: string | undefined
}

export function useTransactionsData({
  page,
  pageSize,
  search,
  type,
  userId,
}: UseTransactionsDataOptions) {
  const queryClient = useQueryClient()

  const transactionsQuery = useQuery({
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
    queryFn: () =>
      userId
        ? fetchTransactions({
            page,
            pageSize,
            search,
            type,
            userId,
          })
        : emptyTransactionsListData,
    queryKey: queryKeys.transactionsList(userId ?? 'anonymous', {
      page,
      pageSize,
      search,
      type,
    }),
  })

  const {
    accountsError,
    buildMutationValues,
    cardAccounts,
    cashAccount,
    categories,
    categoriesError,
    createTransaction,
    creating,
    lentAccounts,
    optionsLoading,
    refreshTransactionCaches,
    walletAccounts,
  } = useTransactionComposer(userId)

  const reload = useCallback(async () => {
    if (!userId) {
      return
    }

    await queryClient.invalidateQueries({
      queryKey: queryKeys.transactions(userId),
    })
  }, [queryClient, userId])

  const listData = transactionsQuery.data ?? emptyTransactionsListData
  const error =
    transactionsQuery.error instanceof Error
      ? transactionsQuery.error.message
      : categoriesError instanceof Error
        ? categoriesError.message
        : accountsError instanceof Error
          ? accountsError.message
          : transactionsQuery.error || categoriesError || accountsError
            ? 'Unable to load transactions.'
            : null

  const updateMutation = useMutation({
    mutationFn: async ({
      transaction,
      values,
    }: {
      transaction: Transaction
      values: TransactionFormValues
    }) => {
      if (!userId) {
        throw new Error('No user logged in.')
      }

      const mutationValues = buildMutationValues(values)
      await updateTransactionService(transaction.id, mutationValues)
    },
    onSuccess: refreshTransactionCaches,
  })

  const deleteMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (!userId) {
        throw new Error('No user logged in.')
      }

      await deleteTransactionService(transaction.id)
    },
    onSuccess: refreshTransactionCaches,
  })

  const updateTransaction = useCallback(
    async (transaction: Transaction, values: TransactionFormValues) => {
      try {
        await updateMutation.mutateAsync({ transaction, values })
        return { error: null }
      } catch (error) {
        return {
          error: AppError.from(error, 'Unable to update transaction.'),
        }
      }
    },
    [updateMutation],
  )

  const removeTransaction = useCallback(
    async (transaction: Transaction) => {
      try {
        await deleteMutation.mutateAsync(transaction)
        return { error: null }
      } catch (error) {
        return {
          error: AppError.from(error, 'Unable to delete transaction.'),
        }
      }
    },
    [deleteMutation],
  )

  return {
    ...listData,
    cardAccounts,
    cashAccount,
    categories,
    createTransaction,
    deletingId: deleteMutation.isPending
      ? (deleteMutation.variables?.id ?? null)
      : null,
    error: userId ? error : null,
    lentAccounts,
    loading: userId ? transactionsQuery.isLoading : false,
    hasLoadedData: transactionsQuery.data !== undefined && !transactionsQuery.isPlaceholderData,
    optionsLoading,
    reload,
    removeTransaction,
    saving: creating || updateMutation.isPending,
    updateTransaction,
    walletAccounts,
  }
}
