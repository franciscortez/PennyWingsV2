import type { User } from '@supabase/supabase-js'

import type { Tables } from '@/lib/database.types'

export type Profile = Tables<'profiles'>

export type ProfileUpdate = Partial<Pick<Profile, 'full_name' | 'avatar_url'>>

export type DeleteUserResponse = {
  deleted: true
}

export type AuthResult<TData = unknown> = Promise<{
  data: TData | null
  error: Error | null
}>

export type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  deleteAccount: (password?: string) => AuthResult<DeleteUserResponse>
  reauthenticateWithGoogleForDeletion: () => AuthResult
  refreshProfile: () => Promise<void>
  resetPassword: (email: string) => AuthResult<void>
  signIn: (email: string, password: string) => AuthResult
  signInWithGoogle: () => AuthResult
  signOut: () => AuthResult<void>
  signUp: (email: string, password: string) => AuthResult
  updatePassword: (password: string) => AuthResult
  updateProfile: (updates: ProfileUpdate) => AuthResult<Profile>
}
