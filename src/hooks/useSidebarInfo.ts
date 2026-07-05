import { useEffect, useMemo, useState } from 'react'

import { fetchSidebarProfile } from '@/services/sidebarService'
import type { SidebarInfo, SidebarProfile } from '@/types'

const getEmailName = (email: string | null | undefined) =>
  email?.split('@')[0] || 'PennyWings User'

export function useSidebarInfo(
  userId: string | undefined,
  email: string | null | undefined,
) {
  const [profile, setProfile] = useState<SidebarProfile | null>(null)
  const [loading, setLoading] = useState(Boolean(userId))

  useEffect(() => {
    let mounted = true

    if (!userId) {
      return
    }

    const loadSidebarProfile = async () => {
      setLoading(true)

      const { data } = await fetchSidebarProfile(userId)

      if (mounted) {
        setProfile(data)
        setLoading(false)
      }
    }

    void loadSidebarProfile()

    return () => {
      mounted = false
    }
  }, [userId])

  return useMemo<SidebarInfo>(
    () => ({
      avatarUrl: userId ? profile?.avatar_url ?? null : null,
      displayName: userId
        ? profile?.full_name || getEmailName(email)
        : 'PennyWings User',
      email: email ?? null,
      loading: userId ? loading : false,
    }),
    [email, loading, profile?.avatar_url, profile?.full_name, userId],
  )
}
