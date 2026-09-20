import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getScrollLockOwnerCount } from '@/lib/scrollLock'
import { AccountCreationWizard } from '@/sections/accounts/AccountCreationWizard'
import {
  resetDocumentStyles,
  stubScrollEnvironment,
} from '../helpers/scrollEnvironment'

describe('AccountCreationWizard scroll lock and lifecycle', () => {
  beforeEach(() => {
    resetDocumentStyles()
    stubScrollEnvironment()
  })

  afterEach(() => {
    resetDocumentStyles()
    vi.restoreAllMocks()
  })

  it('locks the document while mounted and releases on unmount', () => {
    expect(getScrollLockOwnerCount()).toBe(0)

    const { unmount } = render(
      <AccountCreationWizard
        hasCashAccount={false}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        saving={false}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Step 1 of 3' })).toBeInTheDocument()
    expect(getScrollLockOwnerCount()).toBe(1)
    expect(document.body.style.position).toBe('fixed')

    unmount()

    expect(getScrollLockOwnerCount()).toBe(0)
    expect(document.body.style.position).toBe('')
  })

  it('keeps the same single lock across step transitions', async () => {
    render(
      <AccountCreationWizard
        hasCashAccount={false}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        saving={false}
      />,
    )

    expect(getScrollLockOwnerCount()).toBe(1)

    // Select Traditional Bank and continue to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Traditional Bank/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Step 2 of 3' })).toBeInTheDocument()
    })
    expect(getScrollLockOwnerCount()).toBe(1)

    // Select a provider and continue to Step 3
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'BDO' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Step 3 of 3' })).toBeInTheDocument()
    })
    expect(getScrollLockOwnerCount()).toBe(1)

    // Click back to step 2
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Step 2 of 3' })).toBeInTheDocument()
    })
    expect(getScrollLockOwnerCount()).toBe(1)
  })

  it('handles cash direct flow while preserving single lock', async () => {
    render(
      <AccountCreationWizard
        hasCashAccount={false}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        saving={false}
      />,
    )

    // Select Cash on Hand and continue
    fireEvent.click(screen.getByRole('button', { name: /Cash on Hand/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Cash on Hand' })).toBeInTheDocument()
    })
    expect(getScrollLockOwnerCount()).toBe(1)
  })

  it('blocks close attempts while saving is true', () => {
    const onClose = vi.fn()

    render(
      <AccountCreationWizard
        hasCashAccount={false}
        onClose={onClose}
        onCreate={vi.fn()}
        saving={true}
      />,
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close account setup' }))

    expect(onClose).not.toHaveBeenCalled()
    expect(getScrollLockOwnerCount()).toBe(1)
  })
})
