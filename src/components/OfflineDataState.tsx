import { WifiOff } from 'lucide-react'

export function OfflineDataState() {
  return (
    <section className="offline-data-state">
      <span className="offline-illustration"><WifiOff aria-hidden="true" size={40} strokeWidth={1.5} /></span>
      <h1>Reconnect to load this page</h1>
      <p>Your records aren't available in this open session yet. Connect to Wi-Fi or mobile data, then use Refresh records above.</p>
    </section>
  )
}
