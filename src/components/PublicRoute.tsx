import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Navigate } from 'react-router'

import { PageLoader } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { syncThemeColor } from '@/lib/theme'

type PublicRouteProps = {
  children: ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { loading, user } = useAuth()

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
    syncThemeColor('light')
  }, [])

  if (loading) {
    return <PageLoader forceLight />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
