import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineManager } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { rememberReturnTarget, readReturnTarget, clearReturnTarget, validProtectedTarget, reportMonth } from '@/lib/navigationState'
import { assertOnline, clearUncertainWrite, connectionSnapshot, handleWriteError } from '@/lib/connectivity'
import { AppError } from '@/lib/errors'

describe('mobile continuity boundaries', () => {
  beforeEach(() => { sessionStorage.clear(); clearUncertainWrite(); Object.defineProperty(navigator, 'onLine', { configurable: true, value: true }) })

  it('preserves protected queries and fragments but rejects external and public targets', () => {
    expect(validProtectedTarget('/transactions?type=expense&page=2#entry')).toBe('/transactions?type=expense&page=2#entry')
    for (const value of ['//evil.test/accounts', 'https://evil.test/accounts', '/login', '/reset-password', '/accounts\\evil', '/accounts?access_token=secret']) {
      expect(validProtectedTarget(value)).toBeNull()
    }
  })

  it('keeps a target through auth redirects until explicitly consumed', () => {
    rememberReturnTarget('/reports?month=2026-02')
    expect(readReturnTarget()).toBe('/reports?month=2026-02')
    clearReturnTarget()
    expect(readReturnTarget()).toBe('/dashboard')
  })

  it('normalizes invalid report months without accepting malformed months', () => {
    expect(reportMonth('2026-02', '2026-10')).toBe('2026-02')
    for (const value of [null, '2026-13', '26-01', '2026-00', '0000-01']) expect(reportMonth(value, '2026-10')).toBe('2026-10')
  })

  it('rejects offline writes immediately and permits a fresh online attempt', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    expect(assertOnline).toThrow(/offline/i)
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    expect(assertOnline).not.toThrow()
  })

  it('does not pause or replay a mutation when connectivity returns', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    onlineManager.setOnline(false)
    const write = vi.fn().mockResolvedValue('saved')
    const mutation = queryClient.getMutationCache().build(queryClient, { mutationFn: write })
    await expect(mutation.execute(undefined)).rejects.toThrow(/offline/i)
    expect(mutation.state.isPaused).toBe(false)
    expect(write).not.toHaveBeenCalled()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    onlineManager.setOnline(true)
    await queryClient.resumePausedMutations()
    expect(write).not.toHaveBeenCalled()
    queryClient.clear()
  })

  it('blocks another write after a structured Supabase transport failure', () => {
    const error = AppError.from({ message: 'TypeError: Failed to fetch', details: '', code: '' })
    handleWriteError(error)
    expect(connectionSnapshot()).toBe('uncertain')
    expect(error.message).toMatch(/could not be confirmed/)
    expect(assertOnline).toThrow(/last save/)
    clearUncertainWrite()
    expect(assertOnline).not.toThrow()
  })
})
