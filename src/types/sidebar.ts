import type { Tables } from '@/lib/database.types'

export type SidebarProfile = Pick<
  Tables<'profiles'>,
  'avatar_url' | 'full_name' | 'id'
>

export type SidebarInfo = {
  avatarUrl: string | null
  displayName: string
  email: string | null
  loading: boolean
}
