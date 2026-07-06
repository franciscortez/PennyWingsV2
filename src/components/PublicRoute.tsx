import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { PageLoader } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

type PublicRouteProps = {
  children: ReactNode
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { loading, user } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
