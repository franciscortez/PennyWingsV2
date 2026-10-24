import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { ConnectionFeedbackContext, type ConnectionFeedback } from '@/context/connectionFeedback'
import { clearUncertainWrite, connectionSnapshot, subscribeConnection } from '@/lib/connectivity'

export function ConnectionFeedbackProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const status = useSyncExternalStore(subscribeConnection, connectionSnapshot)
  const [recovery, setRecovery] = useState<'idle' | 'needed' | 'refreshing' | 'failed'>(() => navigator.onLine ? 'idle' : 'needed')
  const [message, setMessage] = useState('')
  const generation = useRef(0)
  const running = useRef<number | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeConnection(() => {
      generation.current += 1
      running.current = null
      setRecovery('needed')
      setMessage('')
    })
    return () => { generation.current += 1; unsubscribe() }
  }, [])

  const refresh = useCallback(async () => {
    if (!navigator.onLine || running.current !== null) return
    const started = ++generation.current
    running.current = started
    setRecovery('refreshing')
    setMessage('')
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const required = client.getQueryCache().findAll({ type: 'active' }).filter(query => !query.isDisabled())
      if (!required.length) {
        setMessage('Open Accounts or Activity, then refresh your records.')
        setRecovery('failed')
        return
      }
      await Promise.race([
        client.invalidateQueries({ refetchType: 'active' }, { throwOnError: true }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Refresh timed out')), 12000) }),
      ])
      if (generation.current !== started) return
      // Paused/skipped queries are not proof that an unconfirmed write has been checked.
      if (!navigator.onLine || required.some(query => query.state.status !== 'success' || query.state.fetchStatus !== 'idle' || query.state.isInvalidated)) {
        throw new Error('Records could not be verified')
      }
      clearUncertainWrite()
      setRecovery('idle')
    } catch {
      if (generation.current === started) {
        setMessage('Could not refresh. Check your connection and try again.')
        setRecovery('failed')
      }
    } finally {
      clearTimeout(timer)
      if (running.current === started) running.current = null
    }
  }, [client])

  const state: ConnectionFeedback['state'] = status === 'offline' ? 'offline'
    : recovery === 'refreshing' ? 'refreshing'
    : recovery === 'failed' ? 'failed'
    : status === 'uncertain' ? 'uncertain'
    : recovery === 'needed' ? 'reconnected' : 'online'
  const value = useMemo(() => ({ state, message, uncertain: status === 'uncertain', refresh }), [state, message, status, refresh])

  return <ConnectionFeedbackContext.Provider value={value}>{children}</ConnectionFeedbackContext.Provider>
}
