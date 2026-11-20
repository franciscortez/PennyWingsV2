import { useEffect, useRef, type RefObject } from 'react'

type UseDismissableOptions = {
  /** The popover or menu is currently open; listeners attach only then. */
  open: boolean
  /** Pointer presses inside this element (usually trigger plus panel) do not dismiss. */
  containerRef: RefObject<HTMLElement | null>
  /** Focus goes back here after Escape, so keyboard users keep their place. */
  returnFocusRef?: RefObject<HTMLElement | null>
  onDismiss: () => void
}

/** Closes a light popover on an outside press or Escape. */
export function useDismissable({
  open,
  containerRef,
  returnFocusRef,
  onDismiss,
}: UseDismissableOptions) {
  const onDismissRef = useRef(onDismiss)

  useEffect(() => {
    onDismissRef.current = onDismiss
  })

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const container = containerRef.current

      if (container && !container.contains(event.target as Node)) {
        onDismissRef.current()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismissRef.current()
        returnFocusRef?.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, containerRef, returnFocusRef])
}
