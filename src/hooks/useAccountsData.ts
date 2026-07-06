import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryClient'
import {
  createAccount,
  emptyAccountsData,
  fetchAccounts,
} from '@/services/accountsService'
import type { AccountCreateValues } from '@/types'

export function useAccountsData(userId: string | undefined) {
  const [saving, setSaving] = useState(false)
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

  const addAccount = useCallback(
    async (values: AccountCreateValues) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setSaving(true)
      const { error: createError } = await createAccount(userId, values)

      if (!createError) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.accounts(userId),
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.dashboard(userId),
          }),
        ])
      }

      setSaving(false)

      return { error: createError }
    },
    [queryClient, userId],
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
    error: userId ? error : null,
    loading: userId ? accountsQuery.isLoading : false,
    reload,
    saving,
  }
}
