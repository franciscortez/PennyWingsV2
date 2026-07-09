import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppError } from '@/lib/errors'
import { queryKeys } from '@/lib/queryClient'
import {
  emptyAccountsData,
  fetchArchivedAccounts,
  restoreAccount as restoreAccountService,
} from '@/services/accountsService'
import type { AccountKind } from '@/types'

export function useArchivedAccountsData(userId: string | undefined) {
  const queryClient = useQueryClient()

  const archivedAccountsQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => (userId ? fetchArchivedAccounts(userId) : emptyAccountsData),
    queryKey: queryKeys.archivedAccounts(userId ?? 'anonymous'),
  })

  const refreshAccountCaches = useCallback(async () => {
    if (!userId) {
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.accounts(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.archivedAccounts(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports(userId),
      }),
    ])
  }, [queryClient, userId])

  const restoreMutation = useMutation({
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

      await restoreAccountService(userId, accountId, kind)
    },
    onSuccess: refreshAccountCaches,
  })

  const restoreAccount = useCallback(
    async (accountId: string, kind: AccountKind) => {
      try {
        await restoreMutation.mutateAsync({ accountId, kind })
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to restore account.') }
      }
    },
    [restoreMutation],
  )

  const error =
    archivedAccountsQuery.error instanceof Error
      ? archivedAccountsQuery.error.message
      : archivedAccountsQuery.error
        ? 'Unable to load archived accounts.'
        : null
  const data = archivedAccountsQuery.data ?? emptyAccountsData

  return {
    ...(userId ? data : emptyAccountsData),
    error: userId ? error : null,
    loading: userId ? archivedAccountsQuery.isLoading : false,
    restoreAccount,
    restoringId: restoreMutation.isPending
      ? (restoreMutation.variables?.accountId ?? null)
      : null,
  }
}
