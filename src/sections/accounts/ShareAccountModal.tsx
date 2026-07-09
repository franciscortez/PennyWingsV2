import { FaCopy, FaTrashCan, FaUserMinus, FaXmark } from 'react-icons/fa6'
import { useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { useJointAccountData } from '@/hooks/useJointAccountData'
import { alerts } from '@/lib/alert'
import type { Account, ResourceType } from '@/types'

type ShareAccountModalProps = {
  account: Account
  onClose: () => void
}

const getResourceType = (account: Account): ResourceType =>
  account.kind === 'card' ? 'bank_card' : 'e_wallet'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: true,
    minute: '2-digit',
  })

export function ShareAccountModal({ account, onClose }: ShareAccountModalProps) {
  const { user } = useAuth()
  const resourceType = getResourceType(account)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  const {
    generating,
    generateInviteCode,
    invites,
    invitesLoading,
    members,
    membersLoading,
    removeMember,
    revokeInvite,
  } = useJointAccountData({
    enabled: true,
    resourceId: account.id,
    resourceType,
    userId: user?.id,
  })

  const handleGenerateCode = async () => {
    const { code, error } = await generateInviteCode()

    if (error) {
      alerts.error(error.message)
      return
    }

    setGeneratedCode(code)
  }

  const handleCopyCode = async () => {
    if (!generatedCode) return

    try {
      await navigator.clipboard.writeText(generatedCode)
      alerts.success('Code copied to clipboard.')
    } catch {
      alerts.error('Unable to copy. Please copy manually.')
    }
  }

  const handleRevoke = async (inviteId: string) => {
    const confirmed = await alerts.confirmDelete(
      'Invitation',
      'Revoke this invitation? It will no longer be usable.',
    )

    if (!confirmed) return

    const { error } = await revokeInvite(inviteId)

    if (error) {
      alerts.error(error.message)
    } else {
      alerts.success('Invitation revoked.')
    }
  }

  const handleKickMember = async (membershipId: string, memberName: string) => {
    const confirmed = await alerts.confirmDelete(
      'Member',
      `Remove ${memberName || 'this member'} from ${account.name}?`,
    )

    if (!confirmed) return

    const { error } = await removeMember(membershipId)

    if (error) {
      alerts.error(error.message)
    } else {
      alerts.success('Member removed.')
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
        aria-label="Close share modal"
      />
      <section className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2.5rem] border border-pink-100 bg-white animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-50 p-6 pb-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-800">
              Share Account
            </h2>
            <p className="mt-1 text-sm font-bold text-gray-400">
              {account.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-all duration-200 hover:rotate-90 hover:bg-pink-50 active:scale-90"
            aria-label="Close"
          >
            <FaXmark className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 pt-4">
          {/* ─── Generate Invite Code ─── */}
          <div className="space-y-3">
            <label className="ml-1 block text-xs font-black uppercase tracking-widest text-gray-400">
              Invitation Code
            </label>

            {generatedCode ? (
              <div className="flex items-center gap-3 rounded-2xl border-2 border-pink-200 bg-pink-50/60 p-4">
                <span className="flex-1 text-center font-mono text-2xl font-black tracking-[0.2em] text-pink-600">
                  {generatedCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500 text-white transition-all hover:bg-pink-600 active:scale-90"
                  aria-label="Copy code"
                >
                  <FaCopy className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={generating}
              className="w-full rounded-2xl bg-linear-to-r from-pink-500 to-pink-600 py-3.5 text-sm font-black text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {generating
                ? 'Generating...'
                : generatedCode
                  ? 'Generate New Code'
                  : 'Generate Invite Code'}
            </button>

            <p className="text-center text-xs font-medium text-gray-400">
              Codes expire after 1 hour and can only be used once.
            </p>
          </div>

          {/* ─── Current Members ─── */}
          <div className="space-y-3">
            <label className="ml-1 block text-xs font-black uppercase tracking-widest text-gray-400">
              Members ({members.length})
            </label>

            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-2xl bg-pink-50"
                  />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/30 py-6 text-center text-sm font-bold text-gray-400">
                No members yet. Share an invite code to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-pink-100/60 bg-white p-3.5 transition-all hover:border-pink-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-sm font-black text-pink-600">
                        {(member.fullName ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          {member.fullName || 'Unknown User'}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {member.role} · joined {formatDate(member.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleKickMember(member.id, member.fullName ?? '')
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-90"
                      aria-label={`Remove ${member.fullName ?? 'member'}`}
                    >
                      <FaUserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Pending Invitations ─── */}
          <div className="space-y-3">
            <label className="ml-1 block text-xs font-black uppercase tracking-widest text-gray-400">
              Pending Invitations ({invites.length})
            </label>

            {invitesLoading ? (
              <div className="h-14 animate-pulse rounded-2xl bg-pink-50" />
            ) : invites.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/30 py-4 text-center text-sm font-bold text-gray-400">
                No pending invitations.
              </p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100/80 bg-amber-50/40 p-3.5"
                  >
                    <div>
                      <p className="text-xs font-bold text-amber-700">
                        Pending Invite
                      </p>
                      <p className="text-[10px] font-bold text-amber-500">
                        Expires {formatDate(invite.expiresAt)} at{' '}
                        {formatTime(invite.expiresAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevoke(invite.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-500 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
                      aria-label="Revoke invitation"
                    >
                      <FaTrashCan className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
