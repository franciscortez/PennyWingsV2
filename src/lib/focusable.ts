/**
 * Focus helpers shared by modal overlays (issue #37).
 */

const TABBABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',')

const isDisabled = (element: HTMLElement) =>
  'disabled' in element && Boolean((element as HTMLButtonElement).disabled)

const isRendered = (element: HTMLElement) => {
  if (element.closest('[hidden], [inert]')) {
    return false
  }

  // Browsers without checkVisibility (and jsdom, which has no layout) fall
  // back to the `hidden`/`inert` check above.
  return typeof element.checkVisibility === 'function'
    ? element.checkVisibility({ visibilityProperty: true })
    : true
}

/** Elements inside `root` reachable with Tab, in document order. */
export function getTabbableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
  ).filter(
    (element) =>
      element.tabIndex >= 0 && !isDisabled(element) && isRendered(element),
  )
}

/** Whether `element` is still in the page and able to take focus. */
export function canReceiveFocus(
  element: Element | null | undefined,
): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.isConnected &&
    element !== element.ownerDocument.body &&
    !isDisabled(element) &&
    isRendered(element)
  )
}

/** Focuses without scrolling the page; returns whether focus actually moved. */
export function focusWithoutScroll(element: HTMLElement): boolean {
  element.focus({ preventScroll: true })

  return element.ownerDocument.activeElement === element
}

/**
 * Documented fallback when a modal's opener is gone (for example, an Edit row
 * button removed after a save): the page heading, then the main landmark. A
 * temporary `tabindex="-1"` makes it focusable and is dropped on blur.
 */
export function focusFallback(doc: Document = document): HTMLElement | null {
  const target =
    doc.querySelector<HTMLElement>('main h1') ?? doc.querySelector<HTMLElement>('main')

  if (!target || target.closest('[inert]')) {
    return null
  }

  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1')
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), {
      once: true,
    })
  }

  return focusWithoutScroll(target) ? target : null
}
