import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryClient'
import { fetchMonthlyReports } from '@/services/reportsService'

export function useReportsData(userId: string | undefined) {
  const reportsKey = queryKeys.reports(userId ?? 'anonymous')

  const reportsQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () => (userId ? fetchMonthlyReports(userId) : []),
    queryKey: reportsKey,
  })

  const error =
    reportsQuery.error instanceof Error
      ? reportsQuery.error.message
      : reportsQuery.error
        ? 'Unable to load monthly reports.'
        : null

  return {
    error: userId ? error : null,
    loading: userId ? reportsQuery.isLoading : false,
    reports: reportsQuery.data ?? [],
  }
}
