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

export function registerOverlay(doc: Document = document): OverlayHandle {
  const token = Symbol('overlay')
  const stack = overlayStacks.get(doc) ?? []
  stack.push(token)
  overlayStacks.set(doc, stack)

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
    },
  }
}

/** Number of registered overlays; exposed for ordering tests and diagnostics. */
export function getOverlayCount(doc: Document = document) {
  return overlayStacks.get(doc)?.length ?? 0
}
