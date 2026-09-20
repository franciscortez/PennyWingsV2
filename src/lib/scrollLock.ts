/**
 * Shared document scroll lock for overlays (issue #35).
 *
 * Every overlay that freezes the page acquires an owner token from this module
 * instead of writing `document.body.style` itself. Two overlays can be open at
 * once (a sheet handing off to the assistant, a modal above a dialog), and a
 * component that snapshots the page on its own would restore stale styles when
 * it closed underneath its neighbour.
 *
 * Ownership lives in a module-level registry keyed by `Document`, deliberately
 * outside React state: routes render their own `Layout`, so a route-local
 * registry would orphan a lock when a layout unmounts.
 *
 * Strategy (verified in browsers, not universal on iOS): freeze `body` at the
 * negative saved offset and stop the document itself from overflowing. Only the
 * first owner snapshots; every later owner joins that snapshot, and the page is
 * restored once, when the final owner releases.
 */

export type ReleaseScrollLock = () => void

type StyleSnapshot = {
  priority: string
  value: string
}

type ScrollSnapshot = {
  body: {
    left: StyleSnapshot
    overflow: StyleSnapshot
    paddingRight: StyleSnapshot
    position: StyleSnapshot
    top: StyleSnapshot
    width: StyleSnapshot
  }
  documentElement: {
    overflow: StyleSnapshot
    scrollBehavior: StyleSnapshot
  }
  scrollX: number
  scrollY: number
}

type DocumentLockState = {
  owners: Set<symbol>
  snapshot: ScrollSnapshot | null
}

const lockStates = new WeakMap<Document, DocumentLockState>()

const readStyle = (element: HTMLElement, property: string): StyleSnapshot => ({
  priority: element.style.getPropertyPriority(property),
  value: element.style.getPropertyValue(property),
})

const writeStyle = (element: HTMLElement, property: string, value: string) => {
  if (value) {
    element.style.setProperty(property, value)
    return
  }

  element.style.removeProperty(property)
}

/**
 * Restores the exact pre-lock inline declaration. A property that was never
 * set inline is removed again rather than replaced with an invented default,
 * and an `!important` declaration keeps its priority.
 */
const restoreStyle = (
  element: HTMLElement,
  property: string,
  snapshot: StyleSnapshot,
) => {
  if (snapshot.value) {
    element.style.setProperty(property, snapshot.value, snapshot.priority)
    return
  }

  element.style.removeProperty(property)
}

/**
 * Width of a classic (space-reserving) scrollbar. Overlay scrollbars and pages
 * that do not scroll report 0, so nothing is compensated for them. The value is
 * measured per lock instead of cached: a page can grow a scrollbar between two
 * overlays, and a hardcoded gutter would then shift the layout.
 */
const offsetValue = (offset: number) => (offset > 0 ? `-${offset}px` : '0px')

const measureScrollbarWidth = (doc: Document) => {
  const view = doc.defaultView

  if (!view) {
    return 0
  }

  const width = view.innerWidth - doc.documentElement.clientWidth

  return width > 0 ? width : 0
}

const lockDocumentScroll = (doc: Document): ScrollSnapshot => {
  const { body, documentElement } = doc
  const view = doc.defaultView
  const scrollbarWidth = measureScrollbarWidth(doc)
  const snapshot: ScrollSnapshot = {
    body: {
      left: readStyle(body, 'left'),
      overflow: readStyle(body, 'overflow'),
      paddingRight: readStyle(body, 'padding-right'),
      position: readStyle(body, 'position'),
      top: readStyle(body, 'top'),
      width: readStyle(body, 'width'),
    },
    documentElement: {
      overflow: readStyle(documentElement, 'overflow'),
      scrollBehavior: readStyle(documentElement, 'scroll-behavior'),
    },
    scrollX: view?.scrollX ?? 0,
    scrollY: view?.scrollY ?? 0,
  }

  writeStyle(body, 'overflow', 'hidden')
  writeStyle(body, 'position', 'fixed')
  writeStyle(body, 'top', offsetValue(snapshot.scrollY))
  writeStyle(body, 'left', offsetValue(snapshot.scrollX))
  writeStyle(body, 'width', '100%')
  writeStyle(documentElement, 'overflow', 'hidden')

  // Freezing the body removes the document scroller, so a classic scrollbar
  // releases its gutter and the page would jump wider. Only compensate when the
  // body does not already carry an inline padding-right, which would otherwise
  // be double-compensated.
  if (scrollbarWidth > 0 && !snapshot.body.paddingRight.value) {
    writeStyle(body, 'padding-right', `${scrollbarWidth}px`)
  }

  return snapshot
}


const unlockDocumentScroll = (doc: Document, snapshot: ScrollSnapshot) => {
  const { body, documentElement } = doc

  restoreStyle(body, 'left', snapshot.body.left)
  restoreStyle(body, 'overflow', snapshot.body.overflow)
  restoreStyle(body, 'padding-right', snapshot.body.paddingRight)
  restoreStyle(body, 'position', snapshot.body.position)
  restoreStyle(body, 'top', snapshot.body.top)
  restoreStyle(body, 'width', snapshot.body.width)
  restoreStyle(documentElement, 'overflow', snapshot.documentElement.overflow)

  const view = doc.defaultView

  if (!view) {
    return
  }

  // `html { scroll-behavior: smooth }` lives in the stylesheet, so restoration
  // has to opt out inline: otherwise the page animates back and the content is
  // seen drifting after an overlay closes.
  documentElement.style.setProperty('scroll-behavior', 'auto')

  // Clamped so a route change that happened while an overlay was open cannot
  // drag a short destination page down to the departed page's offset.
  const maxScrollY = Math.max(0, documentElement.scrollHeight - view.innerHeight)
  const maxScrollX = Math.max(0, documentElement.scrollWidth - view.innerWidth)

  view.scrollTo(
    Math.min(snapshot.scrollX, maxScrollX),
    Math.min(snapshot.scrollY, maxScrollY),
  )

  restoreStyle(
    documentElement,
    'scroll-behavior',
    snapshot.documentElement.scrollBehavior,
  )
}

const reassertDocumentScroll = (doc: Document, snapshot: ScrollSnapshot) => {
  const { body, documentElement } = doc
  const scrollbarWidth = measureScrollbarWidth(doc)

  writeStyle(body, 'overflow', 'hidden')
  writeStyle(body, 'position', 'fixed')
  writeStyle(body, 'top', offsetValue(snapshot.scrollY))
  writeStyle(body, 'left', offsetValue(snapshot.scrollX))
  writeStyle(body, 'width', '100%')
  writeStyle(documentElement, 'overflow', 'hidden')

  if (scrollbarWidth > 0 && !snapshot.body.paddingRight.value) {
    writeStyle(body, 'padding-right', `${scrollbarWidth}px`)
  }
}

/**
 * Registers one scroll-lock owner. The returned release is idempotent, so a
 * double invocation (StrictMode, a route unmount racing a close handler) can
 * never release another overlay's lock or restore the page twice.
 */
export function acquireScrollLock(doc: Document = document): ReleaseScrollLock {
  const owner = Symbol('scroll-lock-owner')
  const state = lockStates.get(doc) ?? {
    owners: new Set<symbol>(),
    snapshot: null,
  }

  lockStates.set(doc, state)
  state.owners.add(owner)

  if (state.owners.size === 1) {
    state.snapshot = lockDocumentScroll(doc)
  }

  let released = false

  return () => {
    if (released) {
      return
    }

    released = true
    state.owners.delete(owner)

    if (state.owners.size > 0) {
      if (state.snapshot) {
        reassertDocumentScroll(doc, state.snapshot)
      }
      return
    }

    const snapshot = state.snapshot
    state.snapshot = null
    lockStates.delete(doc)

    if (snapshot) {
      unlockDocumentScroll(doc, snapshot)
    }
  }
}

/** Number of active owners; exposed for lifecycle tests and diagnostics. */
export function getScrollLockOwnerCount(doc: Document = document) {
  return lockStates.get(doc)?.owners.size ?? 0
}

/** Reasserts scroll-lock styles for active owners; repairs external tampering. */
export function reassertScrollLock(doc: Document = document) {
  const state = lockStates.get(doc)
  if (state?.snapshot && state.owners.size > 0) {
    reassertDocumentScroll(doc, state.snapshot)
  }
}
