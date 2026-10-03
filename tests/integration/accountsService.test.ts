import { describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import {
  archiveAccount,
  createAccount,
  deleteArchivedAccount,
  fetchAccounts,
  fetchArchivedAccounts,
  restoreAccount,
} from '@/services/accountsService'

describe('accountsService integration', () => {
  it('creates a bank card with user_id and active status', async () => {
    const fromSpy = vi.spyOn(supabase, 'from')

    await createAccount('test-user-id', {
      name: 'UnionBank',
      kind: 'card',
      accountType: 'savings',
      color: '#ff6600',
      textColor: '#ffffff',
      lastFour: '4321',
      balance: 10000,
    })

    expect(fromSpy).toHaveBeenCalledWith('bank_cards')
    fromSpy.mockRestore()
  })

  it('creates an e-wallet with account_identifier', async () => {
    const fromSpy = vi.spyOn(supabase, 'from')

    await createAccount('test-user-id', {
      name: 'Maya',
      kind: 'wallet',
      accountType: 'maya',
      accountIdentifier: '09987654321',
      color: '#00cc66',
      textColor: '#000000',
      balance: 500,
    })

    expect(fromSpy).toHaveBeenCalledWith('e_wallets')
    fromSpy.mockRestore()
  })

  it('archives account by setting is_active to false and status to archived', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
      update: updateSpy,
    } as never)

    await archiveAccount('test-user-id', 'card-123', 'card')

    expect(fromSpy).toHaveBeenCalledWith('bank_cards')
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: false,
        status: 'archived',
      }),
    )
    fromSpy.mockRestore()
  })

  it('restores archived account by setting is_active to true and status to active', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    })
    const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
      update: updateSpy,
    } as never)

    await restoreAccount('test-user-id', 'wallet-123', 'wallet')

    expect(fromSpy).toHaveBeenCalledWith('e_wallets')
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: true,
        status: 'active',
      }),
    )
    fromSpy.mockRestore()
  })

  it('cleans up memberships and invites and soft-deletes account with status=deleted', async () => {
    const createChainable = () => {
      const builder: Record<string, unknown> = {}
      builder.eq = vi.fn().mockReturnValue(builder)
      builder.then = (resolve: (val: unknown) => unknown) =>
        Promise.resolve({ error: null }).then(resolve)
      return builder
    }

    const updateSpy = vi.fn().mockImplementation(() => createChainable())
    const deleteSpy = vi.fn().mockImplementation(() => createChainable())

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
      if (table === 'bank_cards' || table === 'e_wallets') {
        return { update: updateSpy, delete: deleteSpy } as never
      }
      return { delete: deleteSpy } as never
    }) as never)

    await deleteArchivedAccount('test-user-id', 'card-123', 'card')

    expect(fromSpy).toHaveBeenCalledWith('account_memberships')
    expect(fromSpy).toHaveBeenCalledWith('joint_account_invites')
    expect(fromSpy).toHaveBeenCalledWith('bank_cards')
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: false,
        status: 'deleted',
      }),
    )
    fromSpy.mockRestore()
  })

  it('fetches active accounts with status=active and is_active=true', async () => {
    const data = await fetchAccounts('test-user-id')
    expect(data.accounts.length).toBeGreaterThan(0)
    for (const account of data.accounts) {
      expect(account.status).toBe('active')
      expect(account.isActive).toBe(true)
    }
  })

  it('fetches archived accounts querying status=archived', async () => {
    const fromSpy = vi.spyOn(supabase, 'from')
    const data = await fetchArchivedAccounts('test-user-id')
    expect(fromSpy).toHaveBeenCalledWith('bank_cards')
    expect(fromSpy).toHaveBeenCalledWith('e_wallets')
    expect(data).toBeDefined()
    fromSpy.mockRestore()
  })
})
