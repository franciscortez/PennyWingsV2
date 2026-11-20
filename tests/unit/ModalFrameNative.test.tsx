import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createRef, StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ModalFrame } from '@/components/ui/ModalFrame'
import { getOverlayCount } from '@/lib/overlayStack'
import { getScrollLockOwnerCount } from '@/lib/scrollLock'

import { resetDocumentStyles, stubScrollEnvironment } from '../helpers/scrollEnvironment'

const baseProps = {
  closeLabel: 'Close dialog',
  title: 'Add Purchase',
}

const prototype = HTMLDialogElement.prototype as Partial<HTMLDialogElement>
const original = { close: prototype.close, showModal: prototype.showModal }

// jsdom has no showModal(); this stands in for the browser opening the dialog.
const installDialogShim = () => {
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  const close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })

  prototype.showModal = showModal
  prototype.close = close

  return { close, showModal }
}

describe('ModalFrame native dialog mode', () => {
  beforeEach(() => {
    resetDocumentStyles()
    stubScrollEnvironment()
  })

  afterEach(() => {
    // Unmount while the shim is still installed; close() runs on cleanup.
    cleanup()
    prototype.showModal = original.showModal
    prototype.close = original.close
    resetDocumentStyles()
    vi.restoreAllMocks()
  })

  it('opens a native dialog with showModal and labels it by its title', () => {
    const { showModal } = installDialogShim()

    render(
      <ModalFrame {...baseProps} native onClose={vi.fn()}>
        <p>Body</p>
      </ModalFrame>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Add Purchase' })

    expect(dialog.tagName).toBe('DIALOG')
    expect(dialog).toHaveAttribute('data-native-modal')
    expect(dialog).toHaveAttribute('open')
    expect(dialog).not.toHaveAttribute('aria-modal')
    expect(showModal).toHaveBeenCalledTimes(1)
    // Exactly one dialog role: the inner panel must not repeat it.
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('does not freeze the body or take a scroll lock', () => {
    installDialogShim()

    render(
      <ModalFrame {...baseProps} native onClose={vi.fn()}>
        <p>Body</p>
      </ModalFrame>,
    )

    expect(document.body.style.position).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(getScrollLockOwnerCount()).toBe(0)
    expect(getOverlayCount()).toBe(1)
  })

  it('opens once under StrictMode and closes the dialog on unmount', () => {
    const { close, showModal } = installDialogShim()

    const { unmount } = render(
      <StrictMode>
        <ModalFrame {...baseProps} native onClose={vi.fn()}>
          <p>Body</p>
        </ModalFrame>
      </StrictMode>,
    )

    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    expect(showModal.mock.calls.length).toBeGreaterThanOrEqual(1)

    unmount()

    expect(close).toHaveBeenCalled()
    expect(getOverlayCount()).toBe(0)
  })

  it('closes on Escape unless closing is disabled', () => {
    installDialogShim()
    const onClose = vi.fn()
    const { rerender } = render(
      <ModalFrame {...baseProps} native onClose={onClose}>
        <p>Body</p>
      </ModalFrame>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(
      <ModalFrame {...baseProps} native closeDisabled onClose={onClose}>
        <p>Body</p>
      </ModalFrame>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('routes a close request (back gesture) through onClose and never lets the browser close it', () => {
    installDialogShim()
    const onClose = vi.fn()

    render(
      <ModalFrame {...baseProps} native onClose={onClose}>
        <p>Body</p>
      </ModalFrame>,
    )

    const cancel = new Event('cancel', { cancelable: true })
    screen.getByRole('dialog').dispatchEvent(cancel)

    expect(cancel.defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores a close request while closing is disabled', () => {
    installDialogShim()
    const onClose = vi.fn()

    render(
      <ModalFrame {...baseProps} native closeDisabled onClose={onClose}>
        <p>Body</p>
      </ModalFrame>,
    )

    const cancel = new Event('cancel', { cancelable: true })
    screen.getByRole('dialog').dispatchEvent(cancel)

    expect(cancel.defaultPrevented).toBe(true)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on a click on the dialog surface but not inside the panel', () => {
    installDialogShim()
    const onClose = vi.fn()

    render(
      <ModalFrame {...baseProps} native onClose={onClose}>
        <p>Body</p>
      </ModalFrame>,
    )

    fireEvent.click(screen.getByText('Body'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('moves focus to initialFocusRef after showModal', () => {
    installDialogShim()
    const inputRef = createRef<HTMLInputElement>()

    render(
      <ModalFrame {...baseProps} native initialFocusRef={inputRef} onClose={vi.fn()}>
        <input ref={inputRef} aria-label="Amount" />
      </ModalFrame>,
    )

    expect(screen.getByLabelText('Amount')).toHaveFocus()
  })

  it('falls back to the hand-rolled overlay when showModal is unavailable', () => {
    prototype.showModal = undefined

    render(
      <ModalFrame {...baseProps} native onClose={vi.fn()}>
        <p>Body</p>
      </ModalFrame>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Add Purchase' })

    expect(dialog.tagName).toBe('SECTION')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.body.style.position).toBe('fixed')
    expect(document.querySelector('dialog')).toBeNull()
  })
})
