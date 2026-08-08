import { supabase } from '@/lib/supabase'
import type { Tables } from '@/lib/database.types'
import { AppError } from '@/lib/errors'
import type { TransactionCategory } from '@/types'

type CategoryRow = Pick<
  Tables<'categories'>,
  'color' | 'icon' | 'id' | 'name' | 'type'
>

const parseCategoryType = (
  value: string,
): TransactionCategory['type'] => {
  if (value === 'income' || value === 'expense') {
    return value
  }

  throw new AppError(`Unsupported category type: ${value}`)
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
    throw AppError.from(error)
  }

  const categories: CategoryRow[] = data ?? []

  return categories.map((category) => ({
    color: category.color,
    icon: category.icon,
    id: category.id,
    name: category.name,
    type: parseCategoryType(category.type),
  }))
}

