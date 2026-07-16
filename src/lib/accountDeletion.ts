import type { User } from '@supabase/supabase-js'

const GOOGLE_DELETION_STORAGE_KEY = 'pennywings:google-deletion-reauth'
const GOOGLE_REAUTH_WINDOW_MS = 5 * 60 * 1_000

type PendingGoogleDeletion = {
  lastSignInAt: string | null
  requestedAt: number
  userId: string
}

export type GoogleDeletionReauthenticationStatus =
  | 'expired'
  | 'not-completed'
  | 'none'
  | 'user-mismatch'
  | 'valid'

const isPendingGoogleDeletion = (
  value: unknown,
): value is PendingGoogleDeletion => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    (typeof candidate.lastSignInAt === 'string' ||
      candidate.lastSignInAt === null) &&
    typeof candidate.requestedAt === 'number' &&
    typeof candidate.userId === 'string'
  )
}

export const clearPendingGoogleDeletion = () => {
  try {
    window.sessionStorage.removeItem(GOOGLE_DELETION_STORAGE_KEY)
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts.
  }
}

export const storePendingGoogleDeletion = (user: User) => {
  try {
    window.sessionStorage.setItem(
      GOOGLE_DELETION_STORAGE_KEY,
      JSON.stringify({
        lastSignInAt: user.last_sign_in_at ?? null,
        requestedAt: Date.now(),
        userId: user.id,
      } satisfies PendingGoogleDeletion),
    )
    return true
  } catch {
    return false
  }
}

export const consumePendingGoogleDeletion = (
  user: User,
): GoogleDeletionReauthenticationStatus => {
  let rawValue: string | null

  try {
    rawValue = window.sessionStorage.getItem(GOOGLE_DELETION_STORAGE_KEY)
    window.sessionStorage.removeItem(GOOGLE_DELETION_STORAGE_KEY)
  } catch {
    return 'none'
  }

  if (!rawValue) {
    return 'none'
  }

  let pending: unknown
  try {
    pending = JSON.parse(rawValue)
  } catch {
    return 'expired'
  }

  if (!isPendingGoogleDeletion(pending)) {
    return 'expired'
  }

  const age = Date.now() - pending.requestedAt
  if (age < 0 || age > GOOGLE_REAUTH_WINDOW_MS) {
    return 'expired'
  }

  if (pending.userId !== user.id) {
    return 'user-mismatch'
  }

  if (
    !user.last_sign_in_at ||
    user.last_sign_in_at === pending.lastSignInAt
  ) {
    return 'not-completed'
  }

  return 'valid'
}
