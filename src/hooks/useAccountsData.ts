import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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
  const [saving, setSaving] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
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

  const editAccount = useCallback(
    async (accountId: string, values: AccountUpdateValues) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setSaving(true)
      const { error: updateError } = await updateAccountService(
        userId,
        accountId,
        values,
      )

      if (!updateError) {
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

      return { error: updateError }
    },
    [queryClient, userId],
  )

  const archiveAccount = useCallback(
    async (accountId: string, kind: AccountKind) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setArchivingId(accountId)
      const { error: archiveError } = await archiveAccountService(
        userId,
        accountId,
        kind,
      )

      if (!archiveError) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queryKeys.accounts(userId),
          }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.dashboard(userId),
          }),
        ])
      }

      setArchivingId(null)

      return { error: archiveError }
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
    archiveAccount,
    archivingId,
    editAccount,
    error: userId ? error : null,
    loading: userId ? accountsQuery.isLoading : false,
    reload,
    saving,
  }
}

