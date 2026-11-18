import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppError } from '@/lib/errors'
import { queryKeys } from '@/lib/queryClient'
import { invalidateTransactionCaches } from '@/lib/queryInvalidation'
import { fetchAccounts } from '@/services/accountsService'
import { fetchCategories } from '@/services/categoriesService'
import {
  fetchAccountBalance,
  processTransaction,
} from '@/services/transactionsService'
import type {
  Account,
  TransactionCategory,
  TransactionFormValues,
  TransactionMutationValues,
} from '@/types'

// Stable fallbacks: a fresh `[]` per render would defeat every memo below.
const noAccounts: Account[] = []
const noCategories: TransactionCategory[] = []

type UseTransactionComposerOptions = {
  /** Defer the option queries until a composer is actually about to open. */
  enabled?: boolean
}

const isDeduction = (type: TransactionFormValues['type']) =>
  type === 'expense' || type === 'withdrawal' || type === 'transfer'

const normalizeDescription = (value: string | undefined) => {
  const description = value?.trim()
  return description ? description : null
}

/**
 * Everything needed to record a new transaction without the paged Activity
 * list: the form's options (categories and transactable accounts), the mapping
 * from form values to the RPC payload, and the create mutation. Activity and
 * the global mobile quick-add share it, and the same query keys, so both write
 * through one path and see one cache.
 */
export function useTransactionComposer(
  userId: string | undefined,
  { enabled = true }: UseTransactionComposerOptions = {},
) {
  const queryClient = useQueryClient()
  const queriesEnabled = Boolean(userId) && enabled

  const categoriesQuery = useQuery({
    enabled: queriesEnabled,
    queryFn: () => (userId ? fetchCategories(userId) : []),
    queryKey: queryKeys.categories(userId ?? 'anonymous'),
  })

  const accountsQuery = useQuery({
    enabled: queriesEnabled,
    queryFn: () => (userId ? fetchAccounts(userId) : null),
    queryKey: queryKeys.accounts(userId ?? 'anonymous'),
  })

  const refreshTransactionCaches = useCallback(async () => {
    if (!userId) {
      return
    }

    await invalidateTransactionCaches(queryClient, userId)
  }, [queryClient, userId])

  const categories = categoriesQuery.data ?? noCategories
  const accounts = accountsQuery.data?.accounts ?? noAccounts

  // Memoized so the account lists keep their identity between renders and the
  // transaction form does not see "new" props on every parent update.
  const { cardAccounts, cashAccount, lentAccounts, walletAccounts } = useMemo(() => {
    const transactableAccounts = accounts.filter((account) => account.canTransact)

    return {
      cardAccounts: transactableAccounts.filter((account) => account.kind === 'card'),
      cashAccount:
        transactableAccounts.find((account) => account.kind === 'cash') ?? null,
      lentAccounts: transactableAccounts.filter((account) => account.kind === 'lent'),
      walletAccounts: transactableAccounts.filter((account) => account.kind === 'wallet'),
    }
  }, [accounts])

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
        fee_amount:
          values.type === 'transfer' || values.type === 'withdrawal'
            ? (values.fee_amount ?? 0)
            : 0,
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

      const requiredAmount = values.amount + values.fee_amount
      const roundingTolerance =
        Number.EPSILON * Math.max(1, Math.abs(requiredAmount), Math.abs(balance)) * 2

      if (requiredAmount - balance > roundingTolerance) {
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

  return {
    buildMutationValues,
    cardAccounts,
    cashAccount,
    categories,
    categoriesError: categoriesQuery.error,
    accountsError: accountsQuery.error,
    createTransaction,
    creating: createMutation.isPending,
    lentAccounts,
    optionsLoading: queriesEnabled
      ? categoriesQuery.isLoading || accountsQuery.isLoading
      : false,
    refreshTransactionCaches,
    walletAccounts,
  }
}
