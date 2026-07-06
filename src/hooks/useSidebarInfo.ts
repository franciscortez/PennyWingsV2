import { useMemo } from 'react'

import type { SidebarInfo, Profile } from '@/types'

const getEmailName = (email: string | null | undefined) =>
  email?.split('@')[0] || 'PennyWings User'

export function useSidebarInfo(
  loading: boolean,
  email: string | null | undefined,
  profile: Profile | null,
) {
  return useMemo<SidebarInfo>(
    () => ({
      avatarUrl: profile?.avatar_url ?? null,
      displayName: profile?.full_name || getEmailName(email),
      email: email ?? null,
      loading,
    }),
    [email, loading, profile?.avatar_url, profile?.full_name],
  )
}
