import { FaCopy, FaTrashCan, FaUserMinus } from 'react-icons/fa6'
import { useState } from 'react'

import { ModalFrame } from '@/components/ui/ModalFrame'
import { useAuth } from '@/hooks/useAuth'
import { useJointAccountData } from '@/hooks/useJointAccountData'
import { alerts } from '@/lib/alert'
import { formatDate, formatTime } from '@/lib/date'
import type { Account, AccountMemberRole, ResourceType } from '@/types'

type ShareAccountModalProps = {
  account: Account
  onClose: () => void
}

const getResourceType = (account: Account): ResourceType =>
  account.kind === 'card' ? 'bank_card' : 'e_wallet'

export function ShareAccountModal({ account, onClose }: ShareAccountModalProps) {
  const { user } = useAuth()
  const resourceType = getResourceType(account)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [inviteRole, setInviteRole] = useState<AccountMemberRole>('viewer')

  const {
    generating,
    generateInviteCode,
    invites,
    invitesLoading,
    members,
    membersLoading,
    removeMember,
    revokeInvite,
    updateMemberRole,
    updatingMemberId,
  } = useJointAccountData({
    enabled: true,
    resourceId: account.id,
    resourceType,
    userId: user?.id,
  })

  const handleGenerateCode = async () => {
    const { code, error } = await generateInviteCode(inviteRole)

    if (error) {
      alerts.error(error.message)
      return
    }

    setGeneratedCode(code)
  }

  const handleInviteRoleChange = (role: AccountMemberRole) => {
    setInviteRole(role)
    setGeneratedCode(null)
  }

  const handleMemberRoleChange = async (
    membershipId: string,
    role: AccountMemberRole,
  ) => {
    const { error } = await updateMemberRole(membershipId, role)

    if (error) {
      alerts.error(error.message)
    } else {
      alerts.success('Member access updated.')
    }
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
    <ModalFrame
      closeLabel="Close share modal"
      description={account.name}
      onClose={onClose}
      panelClassName="max-w-lg rounded-[2.5rem]"
      title="Share Account"
      titleId="share-account-title"
    >
      <div className="space-y-6">
          {/* ─── Generate Invite Code ─── */}
          <div className="space-y-3">
            <label className="ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Invitation Code
            </label>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-pink-50 p-1.5 dark:bg-slate-950/60">
              {(['viewer', 'transactor'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleInviteRoleChange(role)}
                  className={`rounded-xl px-3 py-2.5 text-xs font-black transition ${
                    inviteRole === role
                      ? 'bg-white text-pink-600 shadow-sm dark:bg-slate-800 dark:text-pink-400'
                      : 'text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                >
                  {role === 'viewer' ? 'View only' : 'Can transact'}
                </button>
              ))}
            </div>

            {generatedCode ? (
              <div className="flex items-center gap-3 rounded-2xl border-2 border-pink-200 bg-pink-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <span className="flex-1 text-center font-mono text-2xl font-black tracking-[0.2em] text-pink-600 dark:text-pink-400">
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

            <p className="text-center text-xs font-medium text-gray-400 dark:text-slate-550">
              Codes expire after 1 hour and can only be used once.
            </p>
          </div>

          {/* ─── Current Members ─── */}
          <div className="space-y-3">
            <label className="ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Members ({members.length})
            </label>

            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-2xl bg-pink-50 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/30 py-6 text-center text-sm font-bold text-gray-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500">
                No members yet. Share an invite code to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-pink-100/60 bg-white p-3.5 transition-all hover:border-pink-200 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:border-slate-700"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-pink-200 text-sm font-black text-pink-600 dark:from-slate-800 dark:to-slate-750 dark:text-pink-400">
                        {(member.fullName ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-slate-200">
                          {member.fullName || 'Unknown User'}
                        </p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                          Joined {formatDate(member.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={member.role}
                        disabled={updatingMemberId === member.id}
                        onChange={(event) =>
                          handleMemberRoleChange(
                            member.id,
                            event.target.value as AccountMemberRole,
                          )
                        }
                        className="rounded-xl border border-pink-100 bg-pink-50 px-2 py-2 text-[10px] font-black text-gray-600 outline-none focus:border-pink-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        aria-label={`Access for ${member.fullName ?? 'member'}`}
                      >
                        <option value="viewer">View only</option>
                        <option value="transactor">Can transact</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          handleKickMember(member.id, member.fullName ?? '')
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-90 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        aria-label={`Remove ${member.fullName ?? 'member'}`}
                      >
                        <FaUserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Pending Invitations ─── */}
          <div className="space-y-3">
            <label className="ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
              Pending Invitations ({invites.length})
            </label>

            {invitesLoading ? (
              <div className="h-14 animate-pulse rounded-2xl bg-pink-50 dark:bg-slate-800" />
            ) : invites.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/30 py-4 text-center text-sm font-bold text-gray-400 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500">
                No pending invitations.
              </p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100/80 bg-amber-50/40 p-3.5 dark:border-amber-950/40 dark:bg-amber-950/10"
                  >
                    <div>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-500">
                        {invite.role === 'viewer' ? 'View only' : 'Can transact'}
                      </p>
                      <p className="text-[10px] font-bold text-amber-500 dark:text-amber-600">
                        Expires {formatDate(invite.expiresAt)} at{' '}
                        {formatTime(invite.expiresAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevoke(invite.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-500 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 dark:border-amber-900/60 dark:bg-slate-850 dark:text-amber-450 dark:hover:bg-red-950/30 dark:hover:text-red-400"
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
    </ModalFrame>
  )
}
