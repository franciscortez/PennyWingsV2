import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ModalFrame } from '@/components/ui/ModalFrame'
import { getModalLayerCount } from '@/lib/modalLayers'
import { getOverlayCount, registerOverlay } from '@/lib/overlayStack'
import { getScrollLockOwnerCount } from '@/lib/scrollLock'

import {
  resetDocumentStyles,
  stubScrollEnvironment,
} from '../helpers/scrollEnvironment'

const baseProps = {
  closeLabel: 'Close dialog',
  onClose: vi.fn(),
  title: 'New Transaction',
}

describe('ModalFrame', () => {
  beforeEach(() => {
    resetDocumentStyles()
    stubScrollEnvironment()
  })

  afterEach(() => {
    resetDocumentStyles()
    vi.restoreAllMocks()
  })

  it('renders a labelled dialog whose header sits outside the scroll region', () => {
    render(
      <ModalFrame {...baseProps}>
        <p>Form body</p>
      </ModalFrame>,
    )

    const dialog = screen.getByRole('dialog', { name: 'New Transaction' })
    const title = screen.getByRole('heading', { name: 'New Transaction' })
    const body = dialog.querySelector('.modal-body')
    const closeButton = screen.getByRole('button', { name: 'Close dialog' })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.className).toContain('modal-panel')
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id)
    expect(body).toContainElement(screen.getByText('Form body'))
    // A long form must not scroll its own title or close control away.
    expect(body).not.toContainElement(closeButton)
    expect(dialog.querySelector('.modal-header')).toContainElement(closeButton)
  })

  it('keeps the actions outside the scroll region and associated with the form', () => {
    render(
      <ModalFrame
        actions={
          <button form="frame-form" type="submit">
            Save Budget
          </button>
        }
        closeLabel="Close dialog"
        onClose={vi.fn()}
        title="New Budget"
      >
        <form id="frame-form">
          <input aria-label="Amount" />
        </form>
      </ModalFrame>,
    )

    const dialog = screen.getByRole('dialog', { name: 'New Budget' })
    const submit = screen.getByRole('button', { name: 'Save Budget' })

    expect(dialog.querySelector('.modal-actions')).toContainElement(submit)
    expect(dialog.querySelector('.modal-body')).not.toContainElement(submit)
    expect(submit).toHaveAttribute('form', 'frame-form')
    expect(document.getElementById('frame-form')).toBeInTheDocument()
    // One real form and one submit path: no nested or duplicate forms.
    expect(dialog.querySelectorAll('form')).toHaveLength(1)
  })

  it('locks the page while mounted and restores it on unmount', () => {
    const { unmount } = render(
      <ModalFrame {...baseProps}>
        <p>Form body</p>
      </ModalFrame>,
    )

    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.overflow).toBe('hidden')
    expect(getScrollLockOwnerCount()).toBe(1)
    expect(getOverlayCount()).toBe(1)

    unmount()

    expect(document.body.style.position).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(getScrollLockOwnerCount()).toBe(0)
    expect(getOverlayCount()).toBe(0)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 400)
  })

  it('routes the close button, backdrop and Escape through the close request', () => {
    const onClose = vi.fn()

    render(
      <ModalFrame closeLabel="Close dialog" onClose={onClose} title="New Budget">
        <p>Form body</p>
      </ModalFrame>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)

    fireEvent.click(document.querySelector('.modal-overlay')!)
    expect(onClose).toHaveBeenCalledTimes(3)

    // A click inside the panel is not a backdrop dismissal.
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('ignores every close request while the close is disabled', () => {
    const onClose = vi.fn()

    render(
      <ModalFrame
        closeDisabled
        closeLabel="Close dialog"
        onClose={onClose}
        title="New Budget"
      >
        <p>Form body</p>
      </ModalFrame>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(document.querySelector('.modal-overlay')!)
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeDisabled()
    // A rejected dismissal must not release the page.
    expect(getScrollLockOwnerCount()).toBe(1)
  })

  it('lets only the topmost frame handle Escape', () => {
    const firstClose = vi.fn()
    const secondClose = vi.fn()

    render(
      <>
        <ModalFrame
          closeLabel="Close first"
          onClose={firstClose}
          title="First overlay"
        >
          <p>First body</p>
        </ModalFrame>
        <ModalFrame
          closeLabel="Close second"
          onClose={secondClose}
          title="Second overlay"
        >
          <p>Second body</p>
        </ModalFrame>
      </>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(secondClose).toHaveBeenCalledTimes(1)
    expect(firstClose).not.toHaveBeenCalled()
  })

  it('renders no dismiss surface when the caller owns backdrop policy', () => {
    const onClose = vi.fn()

    render(
      <ModalFrame
        backdrop="none"
        closeLabel="Close dialog"
        onClose={onClose}
        overlayClassName="z-50 bg-gray-900/60"
        title="Edit Account"
      >
        <p>Form body</p>
      </ModalFrame>,
    )

    const overlay = document.querySelector('.modal-overlay')!

    expect(overlay).toHaveAttribute('data-modal-backdrop', 'none')
    expect(overlay.className).toContain('z-50')
    expect(overlay.className).not.toContain('bg-black/40')

    fireEvent.click(overlay)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('wires the description and a custom title id into the dialog semantics', () => {
    render(
      <ModalFrame
        {...baseProps}
        description="Update account preferences and details"
        title="Edit Account"
        titleId="edit-account-title"
      >
        <p>Form body</p>
      </ModalFrame>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Edit Account' })
    const description = screen.getByText('Update account preferences and details')

    expect(screen.getByRole('heading', { name: 'Edit Account' })).toHaveAttribute(
      'id',
      'edit-account-title',
    )
    expect(dialog.getAttribute('aria-labelledby')).toBe('edit-account-title')
    expect(dialog.getAttribute('aria-describedby')).toBe(description.id)
  })

  it('renders headerLeading before the title and attaches bodyRef to modal body', () => {
    let capturedBody: HTMLDivElement | null = null

    render(
      <ModalFrame
        {...baseProps}
        bodyRef={(el) => {
          capturedBody = el
        }}
        headerLeading={<button type="button">Back</button>}
        title="Add Account"
      >
        <p>Wizard step</p>
      </ModalFrame>,
    )

    const backButton = screen.getByRole('button', { name: 'Back' })
    const header = screen.getByRole('dialog').querySelector('.modal-header')
    const body = screen.getByRole('dialog').querySelector('.modal-body')

    expect(header).toContainElement(backButton)
    expect(capturedBody).toBe(body)
  })

  describe('focus management (issue #37)', () => {
    const renderWithOpener = (frameProps: Partial<Parameters<typeof ModalFrame>[0]> = {}) => {
      function Harness({ open }: { open: boolean }) {
        return (
          <main>
            <h1>Transactions</h1>
            <button type="button">New Transaction</button>
            {open ? (
              <ModalFrame {...baseProps} {...frameProps}>
                <form>
                  <input aria-label="Amount" />
                  <button type="submit">Save</button>
                </form>
              </ModalFrame>
            ) : null}
          </main>
        )
      }

      const view = render(<Harness open={false} />)
      const opener = screen.getByRole('button', { name: 'New Transaction' })
      opener.focus()
      view.rerender(<Harness open />)

      return {
        close: () => view.rerender(<Harness open={false} />),
        opener,
        view,
      }
    }

    it('portals to the body and inerts the page behind it', () => {
      const { close, view } = renderWithOpener()
      const overlay = document.querySelector('.modal-overlay')!

      expect(overlay.parentElement).toBe(document.body)
      expect(view.container).toHaveAttribute('inert')
      expect(overlay).not.toHaveAttribute('inert')

      close()

      expect(view.container).not.toHaveAttribute('inert')
    })

    it('focuses the dialog on open without scrolling the page', () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')

      renderWithOpener()
      const dialog = screen.getByRole('dialog')

      expect(document.activeElement).toBe(dialog)
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
    })

    it('moves initial focus to initialFocusRef when provided', () => {
      const initialFocusRef = { current: null as HTMLElement | null }

      function Harness() {
        return (
          <ModalFrame {...baseProps} initialFocusRef={initialFocusRef}>
            <input
              aria-label="Amount"
              ref={(el) => {
                initialFocusRef.current = el
              }}
            />
          </ModalFrame>
        )
      }

      render(<Harness />)

      expect(document.activeElement).toBe(screen.getByLabelText('Amount'))
    })

    it('wraps Tab and Shift+Tab inside the dialog', () => {
      renderWithOpener()
      const dialog = screen.getByRole('dialog')
      const closeButton = screen.getByRole('button', { name: 'Close dialog' })
      const save = screen.getByRole('button', { name: 'Save' })

      // From the dialog itself, Shift+Tab goes to the last control.
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(save)

      fireEvent.keyDown(document, { key: 'Tab' })
      expect(document.activeElement).toBe(closeButton)

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
      expect(document.activeElement).toBe(save)

      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    })

    it('pulls focus moved outside by script back into the dialog', () => {
      const { opener } = renderWithOpener()

      opener.focus()

      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })

    it('recovers focus that drops to the body, e.g. a Save button disabling', async () => {
      renderWithOpener()
      const save = screen.getByRole('button', { name: 'Save' })

      save.focus()
      save.blur()
      expect(document.activeElement).toBe(document.body)

      await new Promise((resolve) => requestAnimationFrame(resolve))

      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })

    it('returns focus to the opener on close', () => {
      const { close, opener } = renderWithOpener()

      close()

      expect(document.activeElement).toBe(opener)
    })

    it('falls back to the page heading when the opener is gone', async () => {
      function Harness({ open }: { open: boolean }) {
        return (
          <main>
            <h1>Transactions</h1>
            {open ? null : <button type="button">Edit row</button>}
            {open ? (
              <ModalFrame {...baseProps}>
                <p>Form body</p>
              </ModalFrame>
            ) : null}
          </main>
        )
      }

      const view = render(<Harness open={false} />)
      screen.getByRole('button', { name: 'Edit row' }).focus()
      view.rerender(<Harness open />)
      // Remounting the whole page also replaces the heading in the same commit.
      view.rerender(
        <main>
          <h1>Transactions</h1>
        </main>,
      )
      await Promise.resolve()

      expect(document.activeElement).toBe(
        screen.getByRole('heading', { name: 'Transactions' }),
      )
    })

    it('keeps the lower frame inert and its Tab inactive under a nested frame', () => {
      render(
        <>
          <ModalFrame closeLabel="Close first" onClose={vi.fn()} title="First overlay">
            <button type="button">First action</button>
          </ModalFrame>
          <ModalFrame closeLabel="Close second" onClose={vi.fn()} title="Second overlay">
            <button type="button">Second action</button>
          </ModalFrame>
        </>,
      )

      const overlays = document.querySelectorAll('.modal-overlay')
      expect(overlays[0]).toHaveAttribute('inert')
      expect(overlays[1]).not.toHaveAttribute('inert')

      const secondDialog = screen.getByRole('dialog', { name: 'Second overlay' })
      fireEvent.keyDown(document, { key: 'Tab' })
      expect(secondDialog).toContainElement(document.activeElement as HTMLElement)
    })

    it('consumes Escape so a window-level overlay below does not also close', () => {
      const belowClose = vi.fn()
      const frameClose = vi.fn()
      const below = registerOverlay(document)
      const handleWindowKey = (event: KeyboardEvent) => {
        if (event.defaultPrevented || !below.isTopmost()) return
        if (event.key === 'Escape') belowClose()
      }
      window.addEventListener('keydown', handleWindowKey)

      try {
        const { unmount } = render(
          <ModalFrame closeLabel="Close dialog" onClose={frameClose} title="Form">
            <p>Form body</p>
          </ModalFrame>,
        )

        // Simulate the frame closing synchronously inside its own handler.
        frameClose.mockImplementation(() => unmount())
        fireEvent.keyDown(document, { key: 'Escape' })

        expect(frameClose).toHaveBeenCalledTimes(1)
        expect(belowClose).not.toHaveBeenCalled()
      } finally {
        window.removeEventListener('keydown', handleWindowKey)
        below.release()
      }
    })

    it('consumes Escape without closing while the close is disabled', () => {
      const onClose = vi.fn()

      render(
        <ModalFrame closeDisabled closeLabel="Close dialog" onClose={onClose} title="Form">
          <p>Form body</p>
        </ModalFrame>,
      )

      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape',
      })
      document.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
      expect(onClose).not.toHaveBeenCalled()
    })

    it('releases the inert page and focus bookkeeping under StrictMode', () => {
      const { unmount } = render(
        <StrictMode>
          <ModalFrame {...baseProps}>
            <p>Form body</p>
          </ModalFrame>
        </StrictMode>,
      )

      expect(getModalLayerCount()).toBe(1)
      expect(getOverlayCount()).toBe(1)

      unmount()

      expect(getModalLayerCount()).toBe(0)
      expect(getOverlayCount()).toBe(0)
      expect(document.querySelector('[inert]')).toBeNull()
    })
  })
})
