import type { User } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  deleteAccount as deleteAccountService,
  fetchProfile,
  getSession,
  onAuthStateChange,
  resetPassword as resetPasswordService,
  signIn as signInService,
  signInWithGoogle as signInWithGoogleService,
  signOut as signOutService,
  signUp as signUpService,
  updatePassword as updatePasswordService,
  updateProfile as updateProfileService,
} from '@/services/authService'
import { AuthContext } from '@/context/authContextValue'
import type { AuthContextValue, Profile, ProfileUpdate } from '@/types'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await fetchProfile(userId)
    setProfile(data)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    await loadProfile(user.id)
  }, [loadProfile, user])

  useEffect(() => {
    let mounted = true

    if (window.location.hash.includes('access_token')) {
      getSession().then(({ data: { session } }) => {
        if (!mounted || !session) {
          return
        }

        setUser(session.user)
        void loadProfile(session.user.id)
        window.history.replaceState(null, '', window.location.pathname)
      })
    }

    getSession()
      .then(({ data: { session } }) => {
        if (!mounted) {
          return
        }

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          void loadProfile(currentUser.id)
        } else {
          setProfile(null)
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        void loadProfile(currentUser.id)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const updateProfile = useCallback(
    async (updates: ProfileUpdate) => {
      if (!user) {
        return { data: null, error: new Error('No user logged in.') }
      }

      const { data, error } = await updateProfileService(user.id, updates)

      if (!error) {
        setProfile(data)
      }

      return { data, error }
    },
    [user],
  )

  const deleteAccount = useCallback(
    async (password: string) => {
      if (!user) {
        return { data: null, error: new Error('No user logged in.') }
      }

      return deleteAccountService(user, password)
    },
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      deleteAccount,
      refreshProfile,
      resetPassword: resetPasswordService,
      signIn: signInService,
      signInWithGoogle: signInWithGoogleService,
      signOut: signOutService,
      signUp: signUpService,
      updatePassword: updatePasswordService,
      updateProfile,
    }),
    [deleteAccount, loading, profile, refreshProfile, updateProfile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
