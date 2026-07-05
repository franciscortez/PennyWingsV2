import { supabase } from '@/lib/supabase'
import type { SidebarProfile } from '@/types'

export const fetchSidebarProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .single<SidebarProfile>()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }

  return { data, error }
}
