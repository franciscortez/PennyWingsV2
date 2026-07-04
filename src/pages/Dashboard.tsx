import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router'

import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { loading: authLoading, signOut, user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await signOut()
    setLoading(false)
  }

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-pink-50 px-4">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading || authLoading}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 px-6 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-pink-700 hover:to-pink-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </main>
  )
}
