import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ModalFrame } from '@/components/ui/ModalFrame'
import { getOverlayCount } from '@/lib/overlayStack'
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
})
