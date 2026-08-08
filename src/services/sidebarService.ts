import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { SidebarProfile } from '@/types'

export const fetchSidebarProfile = async (
  userId: string,
): Promise<SidebarProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .single<SidebarProfile>()

  if (error?.code === 'PGRST116') {
    return null
  }

  if (error) throw AppError.from(error)
  return data
}
