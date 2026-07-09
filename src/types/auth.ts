import type { User } from '@supabase/supabase-js'

import type { Tables } from '@/lib/database.types'
import type {
  resetPassword,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  updatePassword,
} from '@/services/authService'

export type Profile = Tables<'profiles'>

export type ProfileUpdate = Partial<Pick<Profile, 'full_name' | 'avatar_url'>>

export type AuthResult<TData = unknown> = Promise<{
  data: TData | null
  error: Error | null
}>

export type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  deleteAccount: (password?: string) => AuthResult
  refreshProfile: () => Promise<void>
  resetPassword: typeof resetPassword
  signIn: typeof signIn
  signInWithGoogle: typeof signInWithGoogle
  signOut: typeof signOut
  signUp: typeof signUp
  updatePassword: typeof updatePassword
  updateProfile: (updates: ProfileUpdate) => AuthResult<Profile>
}
