import { useAuth } from '@/hooks/useAuth'
import { alerts } from '@/lib/alert'

export function useSignOutConfirmation() {
  const { signOut } = useAuth()

  return async () => {
    const confirmed = await alerts.confirmLogout()
    if (confirmed) void signOut()
  }
}
