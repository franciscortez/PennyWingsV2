import type { User } from '@supabase/supabase-js'

import type {
  resetPassword,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  updatePassword,
} from '@/services/authService'

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type ProfileUpdate = Partial<Pick<Profile, 'full_name' | 'avatar_url'>>

export type AuthResult<TData = unknown> = Promise<{
  data: TData | null
  error: Error | null
}>

export type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  deleteAccount: (password: string) => AuthResult
  refreshProfile: () => Promise<void>
  resetPassword: typeof resetPassword
  signIn: typeof signIn
  signInWithGoogle: typeof signInWithGoogle
  signOut: typeof signOut
  signUp: typeof signUp
  updatePassword: typeof updatePassword
  updateProfile: (updates: ProfileUpdate) => AuthResult<Profile>
}
