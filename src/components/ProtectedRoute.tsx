import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { rememberReturnTarget, readReturnTarget, clearReturnTarget } from '@/lib/navigationState'

import { PageLoader } from '@/components/ui'
import { ThemeProvider } from '@/context/ThemeContext'
import { useAuth } from '@/hooks/useAuth'

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, user } = useAuth()
  const location = useLocation()
  const current = location.pathname + location.search + location.hash
  useEffect(() => {
    if (loading) return
    if (!user) rememberReturnTarget(current)
  }, [current, loading, user])

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

  return <SignedInEntry key={user.id}>{children}</SignedInEntry>
}

function SignedInEntry({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const [entry] = useState(() => ({ key: location.key, target: readReturnTarget() }))
  useEffect(clearReturnTarget, [])
  if (location.key === entry.key && location.pathname === '/dashboard' && entry.target !== '/dashboard') return <Navigate to={entry.target} replace />
  return <ThemeProvider>{children}</ThemeProvider>
}
