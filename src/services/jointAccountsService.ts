import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { AccountInvite, AccountMember, ResourceType } from '@/types'

/* ─── Code generation & hashing ─────────────────────────────────────── */

/**
 * Generates a cryptographically random invite code in the format WING-XXXXXX.
 * Uses the Web Crypto API for secure randomness.
 */
const generateInviteCode = (): string => {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const num = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) % 1_000_000
  return `WING-${String(num).padStart(6, '0')}`
}

/**
 * Returns the hex-encoded SHA-256 hash of the given invite code.
 * This is stored in the database — the raw code is never persisted.
 */
const hashInviteCode = async (code: string): Promise<string> => {
  const data = new TextEncoder().encode(code)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/* ─── Invite lifecycle ──────────────────────────────────────────────── */

/**
 * Creates a new invitation for the given account.
 * Returns the raw invite code that the owner shares out-of-band.
 */
export const createInvite = async (
  resourceType: ResourceType,
  resourceId: string,
  ownerId: string,
  expiresInMinutes = 60,
): Promise<string> => {
  const code = generateInviteCode()
  const codeHash = await hashInviteCode(code)
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()

  const { error } = await supabase.from('joint_account_invites').insert({
    code_hash: codeHash,
    expires_at: expiresAt,
    owner_id: ownerId,
    resource_id: resourceId,
    resource_type: resourceType,
  })

  if (error) throw AppError.from(error)
  return code
}

/**
 * Accepts an invitation code through a database RPC so the invite row is
 * locked, validated, marked accepted, and converted into membership atomically.
 */
export const acceptInvite = async (code: string) => {
  const { error } = await supabase.rpc('accept_joint_account_invite', {
    p_code: code,
  })

  if (error) throw AppError.from(error)
}

/**
 * Revokes an active invitation so it can no longer be used.
 */
export const revokeInvite = async (inviteId: string) => {
  const { error } = await supabase.rpc('revoke_joint_account_invite', {
    p_invite_id: inviteId,
  })

  if (error) throw AppError.from(error)
}

/* ─── Membership management ─────────────────────────────────────────── */

/**
 * Returns all members of a shared account, joined with their profile names.
 */
export const fetchAccountMembers = async (
  resourceType: ResourceType,
  resourceId: string,
): Promise<AccountMember[]> => {
  const { data: members, error: membersError } = await supabase
    .from('account_memberships')
    .select('id, resource_type, resource_id, user_id, role, invited_by, joined_at')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .order('joined_at', { ascending: true })

  if (membersError) throw AppError.from(membersError)
  if (!members?.length) return []

  const userIds = members.map((member) => member.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name]),
  )

  return members.map((member) => ({
    fullName: profileMap.get(member.user_id) ?? null,
    id: member.id,
    invitedBy: member.invited_by,
    joinedAt: member.joined_at,
    resourceId: member.resource_id,
    resourceType: member.resource_type as ResourceType,
    role: member.role,
    userId: member.user_id,
  }))
}

/**
 * Returns active (pending) invitations for a given account.
 */
export const fetchActiveInvites = async (
  resourceType: ResourceType,
  resourceId: string,
): Promise<AccountInvite[]> => {
  const { data, error } = await supabase
    .from('joint_account_invites')
    .select('*')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .is('accepted_by', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw AppError.from(error)

  return (data ?? []).map((invite) => ({
    acceptedAt: invite.accepted_at,
    acceptedBy: invite.accepted_by,
    createdAt: invite.created_at,
    expiresAt: invite.expires_at,
    id: invite.id,
    ownerId: invite.owner_id,
    resourceId: invite.resource_id,
    resourceType: invite.resource_type as ResourceType,
    revokedAt: invite.revoked_at,
  }))
}

/**
 * Removes a member from a shared account (owner kicks or member leaves).
 */
export const removeMember = async (membershipId: string) => {
  const { error } = await supabase
    .from('account_memberships')
    .delete()
    .eq('id', membershipId)

  if (error) throw AppError.from(error)
}
