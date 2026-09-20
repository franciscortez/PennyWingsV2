import { useCallback, useSyncExternalStore } from 'react'

/**
 * Subscribes to a media query so layout decisions react to viewport changes
 * (rotation, browser resize, toolbar changes) instead of sampling the breakpoint
 * once when an effect starts.
 *
 * `useSyncExternalStore` is used deliberately: a `matchMedia` list is an
 * external store, and it keeps the first render's value in step with the media
 * query without a state-syncing effect.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onStoreChange)

      return () => mediaQuery.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
