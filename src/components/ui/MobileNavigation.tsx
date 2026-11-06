import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { BarChart3, CreditCard, History, Home, MoreHorizontal } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'
import { prefetchRoute } from '@/lib/routePrefetch'
import { tabDestination, subscribeNavigation, navigationSnapshot } from '@/lib/navigationState'

const destinations = [
  { label: 'Home', name: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Accounts', name: 'Accounts', href: '/accounts', icon: CreditCard },
  { label: 'Activity', name: 'Activity', href: '/transactions', icon: History },
  { label: 'Reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'More', name: 'More', href: '/more', icon: MoreHorizontal },
]

export function MobileNavigation() {
  const { pathname } = useLocation()
  useSyncExternalStore(subscribeNavigation, navigationSnapshot)
  const keyboardOpen = useMobileKeyboard()
  const navRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const indicatorRef = useRef<HTMLSpanElement | null>(null)
  const didInitIndicatorRef = useRef(false)
  const moreActive = ['/more', '/profile', '/debts', '/monitoring'].includes(pathname)
  const activeIndex = moreActive ? 4 : destinations.findIndex(({ href }) => pathname === href)

  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) return

    let disposed = false
    const place = (x: number, w: number) => {
      indicator.style.transform = `translateX(${x}px)`
      indicator.style.width = `${w}px`
      indicator.style.opacity = '1'
    }

    const update = () => {
      if (disposed || !nav.getClientRects().length) return
      const item = activeIndex >= 0 ? itemRefs.current[activeIndex] : null
      if (!item) {
        indicator.style.opacity = '0'
        return
      }
      const x = item.offsetLeft
      const w = item.offsetWidth
      if (!didInitIndicatorRef.current) {
        // First placement snaps into position; the dock now lives in the
        // persistent shell, so every later tab change glides via the CSS
        // transform transition.
        didInitIndicatorRef.current = true
        indicator.style.transition = 'none'
        place(x, w)
        void indicator.offsetWidth
        indicator.style.transition = ''
      } else {
        place(x, w)
      }
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(nav)
    for (const item of itemRefs.current) {
      if (item) observer.observe(item)
    }
    window.addEventListener('resize', update)
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
    fonts?.ready.then(update).catch(() => undefined)

    return () => {
      disposed = true
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [activeIndex, keyboardOpen])

  return (
    <div className="mobile-navigation-shell md:hidden" hidden={keyboardOpen}>
      <nav
        ref={navRef}
        aria-label="Primary mobile navigation"
        className="mobile-dock md:hidden"
      >
        <span ref={indicatorRef} aria-hidden="true" className="mobile-dock-indicator" />
        {destinations.map(({ href, icon: Icon, label, name }, index) => {
          const active = pathname === href
          const selected = active || (href === '/more' && moreActive)

          return (
            <Link
              key={href}
              ref={(element) => {
                itemRefs.current[index] = element
              }}
              to={tabDestination(href)}
              state={{ restoreTab: true }}
              onClick={(event) => {
                if (active && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                  event.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'instant' })
                }
              }}
              onFocus={() => prefetchRoute(href)}
              onPointerEnter={() => prefetchRoute(href)}
              onTouchStart={() => prefetchRoute(href)}
              aria-label={name === label ? name : `${label} (${name})`}
              aria-current={active ? 'page' : selected ? 'location' : undefined}
              className="mobile-dock-item"
              data-selected={selected}
            >
              <span className="mobile-dock-icon" aria-hidden="true">
                <Icon size={24} strokeWidth={selected ? 2.25 : 1.75} />
              </span>
              <span className="mobile-dock-label">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
