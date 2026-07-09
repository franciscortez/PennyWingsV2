import type { User } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  createProfile,
  deleteAccount as deleteAccountService,
  fetchProfile,
  getCurrentUser,
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

const MIN_INITIAL_LOADING_MS = 900

const wait = (duration: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration)
  })

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (authUser: User) => {
    const { data, error } = await fetchProfile(authUser.id)
    if (error) {
      console.error(error)
      return
    }

    if (data) {
      setProfile(data)
    } else {
      const { data: newProfile, error: createError } = await createProfile(authUser)

      if (!createError && newProfile) {
        setProfile(newProfile)
      } else {
        console.error('Failed to auto-create profile:', createError)
      }
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    await loadProfile(user)
  }, [loadProfile, user])

  useEffect(() => {
    let mounted = true
    let bootstrapping = true

    const bootstrapAuth = async () => {
      const minimumLoader = wait(MIN_INITIAL_LOADING_MS)

      try {
        if (window.location.hash.includes('access_token')) {
          const {
            data: { session },
          } = await getSession()

          if (session) {
            window.history.replaceState(null, '', window.location.pathname)
          }
        }

        const {
          data: { session },
        } = await getSession()

        let currentUser: User | null = null

        if (session) {
          const {
            data: { user: verifiedUser },
            error,
          } = await getCurrentUser()

          currentUser = error ? null : verifiedUser
        }

        if (!mounted) {
          return
        }

        setUser(currentUser)

        if (currentUser) {
          await loadProfile(currentUser)
        } else {
          setProfile(null)
        }
      } finally {
        await minimumLoader
        bootstrapping = false

        if (mounted) {
          setLoading(false)
        }
      }
    }

    void bootstrapAuth()

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        void loadProfile(currentUser)
      } else {
        setProfile(null)
      }

      if (!bootstrapping) {
        setLoading(false)
      }
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
