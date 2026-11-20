import { X } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { twMerge } from 'tailwind-merge'

import { useModalFocus } from '@/hooks/useModalFocus'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useConnectionFeedback } from '@/hooks/useConnectionFeedback'
import { useTopOverlay } from '@/hooks/useTopOverlay'
import { ConnectionNotice } from '@/components/ConnectionNotice'
import { focusWithoutScroll } from '@/lib/focusable'
import { registerOverlay, type OverlayHandle } from '@/lib/overlayStack'

type ModalBackdropMode = 'dismiss' | 'none'

type ModalFrameProps = {
  mobilePresentation?: 'dialog' | 'sheet' | 'fullscreen'
  /**
   * Opt in to a native `<dialog>` opened with `showModal()` (top layer, native
   * inertness and Escape) instead of the hand-rolled overlay. It also stops the
   * `position: fixed` body scroll lock. Falls back to the overlay where
   * `showModal` is missing. Only for modals that do not stack other overlays;
   * alerts raised while one is open render inside it (see `lib/alert.ts`).
   */
  native?: boolean
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

const supportsNativeModal = () =>
  typeof HTMLDialogElement !== 'undefined' &&
  typeof HTMLDialogElement.prototype.showModal === 'function'

export function ModalFrame({
  mobilePresentation = 'dialog',
  native = false,
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
  // Decided once: switching element type mid-life would remount the form.
  const [useNative] = useState(() => native && supportsNativeModal())
  const generatedId = useId()
  const resolvedTitleId = titleId ?? `${generatedId}-title`
  const descriptionId = description ? `${generatedId}-description` : undefined
  const onCloseRef = useRef(onClose)
  const closeDisabledRef = useRef(closeDisabled)
  const layerRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<OverlayHandle | null>(null)
  const [overlayToken] = useState(() => Symbol('modal'))
  const feedback = useConnectionFeedback()
  const topOverlay = useTopOverlay()
  const showConnection = feedback && feedback.state !== 'online' && topOverlay === overlayToken

  // Hook order matters: layout cleanups run in declaration order, so the page
  // scroll position is restored before focus returns to the opener.
  useScrollLock(lockScroll && !useNative)

  useLayoutEffect(() => {
    const overlay = registerOverlay(document, overlayToken)
    overlayRef.current = overlay

    return () => {
      overlay.release()
      overlayRef.current = null
    }
  }, [overlayToken])

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

  // Declared after useModalFocus so the opener is captured before showModal()
  // moves focus into the dialog.
  useLayoutEffect(() => {
    if (!useNative) {
      return
    }

    // The overlay element is a <dialog> when native; typed as a div below only
    // so one JSX tree serves both modes.
    const layer = layerRef.current as unknown as HTMLDialogElement | null

    if (!layer) {
      return
    }

    if (!layer.open) {
      layer.showModal()
    }

    // showModal() focuses the first control; restore the caller's choice.
    const initial = initialFocusRef?.current ?? dialogRef.current

    if (initial) {
      focusWithoutScroll(initial)
    }

    // Back gesture and close requests arrive as `cancel`. Escape on a keyboard
    // is already consumed by the document handler, which owns the stacking and
    // `closeDisabled` rules, so this path never double-closes.
    const handleCancel = (event: Event) => {
      event.preventDefault()

      if (!closeDisabledRef.current && overlayRef.current?.isTopmost()) {
        onCloseRef.current()
      }
    }

    layer.addEventListener('cancel', handleCancel)

    return () => {
      layer.removeEventListener('cancel', handleCancel)

      if (layer.open) {
        layer.close()
      }
    }
  }, [useNative, initialFocusRef])

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

  const Overlay = (useNative ? 'dialog' : 'div') as 'div'

  return createPortal(
    <Overlay
      ref={layerRef}
      aria-describedby={useNative ? descriptionId : undefined}
      aria-labelledby={useNative ? resolvedTitleId : undefined}
      data-native-modal={useNative ? '' : undefined}
      className={twMerge(
        'modal-overlay z-[100]',
        backdrop === 'dismiss' ? backdropClassName : undefined,
        overlayClassName,
      )}
      data-modal-backdrop={backdrop}
      data-mobile-presentation={mobilePresentation}
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
        aria-describedby={useNative ? undefined : descriptionId}
        aria-labelledby={useNative ? undefined : resolvedTitleId}
        aria-modal={useNative ? undefined : 'true'}
        role={useNative ? undefined : 'dialog'}
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

        {actions || showConnection ? (
          <div className="modal-actions border-t border-pink-50 px-6 py-4 md:px-8 dark:border-slate-800">
            {showConnection ? <ConnectionNotice compact /> : null}
            {actions}
          </div>
        ) : null}
      </section>
    </Overlay>,
    document.body,
  )
}
