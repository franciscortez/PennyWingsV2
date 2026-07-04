import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import type { Profile, ProfileUpdate } from '@/types'

type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null,
) => void

const getRedirectUrl = (path: string) => {
  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}

export const getSession = () => supabase.auth.getSession()

export const getCurrentUser = () => supabase.auth.getUser()

export const onAuthStateChange = (callback: AuthStateChangeCallback) =>
  supabase.auth.onAuthStateChange(callback)

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password })

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl('/dashboard'),
    },
  })

export const signOut = () => supabase.auth.signOut()

export const resetPassword = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl('/reset-password'),
  })

export const updatePassword = (password: string) =>
  supabase.auth.updateUser({ password })

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()

  if (error?.code === 'PGRST116') {
    return { data: null, error: null }
  }

  return { data, error }
}

export const updateProfile = async (userId: string, updates: ProfileUpdate) =>
  supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single<Profile>()

export const deleteAccount = async (user: User, password: string) => {
  if (!user.email) {
    return { data: null, error: new Error('User email is required.') }
  }

  if (!password) {
    return { data: null, error: new Error('Password is required for deletion.') }
  }

  const { error: reauthError } = await signIn(user.email, password)

  if (reauthError) {
    return {
      data: null,
      error: new Error('Incorrect password. Please try again.'),
    }
  }

  const { data, error } = await supabase.functions.invoke('delete-user')

  if (error) {
    return { data: null, error }
  }

  await signOut()

  return { data, error: null }
}

export const authService = {
  deleteAccount,
  fetchProfile,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  resetPassword,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  updatePassword,
  updateProfile,
}
