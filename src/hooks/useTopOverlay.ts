import { useSyncExternalStore } from 'react'
import { subscribeOverlays, topOverlaySnapshot } from '@/lib/overlayStack'

export function useTopOverlay() {
  return useSyncExternalStore(subscribeOverlays, topOverlaySnapshot, () => null)
}
