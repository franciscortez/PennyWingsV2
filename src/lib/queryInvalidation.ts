import type { QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryClient'

export const invalidateAccountCaches = (
  queryClient: QueryClient,
  userId: string,
) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts(userId) }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.archivedAccounts(userId),
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports(userId) }),
  ])

export const invalidateMonitoringCaches = (
  queryClient: QueryClient,
  userId: string,
) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.monitoring(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) }),
  ])

export const invalidateTransactionCaches = (
  queryClient: QueryClient,
  userId: string,
) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports(userId) }),
  ])

export const invalidateDebtCaches = (
  queryClient: QueryClient,
  userId: string,
) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.debts(userId) }),
    queryClient.invalidateQueries({ queryKey: ['debtCharges', userId] }),
    queryClient.invalidateQueries({ queryKey: ['debtPayments', userId] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reports(userId) }),
  ])
