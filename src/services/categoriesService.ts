import { supabase } from '@/lib/supabase'
import type { TransactionCategory } from '@/types'

type CategoryRow = {
  color: string | null
  icon: string | null
  id: string
  name: string
  type: 'income' | 'expense'
}

export const fetchCategories = async (
  userId: string,
): Promise<TransactionCategory[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, type, icon, color')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  return ((data ?? []) as CategoryRow[]).map((category) => ({
    color: category.color,
    icon: category.icon,
    id: category.id,
    name: category.name,
    type: category.type,
  }))
}

