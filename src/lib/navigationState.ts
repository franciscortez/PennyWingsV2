const protectedPaths = new Set(['/dashboard', '/accounts', '/transactions', '/reports', '/debts', '/monitoring', '/profile'])
const returnKey = 'pennywings:return'
const navigationKey = 'pennywings:navigation'
let suppressReturnCapture = false

export function validProtectedTarget(value: string): string | null {
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) return null
  const url = new URL(value, window.location.origin)
  if (url.origin !== window.location.origin || !protectedPaths.has(url.pathname)) return null
  if (/access_token|refresh_token|id_token|code=/i.test(url.search + url.hash)) return null
  return url.pathname + url.search + url.hash
}

export function rememberReturnTarget(value: string) {
  if (suppressReturnCapture) return
  const target = validProtectedTarget(value)
  try { if (target) sessionStorage.setItem(returnKey, target) } catch { /* Storage may be disabled. */ }
}
export function markSignedOut() { suppressReturnCapture = true; clearReturnTarget() }
export function allowReturnCapture() { suppressReturnCapture = false }
export function readReturnTarget() {
  try { return validProtectedTarget(sessionStorage.getItem(returnKey) ?? '') ?? '/dashboard' } catch { return '/dashboard' }
}
export function clearReturnTarget() {
  try { sessionStorage.removeItem(returnKey) } catch { /* Storage may be disabled. */ }
}
export function reportMonth(value: string | null, fallback: string) {
  return value && /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : fallback
}

type NavigationMemory = { entries: Record<string, number>; tabs: Record<string, { url: string; y: number }> }
let memory: NavigationMemory = { entries: {}, tabs: {} }
let revision = 0
const listeners = new Set<() => void>()
export const subscribeNavigation = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const navigationSnapshot = () => revision
const notifyNavigation = () => { revision += 1; listeners.forEach((listener) => listener()) }
try {
  const saved: unknown = JSON.parse(sessionStorage.getItem(navigationKey) ?? 'null')
  if (saved && typeof saved === 'object' && 'entries' in saved && 'tabs' in saved) {
    // Persisted browser storage is untrusted; only copy validated values.
    if (saved.entries && typeof saved.entries === 'object') {
      for (const [key, y] of Object.entries(saved.entries)) if (typeof y === 'number' && Number.isFinite(y) && y >= 0) memory.entries[key] = y
    }
    if (saved.tabs && typeof saved.tabs === 'object') {
      for (const [key, tab] of Object.entries(saved.tabs)) {
        if (protectedPaths.has(key) && tab && typeof tab === 'object' && 'url' in tab && typeof tab.url === 'string' && validProtectedTarget(tab.url) && new URL(tab.url, location.origin).pathname === key && 'y' in tab && typeof tab.y === 'number' && Number.isFinite(tab.y) && tab.y >= 0) memory.tabs[key] = { url: tab.url, y: tab.y }
      }
    }
  }
} catch { /* A fresh session needs no stored navigation state. */ }

export function savePosition(key: string, url: string, y: number) {
  if (!validProtectedTarget(url)) return
  const path = new URL(url, location.origin).pathname
  const changedUrl = memory.tabs[path]?.url !== url
  memory.entries[key] = y
  memory.entries = Object.fromEntries(Object.entries(memory.entries).slice(-80))
  memory.tabs[path] = { url, y }
  try { sessionStorage.setItem(navigationKey, JSON.stringify(memory)) } catch { /* Keep in-memory continuity. */ }
  if (changedUrl) notifyNavigation()
}
export function tabDestination(path: string) { return memory.tabs[path]?.url ?? path }
export function savedPosition(key: string, path: string, tab: boolean) { return tab ? memory.tabs[path]?.y ?? 0 : memory.entries[key] ?? 0 }
export function clearNavigationMemory() {
  memory = { entries: {}, tabs: {} }
  notifyNavigation()
  try { sessionStorage.removeItem(navigationKey) } catch { /* Storage may be disabled. */ }
}

let navigationOwner: string | null = null
export function syncNavigationOwner(userId: string) {
  let owner = navigationOwner
  try {
    owner ??= sessionStorage.getItem('pennywings:navigation-owner')
    sessionStorage.setItem('pennywings:navigation-owner', userId)
  } catch { /* In-memory isolation still applies when storage is unavailable. */ }
  navigationOwner = userId
  if (owner !== userId) clearNavigationMemory()
  return owner !== userId
}
