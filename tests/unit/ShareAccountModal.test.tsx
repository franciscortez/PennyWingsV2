import Swal from 'sweetalert2'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getOverlayCount } from '@/lib/overlayStack'
import { getScrollLockOwnerCount } from '@/lib/scrollLock'
import { ShareAccountModal } from '@/sections/accounts/ShareAccountModal'
import type { Account } from '@/types'
import {
  resetDocumentStyles,
  stubScrollEnvironment,
} from '../helpers/scrollEnvironment'

const mockAccount: Account = {
  accessRole: 'owner',
  accountType: 'savings',
  balance: 10000,
  canManage: true,
  canTransact: true,
  color: '#3b82f6',
  createdAt: '2026-01-01T00:00:00Z',
  id: 'account-123',
  isActive: true,
  isHidden: false,
  kind: 'card',
  name: 'BDO Checking',
  textColor: '#ffffff',
  userId: 'user-1',
}

const mockRemoveMember = vi.fn().mockResolvedValue({ error: null })
const mockRevokeInvite = vi.fn().mockResolvedValue({ error: null })
const mockGenerateInviteCode = vi.fn().mockResolvedValue({ code: 'WING-999999', error: null })

vi.mock('@/hooks/useJointAccountData', () => ({
  useJointAccountData: () => ({
    generating: false,
    generateInviteCode: mockGenerateInviteCode,
    invites: [
      {
        code: 'WING-111111',
        createdAt: '2026-09-01T00:00:00Z',
        expiresAt: '2026-09-02T00:00:00Z',
        id: 'invite-1',
        role: 'viewer',
      },
    ],
    invitesLoading: false,
    members: [
      {
        fullName: 'Jane Doe',
        id: 'member-1',
        joinedAt: '2026-08-01T00:00:00Z',
        role: 'viewer',
        userId: 'user-2',
      },
    ],
    membersLoading: false,
    removeMember: mockRemoveMember,
    revokeInvite: mockRevokeInvite,
    updateMemberRole: vi.fn(),
    updatingMemberId: null,
  }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
  }),
}))

describe('ShareAccountModal scroll lock and confirmation nesting', () => {
  beforeEach(() => {
    resetDocumentStyles()
    stubScrollEnvironment()
    mockRemoveMember.mockClear()
    mockRevokeInvite.mockClear()
  })

  afterEach(() => {
    Swal.close()
    resetDocumentStyles()
    vi.restoreAllMocks()
  })

  it('locks the document while mounted and releases on unmount', () => {
    expect(getScrollLockOwnerCount()).toBe(0)

    const { unmount } = render(
      <ShareAccountModal account={mockAccount} onClose={vi.fn()} />,
    )

    expect(screen.getByRole('dialog', { name: 'Share Account' })).toBeInTheDocument()
    expect(getScrollLockOwnerCount()).toBe(1)
    expect(getOverlayCount()).toBe(1)
    expect(document.body.style.position).toBe('fixed')

    unmount()

    expect(getScrollLockOwnerCount()).toBe(0)
    expect(getOverlayCount()).toBe(0)
    expect(document.body.style.position).toBe('')
  })

  it('maintains lock and keeps ShareAccountModal open when nested revoke confirmation is cancelled', async () => {
    const onClose = vi.fn()

    render(<ShareAccountModal account={mockAccount} onClose={onClose} />)

    expect(getScrollLockOwnerCount()).toBe(1)
    expect(getOverlayCount()).toBe(1)

    // Click Revoke on the invitation
    const revokeButton = screen.getByRole('button', { name: 'Revoke invitation' })
    fireEvent.click(revokeButton)

    // SweetAlert confirmation opened: becomes second owner and topmost overlay
    expect(getScrollLockOwnerCount()).toBe(2)
    expect(getOverlayCount()).toBe(2)

    // Press Escape while confirmation is open - should dismiss only the confirmation, NOT ShareAccountModal
    fireEvent.keyDown(document, { key: 'Escape' })
    Swal.clickCancel()

    await waitFor(() => {
      expect(getScrollLockOwnerCount()).toBe(1)
      expect(getOverlayCount()).toBe(1)
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Share Account' })).toBeInTheDocument()
    expect(mockRevokeInvite).not.toHaveBeenCalled()
  })

  it('handles member removal confirmation and keeps page locked', async () => {
    const onClose = vi.fn()

    render(<ShareAccountModal account={mockAccount} onClose={onClose} />)

    // Click Remove member
    const removeButton = screen.getByRole('button', { name: 'Remove Jane Doe' })
    fireEvent.click(removeButton)

    expect(getScrollLockOwnerCount()).toBe(2)

    Swal.clickConfirm()

    await waitFor(() => {
      expect(mockRemoveMember).toHaveBeenCalledWith('member-1')
    })

    // ShareAccountModal stays open and lock remains held
    expect(getScrollLockOwnerCount()).toBe(1)
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Share Account' })).toBeInTheDocument()
  })
})
