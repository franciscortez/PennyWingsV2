import { Component, useSyncExternalStore, type ReactNode } from 'react'
import { WifiOff } from 'lucide-react'
import { connectionSnapshot, subscribeConnection } from '@/lib/connectivity'

function OfflineRouteRecovery() {
  const offline = useSyncExternalStore(subscribeConnection, connectionSnapshot) === 'offline'
  return (
    <section className="offline-data-state">
      <span className="offline-illustration"><WifiOff aria-hidden="true" size={40} strokeWidth={1.5} /></span>
      <h1>{offline ? 'Reconnect to open this page' : "This page couldn't load"}</h1>
      <p>This page couldn't be downloaded. Connect to Wi-Fi or mobile data, then reload to try again.</p>
      <p className="mt-3" id="offline-reload-hint">Reloading clears unsaved entries in this open app.</p>
      <button type="button" disabled={offline} aria-describedby="offline-reload-hint" onClick={() => window.location.reload()}>Reload page</button>
    </section>
  )
}

type BoundaryState = { kind: 'ready' } | { kind: 'unavailable-chunk' } | { kind: 'error'; error: unknown }

export class OfflineRouteBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { kind: 'ready' }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    const message = error instanceof Error ? error.message : ''
    const chunkError = /dynamically imported module|importing a module script failed|loading chunk .+ failed|chunkloaderror/i.test(message)
    // React.lazy retains rejected imports after reconnect, so keep those route-local too.
    return chunkError ? { kind: 'unavailable-chunk' } : { kind: 'error', error }
  }

  render() {
    if (this.state.kind === 'error') throw this.state.error
    return this.state.kind === 'unavailable-chunk' ? <OfflineRouteRecovery /> : this.props.children
  }
}
