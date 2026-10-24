import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider, QueryObserver, onlineManager } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectionFeedbackProvider } from '@/context/ConnectionFeedbackContext'
import { ConnectionNotice } from '@/components/ConnectionNotice'
import { clearUncertainWrite, connectionSnapshot, handleWriteError } from '@/lib/connectivity'
import { queryClient } from '@/lib/queryClient'

function network(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: online })
  onlineManager.setOnline(online)
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

describe('connection recovery', () => {
  let client: QueryClient
  beforeEach(() => {
    network(true)
    clearUncertainWrite()
    client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnReconnect: false } } })
  })
  afterEach(() => { client.clear(); network(true); clearUncertainWrite() })

  const mount = () => render(
    <QueryClientProvider client={client}>
      <ConnectionFeedbackProvider><ConnectionNotice /></ConnectionFeedbackProvider>
    </QueryClientProvider>,
  )

  it('keeps offline feedback until records are refreshed manually', async () => {
    const user = userEvent.setup()
    const read = vi.fn().mockResolvedValue({ balance: 42 })
    const observer = new QueryObserver(client, { queryKey: ['records'], queryFn: read, staleTime: Infinity })
    const unsubscribe = observer.subscribe(() => undefined)
    await waitFor(() => expect(observer.getCurrentResult().isSuccess).toBe(true))
    mount()
    act(() => network(false))
    expect(screen.getByRole('status')).toHaveTextContent("You're offline")
    act(() => network(true))
    expect(screen.getByRole('status')).toHaveTextContent('Connection detected')
    expect(read).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Refresh records' }))
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    expect(read).toHaveBeenCalledTimes(2)
    unsubscribe()
  })

  it('keeps an unconfirmed save blocked when refresh fails, then clears it after success', async () => {
    const user = userEvent.setup()
    const read = vi.fn().mockRejectedValue(new Error('Unavailable'))
    const observer = new QueryObserver(client, { queryKey: ['records'], queryFn: read, initialData: [] })
    const unsubscribe = observer.subscribe(() => undefined)
    mount()
    act(() => handleWriteError(new Error('Failed to fetch')))
    await user.click(screen.getByRole('button', { name: 'Refresh records' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Could not refresh'))
    expect(connectionSnapshot()).toBe('uncertain')
    read.mockResolvedValue([])
    await user.click(screen.getByRole('button', { name: 'Refresh records' }))
    await waitFor(() => expect(connectionSnapshot()).toBe('online'))
    unsubscribe()
  })

  it('never treats an absent active query as verification of an unconfirmed save', async () => {
    const user = userEvent.setup()
    mount()
    act(() => handleWriteError(new Error('Failed to fetch')))
    await user.click(screen.getByRole('button', { name: 'Refresh records' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Open Accounts or Activity'))
    expect(connectionSnapshot()).toBe('uncertain')
  })

  it('allows a new refresh after a network bounce while an old refresh is still pending', async () => {
    const user = userEvent.setup()
    let finishOld: (value: number[]) => void = () => undefined
    const read = vi.fn().mockResolvedValue([1])
    const observer = new QueryObserver(client, { queryKey: ['records'], queryFn: read, staleTime: Infinity })
    const unsubscribe = observer.subscribe(() => undefined)
    await waitFor(() => expect(observer.getCurrentResult().isSuccess).toBe(true))
    read.mockImplementationOnce(() => new Promise<number[]>(resolve => { finishOld = resolve }))
    mount()
    act(() => handleWriteError(new Error('Failed to fetch')))
    await user.click(screen.getByRole('button', { name: 'Refresh records' }))
    expect(screen.getByRole('button', { name: 'Refreshing...' })).toBeDisabled()
    act(() => { network(false); network(true) })
    await user.click(screen.getByRole('button', { name: 'Refresh records' }))
    await waitFor(() => expect(connectionSnapshot()).toBe('online'))
    expect(read).toHaveBeenCalledTimes(3)
    await act(async () => finishOld([1]))
    unsubscribe()
  })

  it('does not queue an initial offline read for automatic execution on reconnect', async () => {
    const productionClient = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() })
    network(false)
    const read = vi.fn().mockRejectedValue(new Error('Network unavailable'))
    const observer = new QueryObserver(productionClient, { queryKey: ['new-page'], queryFn: read })
    const unsubscribe = observer.subscribe(() => undefined)
    await waitFor(() => expect(observer.getCurrentResult().isError).toBe(true))
    expect(observer.getCurrentResult().fetchStatus).toBe('idle')
    expect(read).toHaveBeenCalledTimes(1)
    read.mockResolvedValue([])
    network(true)
    await act(async () => new Promise(resolve => setTimeout(resolve, 30)))
    expect(read).toHaveBeenCalledTimes(1)
    await productionClient.invalidateQueries({ refetchType: 'active' })
    expect(read).toHaveBeenCalledTimes(2)
    unsubscribe()
    productionClient.clear()
  })
})
