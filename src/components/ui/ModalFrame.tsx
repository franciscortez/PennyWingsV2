import { X } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { twMerge } from 'tailwind-merge'

import { useModalFocus } from '@/hooks/useModalFocus'
import { useScrollLock } from '@/hooks/useScrollLock'
import { registerOverlay, type OverlayHandle } from '@/lib/overlayStack'

type ModalBackdropMode = 'dismiss' | 'none'

type ModalFrameProps = {
  /** Pinned below the scroll region, so it stays reachable for long forms. */
  actions?: ReactNode
  /**
   * `dismiss` dims the page and closes on a backdrop click; `none` renders no
   * dismiss surface, for overlays whose caller owns the backdrop decision.
   */
  backdrop?: ModalBackdropMode
  backdropClassName?: string
  bodyRef?: Ref<HTMLDivElement>
  children: ReactNode
  /** Blocks close requests (Escape, backdrop, close button) while saving. */
  closeDisabled?: boolean
  closeLabel: string
  contentClassName?: string
  /** Supplementary line under the title, e.g. a form hint. */
  description?: ReactNode
  headerClassName?: string
  headerLeading?: ReactNode
  /**
   * Receives focus on open. Defaults to the dialog panel itself, so screen
   * readers announce the title and no mobile keyboard opens unprompted.
   */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Set to false for overlays that must not freeze the page. */
  lockScroll?: boolean
  onClose: () => void
  overlayClassName?: string
  panelClassName?: string
  /**
   * Receives focus on close. Defaults to the element focused before opening;
   * when that is gone, focus falls back to the page heading, then `main`.
   */
  returnFocusRef?: RefObject<HTMLElement | null>
  title: string
  titleId?: string
}

/**
 * Shared modal shell (issues #35, #37). Portaled to `document.body` so the rest
 * of the page can be made inert while it is open; it locks page scroll, owns
 * Escape while topmost, contains Tab focus and restores focus on close.
 */

export function ModalFrame({
  actions,
  backdrop = 'dismiss',
  backdropClassName = 'bg-black/40',
  bodyRef,
  children,
  closeDisabled = false,
  closeLabel,
  contentClassName,
  description,
  headerClassName,
  headerLeading,
  initialFocusRef,
  lockScroll = true,
  onClose,
  overlayClassName,
  panelClassName,
  returnFocusRef,
  title,
  titleId,
}: ModalFrameProps) {
  const generatedId = useId()
  const resolvedTitleId = titleId ?? `${generatedId}-title`
  const descriptionId = description ? `${generatedId}-description` : undefined
  const onCloseRef = useRef(onClose)
  const closeDisabledRef = useRef(closeDisabled)
  const layerRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<OverlayHandle | null>(null)

  // Hook order matters: layout cleanups run in declaration order, so the page
  // scroll position is restored before focus returns to the opener.
  useScrollLock(lockScroll)

  useLayoutEffect(() => {
    const overlay = registerOverlay(document)
    overlayRef.current = overlay

    return () => {
      overlay.release()
      overlayRef.current = null
    }
  }, [])

  useModalFocus({
    dialogRef,
    initialFocusRef,
    isTopmost: () => overlayRef.current?.isTopmost() ?? false,
    layerRef,
    returnFocusRef,
  })

  useEffect(() => {
    onCloseRef.current = onClose
    closeDisabledRef.current = closeDisabled
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape belongs to the topmost overlay: a form underneath another layer
      // must not close in response to a keystroke aimed at that layer.
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        !overlayRef.current?.isTopmost()
      ) {
        return
      }

      // Consumed even while saving, so it never falls through to a layer
      // below (the assistant listens on window, after this handler).
      event.preventDefault()

      if (closeDisabledRef.current) {
        return
      }

      onCloseRef.current()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const requestClose = () => {
    if (closeDisabledRef.current) {
      return
    }

    onCloseRef.current()
  }

  const closeButtonClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-pink-50 hover:text-pink-600 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-pink-400'

  return createPortal(
    <div
      ref={layerRef}
      className={twMerge(
        'modal-overlay z-[100]',
        backdrop === 'dismiss' ? backdropClassName : undefined,
        overlayClassName,
      )}
      data-modal-backdrop={backdrop}
      onClick={(event) => {
        // Only the surface outside the panel dismisses: a click inside the
        // panel bubbles up with a different target and is ignored.
        if (backdrop === 'dismiss' && event.target === event.currentTarget) {
          requestClose()
        }
      }}
    >
      <section
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={resolvedTitleId}
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        className={twMerge(
          'modal-panel rounded-[2rem] border border-pink-100 bg-white shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-pink-400 dark:border-slate-800 dark:bg-slate-900',
          panelClassName,
        )}
      >
        <header
          className={twMerge(
            'modal-header flex items-center justify-between gap-4 px-6 pt-6 md:px-8 md:pt-8',
            headerClassName,
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {headerLeading}
            <div className="min-w-0">
              <h2
                id={resolvedTitleId}
                className="text-xl font-black tracking-tight text-gray-800 md:text-2xl dark:text-slate-100"
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className="mt-1 text-xs font-bold text-gray-400 dark:text-slate-500"
                >
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            className={closeButtonClass}
            disabled={closeDisabled}
            onClick={requestClose}
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>

        <div
          ref={bodyRef}
          className={twMerge(
            'modal-body px-6 pb-6 md:px-8 md:pb-8',
            contentClassName,
          )}
        >
          {children}
        </div>

        {actions ? (
          <div className="modal-actions border-t border-pink-50 px-6 py-4 md:px-8 dark:border-slate-800">
            {actions}
          </div>
        ) : null}
      </section>
    </div>,
    document.body,
  )
}
