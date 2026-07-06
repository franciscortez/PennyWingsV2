import { QueryClient } from '@tanstack/react-query'

import type { TransactionFilterType } from '@/types'

const cacheMinutes = 5

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: cacheMinutes * 60 * 1000,
    },
  },
})

export const queryKeys = {
  accounts: (userId: string) => ['accounts', userId] as const,
  categories: (userId: string) => ['categories', userId] as const,
  dashboard: (userId: string) => ['dashboard', userId] as const,
  dashboardData: (userId: string, txLimit: number) =>
    [...queryKeys.dashboard(userId), txLimit] as const,
  transactions: (userId: string) => ['transactions', userId] as const,
  transactionsList: (
    userId: string,
    params: {
      page: number
      pageSize: number
      search: string
      type: TransactionFilterType
    },
  ) =>
    [
      ...queryKeys.transactions(userId),
      'list',
      params.page,
      params.pageSize,
      params.search,
      params.type,
    ] as const,
}
