import { LoaderCircle, RefreshCw, ShieldAlert, Wifi, WifiOff } from 'lucide-react'
import { useConnectionFeedback } from '@/hooks/useConnectionFeedback'
import { useTopOverlay } from '@/hooks/useTopOverlay'

export function ConnectionNotice({ compact = false, announce = true }: { compact?: boolean; announce?: boolean }) {
  const feedback = useConnectionFeedback()
  const topOverlay = useTopOverlay()
  if (!feedback || feedback.state === 'online') return null
  const { state, uncertain, message, refresh } = feedback
  const offline = state === 'offline'
  const refreshing = state === 'refreshing'
  const Icon = offline ? WifiOff : refreshing ? LoaderCircle : uncertain ? ShieldAlert : Wifi
  const heading = offline ? "You're offline" : refreshing ? 'Refreshing records' : uncertain ? 'Save not confirmed' : state === 'failed' ? 'Unable to reconnect' : 'Connection detected'
  const description = offline
    ? compact ? 'Reconnect before saving. Your entries remain in this open form.' : 'Shown figures may be out of date. Reconnect before saving changes.'
    : uncertain ? 'Refresh and check your records before trying to save again.'
    : refreshing ? 'Checking your latest records. Your open form stays here.'
    : 'Refresh your records to check the latest figures. Your open form stays here.'

  return (
    <aside className={`connection-notice${compact ? ' connection-notice-compact' : ''}`} data-state={state}>
      <Icon className={refreshing ? 'connection-icon animate-spin motion-reduce:animate-none' : 'connection-icon'} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div role={announce && (compact || !topOverlay) ? 'status' : undefined} aria-atomic={announce || undefined}>
          <p className="connection-heading">{heading}</p>
          <p>{message || description}</p>
        </div>
        {!offline && <button type="button" disabled={refreshing} onClick={() => void refresh()}>
          <RefreshCw aria-hidden="true" size={16} />{refreshing ? 'Refreshing...' : 'Refresh records'}
        </button>}
      </div>
    </aside>
  )
}
