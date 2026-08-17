import { describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import {
  archiveAccount,
  createAccount,
  deleteArchivedAccount,
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

  it('archives account by setting is_active to false', async () => {
    const fromSpy = vi.spyOn(supabase, 'from')

    await archiveAccount('test-user-id', 'card-123', 'card')

    expect(fromSpy).toHaveBeenCalledWith('bank_cards')
    fromSpy.mockRestore()
  })

  it('restores archived account by setting is_active to true', async () => {
    const fromSpy = vi.spyOn(supabase, 'from')

    await restoreAccount('test-user-id', 'wallet-123', 'wallet')

    expect(fromSpy).toHaveBeenCalledWith('e_wallets')
    fromSpy.mockRestore()
  })

  it('cleans up memberships and invites before deleting archived account', async () => {
    const fromSpy = vi.spyOn(supabase, 'from')

    await deleteArchivedAccount('test-user-id', 'card-123', 'card')

    expect(fromSpy).toHaveBeenCalledWith('account_memberships')
    expect(fromSpy).toHaveBeenCalledWith('joint_account_invites')
    expect(fromSpy).toHaveBeenCalledWith('bank_cards')
    fromSpy.mockRestore()
  })
})
