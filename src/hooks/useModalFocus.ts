import { useLayoutEffect, useRef, type RefObject } from 'react'

import {
  canReceiveFocus,
  focusFallback,
  focusWithoutScroll,
  getTabbableElements,
} from '@/lib/focusable'
import { registerModalLayer } from '@/lib/modalLayers'

type UseModalFocusOptions = {
  /** The dialog panel; the default initial-focus target and Tab boundary. */
  dialogRef: RefObject<HTMLElement | null>
  /** Receives focus on open instead of the dialog panel. */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Whether this modal is the topmost overlay (see `overlayStack.ts`). */
  isTopmost: () => boolean
  /** The portaled overlay element that stays interactive above the page. */
  layerRef: RefObject<HTMLElement | null>
  /** Receives focus on close instead of the element focused before opening. */
  returnFocusRef?: RefObject<HTMLElement | null>
}

/**
 * Modal keyboard behaviour (issue #37): moves focus inside on open, keeps Tab
 * and Shift+Tab inside while topmost, makes the rest of the page inert, and on
 * close returns focus to the opener — or, when the opener is gone, to the page
 * heading via `focusFallback`. Focus never scrolls the page.
 *
 * Call after `useScrollLock` so its cleanup restores the page position first.
 */
export function useModalFocus({
  dialogRef,
  initialFocusRef,
  isTopmost,
  layerRef,
  returnFocusRef,
}: UseModalFocusOptions): void {
  const isTopmostRef = useRef(isTopmost)

  useLayoutEffect(() => {
    isTopmostRef.current = isTopmost
  })

  useLayoutEffect(() => {
    const layer = layerRef.current
    const dialog = dialogRef.current

    if (!layer || !dialog) {
      return undefined
    }

    const doc = layer.ownerDocument
    // Read before the page turns inert: inerting a focused opener blurs it.
    const opener = returnFocusRef?.current ?? doc.activeElement
    const handle = registerModalLayer(layer)

    const initialTarget = initialFocusRef?.current ?? dialog
    if (!focusWithoutScroll(initialTarget) && initialTarget !== dialog) {
      focusWithoutScroll(dialog)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Tab' ||
        event.defaultPrevented ||
        !isTopmostRef.current()
      ) {
        return
      }

      const tabbable = getTabbableElements(dialog)
      const active = doc.activeElement

      if (tabbable.length === 0) {
        event.preventDefault()
        focusWithoutScroll(dialog)
        return
      }

      const first = tabbable[0]
      const last = tabbable[tabbable.length - 1]
      const outside = !(active instanceof Node) || !dialog.contains(active)

      if (event.shiftKey && (outside || active === first || active === dialog)) {
        event.preventDefault()
        focusWithoutScroll(last)
      } else if (!event.shiftKey && (outside || active === last)) {
        event.preventDefault()
        focusWithoutScroll(first)
      }
    }

    // Catches focus moved outside by script rather than by keyboard.
    const handleFocusIn = (event: FocusEvent) => {
      if (!isTopmostRef.current()) {
        return
      }

      const target = event.target

      if (target instanceof Node && !layer.contains(target)) {
        focusWithoutScroll(dialog)
      }
    }

    // Catches focus dropping to the body, e.g. when the focused Save button
    // becomes disabled while saving; keeps screen readers inside the dialog.
    let focusOutFrame = 0
    const handleFocusOut = () => {
      window.cancelAnimationFrame(focusOutFrame)
      focusOutFrame = window.requestAnimationFrame(() => {
        const active = doc.activeElement

        if (
          isTopmostRef.current() &&
          dialog.isConnected &&
          (!active || active === doc.body)
        ) {
          focusWithoutScroll(dialog)
        }
      })
    }

    doc.addEventListener('keydown', handleKeyDown)
    doc.addEventListener('focusin', handleFocusIn)
    layer.addEventListener('focusout', handleFocusOut)

    return () => {
      window.cancelAnimationFrame(focusOutFrame)
      doc.removeEventListener('keydown', handleKeyDown)
      doc.removeEventListener('focusin', handleFocusIn)
      layer.removeEventListener('focusout', handleFocusOut)
      handle.release()

      // Only reclaim focus this modal owned: leave it alone if another layer
      // (an alert, the assistant) has already taken it.
      const active = doc.activeElement
      const ownsFocus =
        !active || active === doc.body || layer.contains(active)

      if (!ownsFocus) {
        return
      }

      // Restore synchronously so a StrictMode re-run captures the opener again.
      if (canReceiveFocus(opener)) {
        focusWithoutScroll(opener)
      }

      // Re-check after the rest of the commit: the opener or the page heading
      // may be removed in the same update (a route change, a list re-render).
      queueMicrotask(() => {
        const current = doc.activeElement

        if (!current || current === doc.body) {
          focusFallback(doc)
        }
      })
    }
    // Mount-only: the modal's open lifetime is its mount lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
