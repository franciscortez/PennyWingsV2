/**
 * Modal layer registry (issue #37).
 *
 * A modal is portaled to `document.body`, so everything else in the body — the
 * app root with its sidebar, page and assistant — can be made `inert` without
 * inerting the dialog itself. Layers are stacked: only the topmost stays
 * interactive, and the page is released only when the last layer closes, so a
 * nested modal cannot restore interaction early. Nodes appended to the body
 * after the first layer opened (alert dialogs, toasts) are never inerted.
 * Escape and scroll ownership stay separate: see `overlayStack.ts` and
 * `scrollLock.ts`.
 */

export type ModalLayerHandle = {
  release: () => void
}

type ModalLayerState = {
  layers: HTMLElement[]
  /** Original `inert` state of each body child the registry inerted. */
  snapshot: Map<HTMLElement, boolean>
}

const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK', 'NOSCRIPT'])

const layerStates = new WeakMap<Document, ModalLayerState>()

const snapshotBackground = (doc: Document, state: ModalLayerState) => {
  for (const child of Array.from(doc.body.children)) {
    if (
      !(child instanceof HTMLElement) ||
      IGNORED_TAGS.has(child.tagName) ||
      state.layers.includes(child)
    ) {
      continue
    }

    state.snapshot.set(child, child.hasAttribute('inert'))
    child.setAttribute('inert', '')
  }
}

const applyLayerOrder = (state: ModalLayerState) => {
  state.layers.forEach((layer, index) => {
    layer.toggleAttribute('inert', index !== state.layers.length - 1)
  })
}

const restoreBackground = (state: ModalLayerState) => {
  state.snapshot.forEach((wasInert, element) => {
    if (element.isConnected) {
      element.toggleAttribute('inert', wasInert)
    }
  })
  state.snapshot.clear()
}

export function registerModalLayer(layer: HTMLElement): ModalLayerHandle {
  const doc = layer.ownerDocument
  let state = layerStates.get(doc)

  if (!state) {
    state = { layers: [], snapshot: new Map() }
    layerStates.set(doc, state)
  }

  state.layers.push(layer)

  if (state.layers.length === 1) {
    snapshotBackground(doc, state)
  }

  applyLayerOrder(state)

  let released = false

  return {
    release: () => {
      if (released) {
        return
      }

      released = true
      const current = layerStates.get(doc)

      if (!current) {
        return
      }

      const index = current.layers.indexOf(layer)

      if (index >= 0) {
        current.layers.splice(index, 1)
      }

      layer.removeAttribute('inert')

      if (current.layers.length === 0) {
        restoreBackground(current)
        layerStates.delete(doc)
        return
      }

      applyLayerOrder(current)
    },
  }
}

/** Number of open modal layers; exposed for ordering tests and diagnostics. */
export function getModalLayerCount(doc: Document = document) {
  return layerStates.get(doc)?.layers.length ?? 0
}
