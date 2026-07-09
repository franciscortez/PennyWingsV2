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
} from '@/services/jointAccountsService'
import type { ResourceType } from '@/types'

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
    mutationFn: async () => {
      if (!userId) throw new Error('No user logged in.')
      return createInvite(resourceType, resourceId, userId)
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

  const generateInviteCode = useCallback(async () => {
    try {
      const code = await generateInviteMutation.mutateAsync()
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

  return {
    generating: generateInviteMutation.isPending,
    generateInviteCode,
    invites: invitesQuery.data ?? [],
    invitesLoading: invitesQuery.isLoading,
    members: membersQuery.data ?? [],
    membersLoading: membersQuery.isLoading,
    removeMember,
    revokeInvite,
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
      await acceptInvite(code, userId)
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
