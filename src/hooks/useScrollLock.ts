import { useLayoutEffect } from 'react'

import { acquireScrollLock } from '@/lib/scrollLock'

/**
 * Holds a shared document scroll lock while `enabled` is true.
 *
 * `enabled` must be a stable expression — a boolean derived from overlay state,
 * never from form values — because every flip releases and re-acquires the
 * lock. The effect runs before paint so the page never shows an unlocked frame
 * between the click that opens an overlay and the lock taking hold.
 */
export function useScrollLock(enabled: boolean): void {
  useLayoutEffect(() => {
    if (!enabled) {
      return undefined
    }

    return acquireScrollLock(document)
  }, [enabled])
}
