import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryClient'
import { invalidateDebtCaches } from '@/lib/queryInvalidation'
import {
  archiveDebt as archiveDebtService,
  createDebt,
  fetchDebtPayments,
  fetchDebts,
  payDebt as payDebtService,
  reverseDebtPayment as reverseDebtPaymentService,
  unarchiveDebt as unarchiveDebtService,
  updateDebt as updateDebtService,
} from '@/services/debtsService'
import type {
  DebtCreateValues,
  DebtPayMutationValues,
  DebtStatus,
  DebtSummaryStats,
  DebtUpdateValues,
} from '@/types'

export function useDebtsData(
  userId: string | undefined,
  statusFilter: DebtStatus | 'all' = 'all',
) {
  const queryClient = useQueryClient()

  const debtsQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchDebts(statusFilter),
    queryKey: [...queryKeys.debts(userId ?? 'anonymous'), statusFilter],
  })

  const paymentsQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchDebtPayments(),
    queryKey: queryKeys.debtPayments(userId ?? 'anonymous'),
  })

  const refreshDebtCaches = useCallback(async () => {
    if (!userId) return
    await invalidateDebtCaches(queryClient, userId)
  }, [queryClient, userId])

  const addMutation = useMutation({
    mutationFn: (values: DebtCreateValues) => createDebt(values),
    onSuccess: refreshDebtCaches,
  })

  const editMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: DebtUpdateValues }) =>
      updateDebtService(id, values),
    onSuccess: refreshDebtCaches,
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveDebtService(id),
    onSuccess: refreshDebtCaches,
  })

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => unarchiveDebtService(id),
    onSuccess: refreshDebtCaches,
  })

  const payMutation = useMutation({
    mutationFn: (values: DebtPayMutationValues) => payDebtService(values),
    onSuccess: refreshDebtCaches,
  })

  const reverseMutation = useMutation({
    mutationFn: ({
      paymentId,
      reason,
    }: {
      paymentId: string
      reason?: string
    }) => reverseDebtPaymentService(paymentId, reason),
    onSuccess: refreshDebtCaches,
  })

  const debts = useMemo(() => debtsQuery.data ?? [], [debtsQuery.data])
  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data])

  const stats = useMemo<DebtSummaryStats>(() => {
    const today = new Date().toISOString().slice(0, 10)
    const in3DaysDate = new Date()
    in3DaysDate.setDate(in3DaysDate.getDate() + 3)
    const in3Days = in3DaysDate.toISOString().slice(0, 10)

    let totalOutstanding = 0
    let totalSettled = 0
    let overdueCount = 0
    let dueSoonCount = 0

    for (const debt of debts) {
      if (debt.status === 'outstanding') {
        totalOutstanding += debt.outstandingAmount
        totalSettled += debt.originalAmount - debt.outstandingAmount

        if (debt.dueDate) {
          if (debt.dueDate < today) {
            overdueCount++
          } else if (debt.dueDate <= in3Days) {
            dueSoonCount++
          }
        }
      } else if (debt.status === 'paid') {
        totalSettled += debt.originalAmount
      }
    }

    return {
      dueSoonCount,
      overdueCount,
      totalCount: debts.length,
      totalOutstanding,
      totalSettled,
    }
  }, [debts])

  const addDebt = useCallback(
    async (values: DebtCreateValues): Promise<boolean> => {
      try {
        await addMutation.mutateAsync(values)
        return true
      } catch {
        return false
      }
    },
    [addMutation],
  )

  const editDebt = useCallback(
    async (id: string, values: DebtUpdateValues): Promise<boolean> => {
      try {
        await editMutation.mutateAsync({ id, values })
        return true
      } catch {
        return false
      }
    },
    [editMutation],
  )

  const archiveDebt = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await archiveMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [archiveMutation],
  )

  const unarchiveDebt = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await unarchiveMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [unarchiveMutation],
  )

  const payDebt = useCallback(
    async (values: DebtPayMutationValues): Promise<boolean> => {
      try {
        await payMutation.mutateAsync(values)
        return true
      } catch {
        return false
      }
    },
    [payMutation],
  )

  const reversePayment = useCallback(
    async (paymentId: string, reason?: string): Promise<boolean> => {
      try {
        await reverseMutation.mutateAsync({ paymentId, reason })
        return true
      } catch {
        return false
      }
    },
    [reverseMutation],
  )

  const queryError = debtsQuery.error ?? paymentsQuery.error
  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'Unable to load debts.'
        : null

  return {
    addDebt,
    archiveDebt,
    debts,
    dueSoonCount: stats.dueSoonCount,
    editDebt,
    error: userId ? error : null,
    loading: debtsQuery.isLoading || paymentsQuery.isLoading,
    overdueCount: stats.overdueCount,
    payDebt,
    payments,
    reload: refreshDebtCaches,
    reversePayment,
    saving:
      addMutation.isPending ||
      editMutation.isPending ||
      archiveMutation.isPending ||
      unarchiveMutation.isPending ||
      payMutation.isPending ||
      reverseMutation.isPending,
    totalOutstanding: stats.totalOutstanding,
    totalSettled: stats.totalSettled,
    unarchiveDebt,
  }
}
