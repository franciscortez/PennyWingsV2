import { useCallback, useEffect, useState } from 'react'

import {
  createAccount,
  emptyAccountsData,
  fetchAccounts,
} from '@/services/accountsService'
import type { AccountCreateValues, AccountsData } from '@/types'

export function useAccountsData(userId: string | undefined) {
  const [data, setData] = useState<AccountsData>(emptyAccountsData)
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadAccounts = useCallback(async () => {
    if (!userId) {
      setData(emptyAccountsData)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const accountsData = await fetchAccounts(userId)
      setData(accountsData)
    } catch (accountsError) {
      setError(
        accountsError instanceof Error
          ? accountsError.message
          : 'Unable to load accounts.',
      )
      setData(emptyAccountsData)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    let mounted = true

    const loadMountedAccounts = async () => {
      if (!userId) {
        if (mounted) {
          setData(emptyAccountsData)
          setLoading(false)
          setError(null)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const accountsData = await fetchAccounts(userId)

        if (mounted) {
          setData(accountsData)
        }
      } catch (accountsError) {
        if (mounted) {
          setError(
            accountsError instanceof Error
              ? accountsError.message
              : 'Unable to load accounts.',
          )
          setData(emptyAccountsData)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadMountedAccounts()

    return () => {
      mounted = false
    }
  }, [userId])

  const addAccount = useCallback(
    async (values: AccountCreateValues) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setSaving(true)
      const { error: createError } = await createAccount(userId, values)

      if (!createError) {
        await loadAccounts()
      }

      setSaving(false)

      return { error: createError }
    },
    [loadAccounts, userId],
  )

  return {
    ...(userId ? data : emptyAccountsData),
    addAccount,
    error: userId ? error : null,
    loading: userId ? loading : false,
    reload: loadAccounts,
    saving,
  }
}
