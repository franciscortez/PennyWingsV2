import {
  FunctionsHttpError,
  type AuthChangeEvent,
  type Session,
  type User,
} from '@supabase/supabase-js'

import {
  clearPendingGoogleDeletion,
  storePendingGoogleDeletion,
} from '@/lib/accountDeletion'
import { AppError } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { DeleteUserResponse, Profile, ProfileUpdate } from '@/types'

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

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw AppError.from(error)
  return data.session
}

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw AppError.from(error)
  return data.user
}

export const onAuthStateChange = (callback: AuthStateChangeCallback) =>
  supabase.auth.onAuthStateChange(callback)

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw AppError.from(error)
  return data
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw AppError.from(error)
  return data
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl('/dashboard'),
    },
  })

  if (error) throw AppError.from(error)
  return data
}

export const reauthenticateWithGoogleForDeletion = async (user: User) => {
  if (!storePendingGoogleDeletion(user)) {
    throw new AppError('Unable to prepare Google verification.')
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        ...(user.email ? { login_hint: user.email } : {}),
        prompt: 'select_account',
      },
      redirectTo: getRedirectUrl('/profile'),
    },
  })

  if (error) {
    clearPendingGoogleDeletion()
    throw AppError.from(error)
  }

  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw AppError.from(error)
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl('/reset-password'),
  })

  if (error) throw AppError.from(error)
}

export const updatePassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password })
  if (error) throw AppError.from(error)
  return data
}

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()

  if (error?.code === 'PGRST116') {
    return null
  }

  if (error) throw AppError.from(error)
  return data
}

export const createProfile = async (user: User) => {
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User'
  const avatarUrl = user.user_metadata?.avatar_url || null

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      avatar_url: avatarUrl,
      full_name: fullName,
      id: user.id,
    })
    .select()
    .single<Profile>()

  if (error) throw AppError.from(error)
  return data
}

export const updateProfile = async (
  userId: string,
  updates: ProfileUpdate,
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single<Profile>()

  if (error) throw AppError.from(error)
  return data
}

const getFunctionError = async (error: Error) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = (await error.context.json()) as { error?: unknown }

      if (typeof body.error === 'string') {
        return new AppError(body.error)
      }
    } catch {
      // Fall through to the safe generic message.
    }
  }

  return new AppError('Unable to delete your account. Please try again.')
}

export const deleteAccount = async (
  user: User,
  password?: string,
): Promise<DeleteUserResponse> => {
  const isGoogle =
    user.app_metadata?.provider === 'google' ||
    user.identities?.some((id) => id.provider === 'google')

  if (!isGoogle) {
    if (!user.email) {
      throw new AppError('User email is required.')
    }

    if (!password) {
      throw new AppError('Password is required for deletion.')
    }

    try {
      await signIn(user.email, password)
    } catch {
      throw new AppError('Incorrect password. Please try again.')
    }
  }

  const { data, error } = await supabase.functions.invoke<DeleteUserResponse>(
    'delete-user',
    { method: 'POST' },
  )

  if (error) {
    throw await getFunctionError(error)
  }

  if (!data) throw new AppError('Unable to delete your account. Please try again.')

  clearPendingGoogleDeletion()
  await supabase.auth.signOut({ scope: 'local' })

  return data
}

export const authService = {
  createProfile,
  deleteAccount,
  fetchProfile,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  reauthenticateWithGoogleForDeletion,
  resetPassword,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
  updatePassword,
  updateProfile,
}
