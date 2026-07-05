import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { useAuth } from '@/hooks/useAuth'
import { PennyWingsMark } from '@/sections/shared'

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50">
        <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white px-5 py-4 text-sm font-bold text-pink-600">
          <PennyWingsMark className="h-6 w-6" />
          Loading PennyWings...
        </div>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
