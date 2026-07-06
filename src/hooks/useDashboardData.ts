import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryClient'
import {
  emptyDashboardData,
  fetchDashboardData,
} from '@/services/dashboardService'

export function useDashboardData(userId: string | undefined, txLimit = 5) {
  const dashboardQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () =>
      userId ? fetchDashboardData(userId, txLimit) : emptyDashboardData,
    queryKey: queryKeys.dashboardData(userId ?? 'anonymous', txLimit),
  })

  const error =
    dashboardQuery.error instanceof Error
      ? dashboardQuery.error.message
      : dashboardQuery.error
        ? 'Unable to load dashboard data.'
        : null

  return {
    ...(userId ? (dashboardQuery.data ?? emptyDashboardData) : emptyDashboardData),
    loading: userId ? dashboardQuery.isLoading : false,
    error: userId ? error : null,
  }
}
