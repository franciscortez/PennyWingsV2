import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getScrollLockOwnerCount } from '@/lib/scrollLock'
import { JoinAccountModal } from '@/sections/accounts/JoinAccountModal'
import {
  resetDocumentStyles,
  stubScrollEnvironment,
} from '../helpers/scrollEnvironment'

const mockJoinAccount = vi.fn()
let mockJoining = false

vi.mock('@/hooks/useJointAccountData', () => ({
  useJoinAccount: () => ({
    joinAccount: mockJoinAccount,
    joining: mockJoining,
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}))

describe('JoinAccountModal scroll lock and lifecycle', () => {
  beforeEach(() => {
    resetDocumentStyles()
    stubScrollEnvironment()
    mockJoining = false
    mockJoinAccount.mockReset()
  })

  afterEach(() => {
    resetDocumentStyles()
    vi.restoreAllMocks()
  })

  it('locks the document while mounted and releases on unmount', () => {
    expect(getScrollLockOwnerCount()).toBe(0)

    const { unmount } = render(
      <JoinAccountModal onClose={vi.fn()} onJoined={vi.fn()} />,
    )

    expect(screen.getByRole('dialog', { name: 'Join Shared Account' })).toBeInTheDocument()
    expect(getScrollLockOwnerCount()).toBe(1)
    expect(document.body.style.position).toBe('fixed')

    unmount()

    expect(getScrollLockOwnerCount()).toBe(0)
    expect(document.body.style.position).toBe('')
  })

  it('retains the lock when code is invalid or join fails', async () => {
    mockJoinAccount.mockResolvedValueOnce({ error: { message: 'Invalid code' } })

    render(<JoinAccountModal onClose={vi.fn()} onJoined={vi.fn()} />)

    const input = screen.getByPlaceholderText('WING-000000')
    const button = screen.getByRole('button', { name: 'Join Account' })

    // Invalid format
    fireEvent.change(input, { target: { value: 'INVALID' } })
    fireEvent.click(button)

    expect(getScrollLockOwnerCount()).toBe(1)
    expect(mockJoinAccount).not.toHaveBeenCalled()

    // Valid format but API error
    fireEvent.change(input, { target: { value: 'WING-123456' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockJoinAccount).toHaveBeenCalledWith('WING-123456')
    })

    expect(getScrollLockOwnerCount()).toBe(1)
    expect(screen.getByRole('dialog', { name: 'Join Shared Account' })).toBeInTheDocument()
  })

  it('calls onJoined on successful join', async () => {
    mockJoinAccount.mockResolvedValueOnce({ error: null })
    const onJoined = vi.fn()

    render(<JoinAccountModal onClose={vi.fn()} onJoined={onJoined} />)

    const input = screen.getByPlaceholderText('WING-000000')
    fireEvent.change(input, { target: { value: 'WING-123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Join Account' }))

    await waitFor(() => {
      expect(onJoined).toHaveBeenCalledTimes(1)
    })
  })

  it('does not re-acquire or call callbacks if unmounted while request is pending', async () => {
    let resolveJoin!: (value: { error: null }) => void
    mockJoinAccount.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveJoin = resolve
        }),
    )
    const onJoined = vi.fn()

    const { unmount } = render(
      <JoinAccountModal onClose={vi.fn()} onJoined={onJoined} />,
    )

    const input = screen.getByPlaceholderText('WING-000000')
    fireEvent.change(input, { target: { value: 'WING-123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Join Account' }))

    expect(getScrollLockOwnerCount()).toBe(1)

    // User dismisses while request in flight
    unmount()
    expect(getScrollLockOwnerCount()).toBe(0)

    // Late network response
    resolveJoin({ error: null })
    await Promise.resolve()

    expect(onJoined).not.toHaveBeenCalled()
    expect(getScrollLockOwnerCount()).toBe(0)
  })
})
