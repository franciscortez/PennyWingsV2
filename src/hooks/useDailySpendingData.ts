import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/queryClient'
import { fetchDailySpending } from '@/services/reportsService'
import type { DailySpendingCalendar } from '@/types'

// Mirrors the `month` the service returns, so consumers never see the shape
// change between the fallback and a resolved query.
const emptyCalendar = (month: string): DailySpendingCalendar => ({
  days: [],
  maxDailyTotal: 0,
  month: `${month.slice(0, 7)}-01`,
  totalSpent: 0,
})

export function useDailySpendingData(
  userId: string | undefined,
  month: string,
) {
  const dailySpendingKey = queryKeys.dailySpending(
    userId ?? 'anonymous',
    month,
  )

  const dailySpendingQuery = useQuery({
    enabled: Boolean(userId),
    queryFn: () =>
      userId ? fetchDailySpending(userId, month) : emptyCalendar(month),
    queryKey: dailySpendingKey,
  })

  const error =
    dailySpendingQuery.error instanceof Error
      ? dailySpendingQuery.error.message
      : dailySpendingQuery.error
        ? 'Unable to load daily spending.'
        : null

  return {
    calendar: dailySpendingQuery.data ?? emptyCalendar(month),
    error: userId ? error : null,
    loading: userId ? dailySpendingQuery.isLoading : false,
  }
}
