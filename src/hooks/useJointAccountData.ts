import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppError } from '@/lib/errors'
import { queryKeys } from '@/lib/queryClient'
import {
  acceptInvite,
  createInvite,
  fetchAccountMembers,
  fetchActiveInvites,
  removeMember as removeMemberService,
  revokeInvite as revokeInviteService,
  setMembershipHidden as setMembershipHiddenService,
  updateMemberRole as updateMemberRoleService,
} from '@/services/jointAccountsService'
import type { AccountMemberRole, ResourceType } from '@/types'

type UseJointAccountDataOptions = {
  enabled: boolean
  resourceId: string
  resourceType: ResourceType
  userId: string | undefined
}

export function useJointAccountData({
  enabled,
  resourceId,
  resourceType,
  userId,
}: UseJointAccountDataOptions) {
  const queryClient = useQueryClient()

  const membersQuery = useQuery({
    enabled: enabled && Boolean(userId),
    queryFn: () => fetchAccountMembers(resourceType, resourceId),
    queryKey: queryKeys.jointMembers(resourceType, resourceId),
  })

  const invitesQuery = useQuery({
    enabled: enabled && Boolean(userId),
    queryFn: () => fetchActiveInvites(resourceType, resourceId),
    queryKey: queryKeys.jointInvites(resourceType, resourceId),
  })

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.jointMembers(resourceType, resourceId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.jointInvites(resourceType, resourceId),
      }),
    ])
  }, [queryClient, resourceType, resourceId])

  const generateInviteMutation = useMutation({
    mutationFn: async (role: AccountMemberRole) => {
      if (!userId) throw new Error('No user logged in.')
      return createInvite(resourceType, resourceId, userId, role)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.jointInvites(resourceType, resourceId),
      }),
  })

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInviteService(inviteId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.jointInvites(resourceType, resourceId),
      }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (membershipId: string) => removeMemberService(membershipId),
    onSuccess: refreshAll,
  })

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({
      membershipId,
      role,
    }: {
      membershipId: string
      role: AccountMemberRole
    }) => updateMemberRoleService(membershipId, role),
    onSuccess: refreshAll,
  })

  const generateInviteCode = useCallback(async (role: AccountMemberRole) => {
    try {
      const code = await generateInviteMutation.mutateAsync(role)
      return { code, error: null }
    } catch (error) {
      return { code: null, error: AppError.from(error, 'Unable to generate invite.') }
    }
  }, [generateInviteMutation])

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      try {
        await revokeInviteMutation.mutateAsync(inviteId)
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to revoke invite.') }
      }
    },
    [revokeInviteMutation],
  )

  const removeMember = useCallback(
    async (membershipId: string) => {
      try {
        await removeMemberMutation.mutateAsync(membershipId)
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to remove member.') }
      }
    },
    [removeMemberMutation],
  )

  const updateMemberRole = useCallback(
    async (membershipId: string, role: AccountMemberRole) => {
      try {
        await updateMemberRoleMutation.mutateAsync({ membershipId, role })
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to update member access.') }
      }
    },
    [updateMemberRoleMutation],
  )

  return {
    generating: generateInviteMutation.isPending,
    generateInviteCode,
    invites: invitesQuery.data ?? [],
    invitesLoading: invitesQuery.isLoading,
    members: membersQuery.data ?? [],
    membersLoading: membersQuery.isLoading,
    removeMember,
    revokeInvite,
    updateMemberRole,
    updatingMemberId: updateMemberRoleMutation.isPending
      ? updateMemberRoleMutation.variables?.membershipId ?? null
      : null,
  }
}

/**
 * Standalone hook for a member's own actions on a shared account — leaving it
 * or hiding it from their own accounts view. Lighter than useJointAccountData,
 * which fetches the full member/invite lists needed only by the owner's modal.
 */
export function useAccountMembership(userId: string | undefined) {
  const queryClient = useQueryClient()

  const invalidateAccounts = useCallback(async () => {
    if (!userId) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts(userId) })
  }, [queryClient, userId])

  const leaveMutation = useMutation({
    mutationFn: (membershipId: string) => removeMemberService(membershipId),
    onSuccess: invalidateAccounts,
  })

  const toggleHiddenMutation = useMutation({
    mutationFn: ({
      membershipId,
      hidden,
    }: {
      hidden: boolean
      membershipId: string
    }) => setMembershipHiddenService(membershipId, hidden),
    onSuccess: invalidateAccounts,
  })

  const leaveAccount = useCallback(
    async (membershipId: string) => {
      try {
        await leaveMutation.mutateAsync(membershipId)
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to leave account.') }
      }
    },
    [leaveMutation],
  )

  const toggleHidden = useCallback(
    async (membershipId: string, hidden: boolean) => {
      try {
        await toggleHiddenMutation.mutateAsync({ hidden, membershipId })
        return { error: null }
      } catch (error) {
        return {
          error: AppError.from(
            error,
            hidden ? 'Unable to hide account.' : 'Unable to unhide account.',
          ),
        }
      }
    },
    [toggleHiddenMutation],
  )

  return {
    leaveAccount,
    leaving: leaveMutation.isPending,
    toggleHidden,
    togglingHidden: toggleHiddenMutation.isPending,
  }
}

/**
 * Standalone hook for accepting an invitation code (used from the Join modal).
 */
export function useJoinAccount(userId: string | undefined) {
  const queryClient = useQueryClient()

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!userId) throw new Error('No user logged in.')
      await acceptInvite(code)
    },
    onSuccess: async () => {
      if (!userId) return
      await queryClient.invalidateQueries({
        queryKey: queryKeys.accounts(userId),
      })
    },
  })

  const joinAccount = useCallback(
    async (code: string) => {
      try {
        await joinMutation.mutateAsync(code)
        return { error: null }
      } catch (error) {
        return { error: AppError.from(error, 'Unable to join account.') }
      }
    },
    [joinMutation],
  )

  return {
    joinAccount,
    joining: joinMutation.isPending,
  }
}
