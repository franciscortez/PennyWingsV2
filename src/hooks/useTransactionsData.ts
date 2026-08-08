import { useCallback } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { AppError } from '@/lib/errors'
import { queryKeys } from '@/lib/queryClient'
import { invalidateTransactionCaches } from '@/lib/queryInvalidation'
import { fetchAccounts } from '@/services/accountsService'
import { fetchCategories } from '@/services/categoriesService'
import {
  deleteTransaction as deleteTransactionService,
  emptyTransactionsListData,
  fetchAccountBalance,
  fetchTransactions,
  processTransaction,
  updateTransaction as updateTransactionService,
} from '@/services/transactionsService'
import type {
  Transaction,
  TransactionFilterType,
  TransactionFormValues,
  TransactionMutationValues,
} from '@/types'

type UseTransactionsDataOptions = {
  page: number
  pageSize: number
  search: string
  type: TransactionFilterType
  userId: string | undefined
}

const isDeduction = (type: TransactionFormValues['type']) =>
  type === 'expense' || type === 'withdrawal' || type === 'transfer'

const normalizeDescription = (value: string | undefined) => {
  const description = value?.trim()
  return description ? description : null
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

  const categoriesQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => (userId ? fetchCategories(userId) : []),
    queryKey: queryKeys.categories(userId ?? 'anonymous'),
  })

  const accountsQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => (userId ? fetchAccounts(userId) : null),
    queryKey: queryKeys.accounts(userId ?? 'anonymous'),
  })

  const reload = useCallback(async () => {
    if (!userId) {
      return
    }

    await queryClient.invalidateQueries({
      queryKey: queryKeys.transactions(userId),
    })
  }, [queryClient, userId])

  const refreshTransactionCaches = useCallback(async () => {
    if (!userId) {
      return
    }

    await invalidateTransactionCaches(queryClient, userId)
  }, [queryClient, userId])

  const listData = transactionsQuery.data ?? emptyTransactionsListData
  const categories = categoriesQuery.data ?? []
  const accounts = accountsQuery.data?.accounts ?? []
  const error =
    transactionsQuery.error instanceof Error
      ? transactionsQuery.error.message
      : categoriesQuery.error instanceof Error
        ? categoriesQuery.error.message
        : accountsQuery.error instanceof Error
          ? accountsQuery.error.message
          : transactionsQuery.error || categoriesQuery.error || accountsQuery.error
            ? 'Unable to load transactions.'
            : null

  const transactableAccounts = accounts.filter((account) => account.canTransact)
  const cardAccounts = transactableAccounts.filter(
    (account) => account.kind === 'card',
  )
  const lentAccounts = transactableAccounts.filter(
    (account) => account.kind === 'lent',
  )
  const walletAccounts = transactableAccounts.filter(
    (account) => account.kind === 'wallet',
  )
  const cashAccount =
    transactableAccounts.find((account) => account.kind === 'cash') ?? null

  const buildMutationValues = useCallback(
    (values: TransactionFormValues): TransactionMutationValues => {
      const cashWalletId = cashAccount?.id ?? null

      if (values.payment_method === 'cash' && !cashWalletId) {
        throw new Error('Add a cash account before recording cash transactions.')
      }

      if (
        values.type === 'transfer' &&
        values.to_payment_method === 'cash' &&
        !cashWalletId
      ) {
        throw new Error('Add a cash account before transferring to cash.')
      }

      const sourceIsWallet =
        values.payment_method === 'ewallet' || values.payment_method === 'lent'
      const paymentMethod =
        values.payment_method === 'lent' ? 'ewallet' : values.payment_method
      const cardId = values.payment_method === 'card' ? values.card_id ?? null : null
      const walletId =
        sourceIsWallet
          ? values.wallet_id ?? null
          : values.payment_method === 'cash'
            ? cashWalletId
            : null
      const toCardId =
        values.type === 'transfer' && values.to_payment_method === 'card'
          ? values.to_card_id ?? null
          : null
      const toWalletId =
        values.type === 'transfer'
          ? values.to_payment_method === 'cash'
            ? cashWalletId
            : values.to_payment_method === 'ewallet' ||
                values.to_payment_method === 'lent'
              ? values.to_wallet_id ?? null
              : null
          : null

      return {
        amount: values.amount,
        card_id: cardId,
        category_id: values.category_id,
        description: normalizeDescription(values.description),
        payment_method: paymentMethod,
        to_card_id: toCardId,
        to_wallet_id: toWalletId,
        transaction_date: values.transaction_date,
        type: values.type,
        wallet_id: walletId,
      }
    },
    [cashAccount?.id],
  )

  const checkBalance = useCallback(
    async (values: TransactionMutationValues) => {
      if (!isDeduction(values.type)) {
        return
      }

      const balance = await fetchAccountBalance({
        card_id: values.card_id,
        wallet_id: values.wallet_id,
      })

      if (values.amount > balance) {
        throw new Error('Insufficient balance.')
      }
    },
    [],
  )

  const createMutation = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      if (!userId) {
        throw new Error('No user logged in.')
      }

      const mutationValues = buildMutationValues(values)
      await checkBalance(mutationValues)
      await processTransaction(mutationValues)
    },
    onSuccess: refreshTransactionCaches,
  })

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

  const createTransaction = useCallback(
    async (values: TransactionFormValues) => {
      try {
        await createMutation.mutateAsync(values)
        return { error: null }
      } catch (error) {
        return {
          error: AppError.from(error, 'Unable to save transaction.'),
        }
      }
    },
    [createMutation],
  )

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
    optionsLoading: userId
      ? categoriesQuery.isLoading || accountsQuery.isLoading
      : false,
    reload,
    removeTransaction,
    saving: createMutation.isPending || updateMutation.isPending,
    updateTransaction,
    walletAccounts,
  }
}
