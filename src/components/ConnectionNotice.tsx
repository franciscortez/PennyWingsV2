import { useState, useSyncExternalStore } from 'react'
import { clearUncertainWrite, connectionSnapshot, subscribeConnection } from '@/lib/connectivity'
import { queryClient } from '@/lib/queryClient'

export function ConnectionNotice() {
  const status = useSyncExternalStore(subscribeConnection, connectionSnapshot)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  if (status === 'online') return null
  const refresh = async () => {
    setRefreshing(true)
    setMessage('')
    try {
      await queryClient.invalidateQueries({ refetchType: 'active' }, { throwOnError: true })
      clearUncertainWrite()
    } catch { setMessage('Could not refresh. Reconnect and try again.') }
    finally { setRefreshing(false) }
  }
  return <aside className="connection-notice" role = "status" >
    <p>{ status === 'offline' ? 'Offline. Shown figures may be out of date. Reconnect to save; your open form stays here.' : 'A save could not be confirmed. Refresh, then check your records before trying again.'
} </p>
{ status === 'uncertain' ? <button type="button" disabled = { refreshing } onClick = {() => void refresh() }> { refreshing? 'Refreshing…': 'Refresh records' } </button> : null}
{ message ? <p>{ message } </p> : null}
</aside>
}
