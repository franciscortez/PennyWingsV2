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
  reauthenticateWithGoogleForDeletion as reauthenticateWithGoogleForDeletionService,
  resetPassword as resetPasswordService,
  signIn as signInService,
  signInWithGoogle as signInWithGoogleService,
  signOut as signOutService,
  signUp as signUpService,
  updatePassword as updatePasswordService,
  updateProfile as updateProfileService,
} from '@/services/authService'
import { AuthContext } from '@/context/authContextValue'
import { AppError } from '@/lib/errors'
import type {
  AuthContextValue,
  AuthResult,
  Profile,
  ProfileUpdate,
} from '@/types'

type AuthProviderProps = {
  children: ReactNode
}

const MIN_INITIAL_LOADING_MS = 900

const wait = (duration: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration)
  })

const runAuthOperation = async <T,>(
  operation: () => Promise<T>,
): AuthResult<T> => {
  try {
    return { data: await operation(), error: null }
  } catch (error) {
    return { data: null, error: AppError.from(error) }
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (authUser: User) => {
    try {
      const existingProfile = await fetchProfile(authUser.id)

      if (existingProfile) {
        setProfile(existingProfile)
      } else {
        setProfile(await createProfile(authUser))
      }
    } catch {
      console.error('Failed to load profile.')
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
          const session = await getSession()

          if (session) {
            window.history.replaceState(null, '', window.location.pathname)
          }
        }

        const session = await getSession()

        let currentUser: User | null = null

        if (session) {
          currentUser = await getCurrentUser()
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
      } catch {
        console.error('Failed to initialize authentication.')

        if (mounted) {
          setUser(null)
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
        return { data: null, error: new AppError('No user logged in.') }
      }

      return runAuthOperation(async () => {
        const updatedProfile = await updateProfileService(user.id, updates)
        setProfile(updatedProfile)
        return updatedProfile
      })
    },
    [user],
  )

  const deleteAccount = useCallback(
    async (password?: string) => {
      if (!user) {
        return { data: null, error: new AppError('No user logged in.') }
      }

      return runAuthOperation(() => deleteAccountService(user, password))
    },
    [user],
  )

  const reauthenticateWithGoogleForDeletion = useCallback(async () => {
    if (!user) {
      return { data: null, error: new AppError('No user logged in.') }
    }

    return runAuthOperation(() =>
      reauthenticateWithGoogleForDeletionService(user),
    )
  }, [user])

  const resetPassword = useCallback(
    (email: string) => runAuthOperation(() => resetPasswordService(email)),
    [],
  )

  const signIn = useCallback(
    (email: string, password: string) =>
      runAuthOperation(() => signInService(email, password)),
    [],
  )

  const signInWithGoogle = useCallback(
    () => runAuthOperation(() => signInWithGoogleService()),
    [],
  )

  const signOut = useCallback(
    () => runAuthOperation(() => signOutService()),
    [],
  )

  const signUp = useCallback(
    (email: string, password: string) =>
      runAuthOperation(() => signUpService(email, password)),
    [],
  )

  const updatePassword = useCallback(
    (password: string) =>
      runAuthOperation(() => updatePasswordService(password)),
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      deleteAccount,
      reauthenticateWithGoogleForDeletion,
      refreshProfile,
      resetPassword,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      updatePassword,
      updateProfile,
    }),
    [
      deleteAccount,
      loading,
      profile,
      reauthenticateWithGoogleForDeletion,
      refreshProfile,
      resetPassword,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      updatePassword,
      updateProfile,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
