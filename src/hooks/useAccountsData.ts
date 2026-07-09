import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppError } from '@/lib/errors'
import { queryKeys } from '@/lib/queryClient'
import {
  archiveAccount as archiveAccountService,
  createAccount,
  emptyAccountsData,
  fetchAccounts,
  updateAccount as updateAccountService,
} from '@/services/accountsService'
import type { AccountCreateValues, AccountKind, AccountUpdateValues } from '@/types'

export function useAccountsData(userId: string | undefined) {
  const queryClient = useQueryClient()

  const accountsQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => (userId ? fetchAccounts(userId) : emptyAccountsData),
    queryKey: queryKeys.accounts(userId ?? 'anonymous'),
  })

  const reload = useCallback(async () => {
    if (!userId) {
      return
    }

    await queryClient.invalidateQueries({
      queryKey: queryKeys.accounts(userId),
    })
  }, [queryClient, userId])

  const refreshAccountCaches = useCallback(async () => {
    if (!userId) {
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard(userId),
      }),
    ])
  }, [queryClient, userId])

  const addMutation = useMutation({
    mutationFn: async (values: AccountCreateValues) => {
      if (!userId) {
        throw new Error('No user logged in.')
      }

      await createAccount(userId, values)
    },
    onSuccess: refreshAccountCaches,
  })

  const editMutation = useMutation({
    mutationFn: async ({
      accountId,
      values,
    }: {
      accountId: string
      values: AccountUpdateValues
    }) => {
      if (!userId) {
        throw new Error('No user logged in.')
      }

      await updateAccountService(userId, accountId, values)
    },
    onSuccess: refreshAccountCaches,
  })

  const archiveMutation = useMutation({
    mutationFn: async ({
      accountId,
      kind,
    }: {
      accountId: string
      kind: AccountKind
    }) => {
      if (!userId) {
        throw new Error('No user logged in.')
      }

      await archiveAccountService(userId, accountId, kind)
    },
    onSuccess: refreshAccountCaches,
  })

  const addAccount = useCallback(
    async (values: AccountCreateValues) => {
      try {
        await addMutation.mutateAsync(values)
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to create account.') }
      }
    },
    [addMutation],
  )

  const editAccount = useCallback(
    async (accountId: string, values: AccountUpdateValues) => {
      try {
        await editMutation.mutateAsync({ accountId, values })
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to update account.') }
      }
    },
    [editMutation],
  )

  const archiveAccount = useCallback(
    async (accountId: string, kind: AccountKind) => {
      try {
        await archiveMutation.mutateAsync({ accountId, kind })
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to archive account.') }
      }
    },
    [archiveMutation],
  )

  const error =
    accountsQuery.error instanceof Error
      ? accountsQuery.error.message
      : accountsQuery.error
        ? 'Unable to load accounts.'
        : null
  const data = accountsQuery.data ?? emptyAccountsData

  return {
    ...(userId ? data : emptyAccountsData),
    addAccount,
    archiveAccount,
    archivingId: archiveMutation.isPending
      ? (archiveMutation.variables?.accountId ?? null)
      : null,
    editAccount,
    error: userId ? error : null,
    loading: userId ? accountsQuery.isLoading : false,
    reload,
    saving: addMutation.isPending || editMutation.isPending,
  }
}

