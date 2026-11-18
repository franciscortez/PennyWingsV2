import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { queryKeys } from '@/lib/queryClient'
import type { TransactionsListData } from '@/types'

/**
 * Returns a reader for the category ids in the transactions already cached
 * this session, most recent first. The form calls it once when it opens, so
 * the order stays put while someone chooses. It never fetches: a cold cache
 * simply leaves the categories in their alphabetical order.
 */
export function useRecentCategoryIds(userId: string | undefined): () => string[] {
  const queryClient = useQueryClient()

  return useCallback(() => {
    if (!userId) return []

    const latest = new Map<string, string>()
    for (const [, data] of queryClient.getQueriesData<TransactionsListData>({
      queryKey: queryKeys.transactions(userId),
    })) {
      if (!Array.isArray(data?.transactions)) continue
      for (const transaction of data.transactions) {
        const id = transaction.category_id
        if (!id) continue
        const stamp = `${transaction.transaction_date}|${transaction.created_at ?? ''}`
        const previous = latest.get(id)
        if (previous === undefined || stamp > previous) latest.set(id, stamp)
      }
    }

    return [...latest.entries()]
      .sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0))
      .map(([id]) => id)
  }, [queryClient, userId])
}
