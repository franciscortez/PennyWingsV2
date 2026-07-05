import { useEffect, useState } from 'react'

import {
  emptyDashboardData,
  fetchDashboardData,
} from '@/services/dashboardService'
import type { DashboardData } from '@/types/dashboard'

export function useDashboardData(userId: string | undefined, txLimit = 5) {
  const [data, setData] = useState<DashboardData>(emptyDashboardData)
  const [loading, setLoading] = useState(Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    if (!userId) {
      return
    }

    const loadDashboardData = async () => {
      setLoading(true)
      setError(null)

      try {
        const dashboardData = await fetchDashboardData(userId, txLimit)

        if (!mounted) {
          return
        }

        setData(dashboardData)
      } catch (dashboardError) {
        if (!mounted) {
          return
        }

        setError(
          dashboardError instanceof Error
            ? dashboardError.message
            : 'Unable to load dashboard data.',
        )
        setData(emptyDashboardData)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadDashboardData()

    return () => {
      mounted = false
    }
  }, [txLimit, userId])

  return {
    ...(userId ? data : emptyDashboardData),
    loading: userId ? loading : false,
    error: userId ? error : null,
  }
}
