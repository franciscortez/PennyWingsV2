import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppError } from '@/lib/errors'
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

const runMutation = async (
  operation: () => Promise<unknown>,
  fallback: string,
) => {
  try {
    await operation()
    return { error: null }
  } catch (error) {
    return { error: AppError.from(error, fallback) }
  }
}

export function useMonitoringData(
  userId: string | undefined,
  tab: MonitoringTab,
) {
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

  const addBudgetMutation = useMutation({
    mutationFn: async (values: BudgetFormValues) => {
      if (!userId) throw new Error('No user logged in.')
      await createBudget(userId, values)
    },
    onSuccess: refreshMonitoringCaches,
  })
  const editBudgetMutation = useMutation({
    mutationFn: async ({
      budgetId,
      values,
    }: {
      budgetId: string
      values: BudgetFormValues
    }) => {
      if (!userId) throw new Error('No user logged in.')
      await updateBudget(userId, budgetId, values)
    },
    onSuccess: refreshMonitoringCaches,
  })
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      if (!userId) throw new Error('No user logged in.')
      await deleteBudget(userId, budgetId)
    },
    onSuccess: refreshMonitoringCaches,
  })
  const addGoalMutation = useMutation({
    mutationFn: async (values: GoalFormValues) => {
      if (!userId) throw new Error('No user logged in.')
      await createGoal(userId, values)
    },
    onSuccess: refreshMonitoringCaches,
  })
  const editGoalMutation = useMutation({
    mutationFn: async ({
      goalId,
      values,
    }: {
      goalId: string
      values: GoalFormValues
    }) => {
      if (!userId) throw new Error('No user logged in.')
      await updateGoal(userId, goalId, values)
    },
    onSuccess: refreshMonitoringCaches,
  })
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (!userId) throw new Error('No user logged in.')
      await deleteGoal(userId, goalId)
    },
    onSuccess: refreshMonitoringCaches,
  })

  const addBudget = useCallback(
    (values: BudgetFormValues) =>
      runMutation(
        () => addBudgetMutation.mutateAsync(values),
        'Unable to create budget.',
      ),
    [addBudgetMutation],
  )

  const editBudget = useCallback(
    (budgetId: string, values: BudgetFormValues) =>
      runMutation(
        () => editBudgetMutation.mutateAsync({ budgetId, values }),
        'Unable to update budget.',
      ),
    [editBudgetMutation],
  )

  const removeBudget = useCallback(
    (budgetId: string) =>
      runMutation(
        () => deleteBudgetMutation.mutateAsync(budgetId),
        'Unable to delete budget.',
      ),
    [deleteBudgetMutation],
  )

  const addGoal = useCallback(
    (values: GoalFormValues) =>
      runMutation(
        () => addGoalMutation.mutateAsync(values),
        'Unable to create goal.',
      ),
    [addGoalMutation],
  )

  const editGoal = useCallback(
    (goalId: string, values: GoalFormValues) =>
      runMutation(
        () => editGoalMutation.mutateAsync({ goalId, values }),
        'Unable to update goal.',
      ),
    [editGoalMutation],
  )

  const removeGoal = useCallback(
    (goalId: string) =>
      runMutation(
        () => deleteGoalMutation.mutateAsync(goalId),
        'Unable to delete goal.',
      ),
    [deleteGoalMutation],
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
    deletingId: deleteBudgetMutation.isPending
      ? (deleteBudgetMutation.variables ?? null)
      : deleteGoalMutation.isPending
        ? (deleteGoalMutation.variables ?? null)
        : null,
    editBudget,
    editGoal,
    error: userId ? (monitoringError ?? accountsError) : null,
    loading: userId ? monitoringQuery.isLoading : false,
    optionsLoading: userId ? accountsQuery.isLoading : false,
    removeBudget,
    removeGoal,
    saving:
      addBudgetMutation.isPending ||
      editBudgetMutation.isPending ||
      addGoalMutation.isPending ||
      editGoalMutation.isPending,
  }
}
