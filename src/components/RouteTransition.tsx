import { useEffect, type ReactNode } from 'react'
import { useLocation, useNavigationType } from 'react-router'
import { savePosition, savedPosition } from '@/lib/navigationState'

type RouteTransitionProps = {
  children: ReactNode
}

/**
 * Wraps the routed page, never the app chrome. Keying on the pathname gives each
 * page a fresh element so `.route-enter` plays once per navigation; the sidebar
 * and dock stay mounted outside it. The animation is enter-only so navigation is
 * never delayed, and it leaves no transform behind once it ends.
 */
export default function RouteTransition({ children }: RouteTransitionProps) {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    const { key, pathname, search, hash, state } = location
    const tab = Boolean(state && typeof state === 'object' && 'restoreTab' in state && state.restoreTab)
    const y = navigationType === 'POP' || tab ? savedPosition(key, pathname, tab && navigationType !== 'POP') : 0
    let restoring = true
    let latestY = y
    savePosition(key, pathname + search + hash, y)
    let frame = 0
    const started = performance.now()
    const restore = () => {
      if (!restoring) return
      let anchor: HTMLElement | null = null
      try { if (hash) anchor = document.getElementById(decodeURIComponent(hash.slice(1))) } catch { /* Ignore malformed fragments. */ }
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'instant' })
        latestY = window.scrollY
        restoring = false
      } else if ((!hash && document.documentElement.scrollHeight - window.innerHeight >= y && !document.querySelector('[aria-busy="true"]')) || performance.now() - started > 4000) {
        window.scrollTo({ top: y, left: 0, behavior: 'instant' })
        latestY = window.scrollY
        restoring = false
      } else frame = requestAnimationFrame(restore)
    }
    if (!hash && y === 0) { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); restoring = false }
    else frame = requestAnimationFrame(restore)
    const save = () => {
      if (!restoring && document.body.style.position !== 'fixed') {
        latestY = window.scrollY
        savePosition(key, pathname + search + hash, latestY)
      }
    }
    const interrupt = () => { restoring = false; cancelAnimationFrame(frame) }
    window.addEventListener('scroll', save, { passive: true })
    window.addEventListener('pagehide', save)
    window.addEventListener('wheel', interrupt, { passive: true })
    window.addEventListener('touchmove', interrupt, { passive: true })
    return () => {
      savePosition(key, pathname + search + hash, latestY)
      cancelAnimationFrame(frame)
      history.scrollRestoration = previousRestoration
      window.removeEventListener('scroll', save)
      window.removeEventListener('pagehide', save)
      window.removeEventListener('wheel', interrupt)
      window.removeEventListener('touchmove', interrupt)
    }
  }, [location, navigationType])

  return (
    <div key={location.pathname} className="route-enter">
      {children}
    </div>
  )
}
