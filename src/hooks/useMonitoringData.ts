import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryClient'
import { emptyAccountsData, fetchAccounts } from '@/services/accountsService'
import {
  createBudget,
  createGoal,
  deleteBudget,
  deleteGoal,
  emptyMonitoringData,
  fetchMonitoringData,
  updateBudget,
  updateGoal,
} from '@/services/monitoringService'
import type {
  BudgetFormValues,
  GoalFormValues,
  MonitoringTab,
} from '@/types'

export function useMonitoringData(
  userId: string | undefined,
  tab: MonitoringTab,
) {
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const monitoringQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => (userId ? fetchMonitoringData(userId) : emptyMonitoringData),
    queryKey: queryKeys.monitoringData(userId ?? 'anonymous', tab),
  })

  const accountsQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => (userId ? fetchAccounts(userId) : emptyAccountsData),
    queryKey: queryKeys.accounts(userId ?? 'anonymous'),
  })

  const refreshMonitoringCaches = useCallback(async () => {
    if (!userId) {
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.monitoring(userId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard(userId),
      }),
    ])
  }, [queryClient, userId])

  const addBudget = useCallback(
    async (values: BudgetFormValues) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setSaving(true)
      const { error } = await createBudget(userId, values)

      if (!error) {
        await refreshMonitoringCaches()
      }

      setSaving(false)
      return { error }
    },
    [refreshMonitoringCaches, userId],
  )

  const editBudget = useCallback(
    async (budgetId: string, values: BudgetFormValues) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setSaving(true)
      const { error } = await updateBudget(userId, budgetId, values)

      if (!error) {
        await refreshMonitoringCaches()
      }

      setSaving(false)
      return { error }
    },
    [refreshMonitoringCaches, userId],
  )

  const removeBudget = useCallback(
    async (budgetId: string) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setDeletingId(budgetId)
      const { error } = await deleteBudget(userId, budgetId)

      if (!error) {
        await refreshMonitoringCaches()
      }

      setDeletingId(null)
      return { error }
    },
    [refreshMonitoringCaches, userId],
  )

  const addGoal = useCallback(
    async (values: GoalFormValues) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setSaving(true)
      const { error } = await createGoal(userId, values)

      if (!error) {
        await refreshMonitoringCaches()
      }

      setSaving(false)
      return { error }
    },
    [refreshMonitoringCaches, userId],
  )

  const editGoal = useCallback(
    async (goalId: string, values: GoalFormValues) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setSaving(true)
      const { error } = await updateGoal(userId, goalId, values)

      if (!error) {
        await refreshMonitoringCaches()
      }

      setSaving(false)
      return { error }
    },
    [refreshMonitoringCaches, userId],
  )

  const removeGoal = useCallback(
    async (goalId: string) => {
      if (!userId) {
        return { error: new Error('No user logged in.') }
      }

      setDeletingId(goalId)
      const { error } = await deleteGoal(userId, goalId)

      if (!error) {
        await refreshMonitoringCaches()
      }

      setDeletingId(null)
      return { error }
    },
    [refreshMonitoringCaches, userId],
  )

  const monitoringError =
    monitoringQuery.error instanceof Error
      ? monitoringQuery.error.message
      : monitoringQuery.error
        ? 'Unable to load monitoring data.'
        : null
  const accountsError =
    accountsQuery.error instanceof Error
      ? accountsQuery.error.message
      : accountsQuery.error
        ? 'Unable to load account options.'
        : null
  const data = monitoringQuery.data ?? emptyMonitoringData
  const accounts = accountsQuery.data?.accounts ?? []

  return {
    ...data,
    accounts,
    addBudget,
    addGoal,
    deletingId,
    editBudget,
    editGoal,
    error: userId ? (monitoringError ?? accountsError) : null,
    loading: userId ? monitoringQuery.isLoading : false,
    optionsLoading: userId ? accountsQuery.isLoading : false,
    removeBudget,
    removeGoal,
    saving,
  }
}
