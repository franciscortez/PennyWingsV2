/**
 * Overlay order registry (issue #35).
 *
 * Escape is owned by the topmost overlay only. Without a shared order, a
 * document-level listener on a form below another layer would close in response
 * to a keystroke aimed at the layer above it. Scroll ownership stays separate:
 * see `src/lib/scrollLock.ts`.
 */

export type OverlayHandle = {
  isTopmost: () => boolean
  release: () => void
}

const overlayStacks = new WeakMap<Document, symbol[]>()
const listeners = new Set<() => void>()

export function subscribeOverlays(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function topOverlaySnapshot() {
  return overlayStacks.get(document)?.at(-1) ?? null
}

export function registerOverlay(doc: Document = document, token = Symbol('overlay')): OverlayHandle {
  const stack = overlayStacks.get(doc) ?? []
  stack.push(token)
  overlayStacks.set(doc, stack)
  listeners.forEach(listener => listener())

  let released = false

  return {
    isTopmost: () => {
      const current = overlayStacks.get(doc)

      return !released && Boolean(current) && current?.[current.length - 1] === token
    },
    release: () => {
      if (released) {
        return
      }

      released = true
      const current = overlayStacks.get(doc)

      if (!current) {
        return
      }

      const index = current.indexOf(token)

      if (index >= 0) {
        current.splice(index, 1)
      }

      if (current.length === 0) {
        overlayStacks.delete(doc)
      }
      listeners.forEach(listener => listener())
    },
  }
}

/** Number of registered overlays; exposed for ordering tests and diagnostics. */
export function getOverlayCount(doc: Document = document) {
  return overlayStacks.get(doc)?.length ?? 0
}
