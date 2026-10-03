import { FaCopy, FaTrashCan, FaUserMinus } from 'react-icons/fa6'
import { useState } from 'react'

import { AppButton } from '@/components/ui/Button'
import { fieldInput, fieldLabel } from '@/components/ui/fieldStyles'
import { surfaceNested, textMuted } from '@/components/ui/surfaces'
import { accountModalPanel, accountChoice, accountChoiceActive, accountChoiceIdle } from '@/sections/accounts/accountStyles'
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
      panelClassName={`${accountModalPanel} max-w-lg`}
      title="Share Account"
      titleId="share-account-title"
    >
      <div className="space-y-6">
          {/* ─── Generate Invite Code ─── */}
          <div className="space-y-3">
            <label className={`mb-3 block ${fieldLabel}`}>
              Invitation Code
            </label>

            <div className={`${surfaceNested} flex flex-wrap gap-2 p-2`}>
              {(['viewer', 'transactor'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleInviteRoleChange(role)}
                  aria-pressed={inviteRole === role}
                  className={`${accountChoice} flex-1 ${inviteRole === role ? accountChoiceActive : accountChoiceIdle}`}
                >
                  {role === 'viewer' ? 'View only' : 'Can transact'}
                </button>
              ))}
            </div>

            {generatedCode ? (
              <div className={`${surfaceNested} flex flex-wrap items-center gap-3 p-4`}>
                <span className="min-w-0 break-all font-geist-mono text-xl font-semibold text-pink-800 dark:text-pink-400">
                  {generatedCode}
                </span>
                <AppButton
                  type="button"
                  onClick={handleCopyCode}
                  className="h-11 w-11 shrink-0"
                  size="icon"
                  aria-label="Copy code"
                >
                  <FaCopy className="h-4 w-4" />
                </AppButton>
              </div>
            ) : null}

            <AppButton
              type="button"
              onClick={handleGenerateCode}
              disabled={generating}
              className="w-full min-w-0 whitespace-normal"
            >
              {generating
                ? 'Generating...'
                : generatedCode
                  ? 'Generate New Code'
                  : 'Generate Invite Code'}
            </AppButton>

            <p className={`text-center text-xs ${textMuted}`}>
              Codes expire after 1 hour and can only be used once.
            </p>
          </div>

          {/* ─── Current Members ─── */}
          <div className="space-y-3">
            <label className={`mb-3 block ${fieldLabel}`}>
              Members ({members.length})
            </label>

            {membersLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 motion-safe:animate-pulse rounded-2xl bg-pink-50 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className={`rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/30 py-6 text-center text-sm dark:border-slate-800 dark:bg-slate-950/40 ${textMuted}`}>
                No members yet. Share an invite code to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`${surfaceNested} flex flex-wrap items-center justify-between gap-3 p-4`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-pink-700 dark:bg-slate-900 dark:text-pink-400">
                        {(member.fullName ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-950 dark:text-white">
                          {member.fullName || 'Unknown User'}
                        </p>
                        <p className={`mb-3 block ${fieldLabel}`}>
                          Joined {formatDate(member.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <select
                        value={member.role}
                        disabled={updatingMemberId === member.id}
                        onChange={(event) =>
                          handleMemberRoleChange(
                            member.id,
                            event.target.value as AccountMemberRole,
                          )
                        }
                        className={fieldInput(false, "w-auto min-w-0 max-w-full px-3 text-sm")}
                        aria-label={`Access for ${member.fullName ?? 'member'}`}
                      >
                        <option value="viewer">View only</option>
                        <option value="transactor">Can transact</option>
                      </select>
                      <AppButton
                        type="button"
                        onClick={() =>
                          handleKickMember(member.id, member.fullName ?? '')
                        }
                        size="icon"
                        variant="danger"
                        className="h-11 w-11 shrink-0"
                        aria-label={`Remove ${member.fullName ?? 'member'}`}
                      >
                        <FaUserMinus className="h-3.5 w-3.5" />
                      </AppButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Pending Invitations ─── */}
          <div className="space-y-3">
            <label className={`mb-3 block ${fieldLabel}`}>
              Pending Invitations ({invites.length})
            </label>

            {invitesLoading ? (
              <div className="h-14 motion-safe:animate-pulse rounded-2xl bg-pink-50 dark:bg-slate-800" />
            ) : invites.length === 0 ? (
              <p className={`rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/30 py-4 text-center text-sm dark:border-slate-800 dark:bg-slate-950/40 ${textMuted}`}>
                No pending invitations.
              </p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className={`${surfaceNested} flex flex-wrap items-center justify-between gap-3 p-4`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        {invite.role === 'viewer' ? 'View only' : 'Can transact'}
                      </p>
                      <p className={`text-sm ${textMuted}`}>
                        Expires {formatDate(invite.expiresAt)} at{' '}
                        {formatTime(invite.expiresAt)}
                      </p>
                    </div>
                    <AppButton
                      type="button"
                      onClick={() => handleRevoke(invite.id)}
                      size="icon"
                        variant="danger"
                        className="h-11 w-11 shrink-0"
                      aria-label="Revoke invitation"
                    >
                      <FaTrashCan className="h-3.5 w-3.5" />
                    </AppButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
    </ModalFrame>
  )
}
