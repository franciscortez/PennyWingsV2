export function registerPwa() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const register = () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {
      // The online app remains usable when worker registration is unavailable.
    })
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
