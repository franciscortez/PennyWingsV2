import { AppError } from '@/lib/errors'

let uncertainWrite = false
const listeners = new Set<() => void>()
export const subscribeConnection = (listener: () => void) => {
  listeners.add(listener)
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => { listeners.delete(listener); window.removeEventListener('online', listener); window.removeEventListener('offline', listener) }
}
export const connectionSnapshot = () => !navigator.onLine ? 'offline' : uncertainWrite ? 'uncertain' : 'online'
export function assertOnline(checkUncertain = true) {
  if (!navigator.onLine) throw new AppError('You are offline. Reconnect before saving. Your open form has been kept.', { code: 'OFFLINE' })
  if (checkUncertain && uncertainWrite) throw new AppError('The last save could not be confirmed. Refresh and check your records before saving again.', { code: 'UNCONFIRMED' })
}
export function clearUncertainWrite() {
  uncertainWrite = false
  listeners.forEach((listener) => listener())
}
export function handleWriteError(error: unknown) {
  if (error instanceof AppError && ['OFFLINE', 'UNCONFIRMED'].includes(error.code ?? '')) return
  if (isTransportError(error)) {
    uncertainWrite = true
    if (error instanceof Error) error.message = 'Save completion could not be confirmed. Refresh and check your records before trying again.'
    listeners.forEach((listener) => listener())
  }
}

export function isTransportError(error: unknown): boolean {
  let current: unknown = error
  const visited = new Set<unknown>()
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current)
    if ('name' in current && current.name === 'AbortError') return false
    if ('message' in current && typeof current.message === 'string' && /failed to fetch|fetch failed|network|load failed|connection|timeout/i.test(current.message)) return true
    current = 'cause' in current ? current.cause : null
  }
  return false
}
