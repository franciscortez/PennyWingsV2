import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router'

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
  const { pathname } = useLocation()

  // A new page starts at the top instead of inheriting the previous scroll.
  useEffect(() => {
    window.scrollTo({ behavior: 'instant', left: 0, top: 0 })
  }, [pathname])

  return (
    <div key={pathname} className="route-enter">
      {children}
    </div>
  )
}
