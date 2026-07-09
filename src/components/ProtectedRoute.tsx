import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { PageLoader } from '@/components/ui'
import { ThemeProvider } from '@/context/ThemeContext'
import { useAuth } from '@/hooks/useAuth'

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <ThemeProvider>
        <PageLoader />
      </ThemeProvider>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <ThemeProvider>{children}</ThemeProvider>
}
