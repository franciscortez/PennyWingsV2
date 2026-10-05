import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  ChevronRight,
  CreditCard,
  History,
  Home,
  LogOut,
  Moon,
  MoreHorizontal,
  Receipt,
  Sun,
  Wallet,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'
import { useTheme } from '@/context/ThemeContext'
import { prefetchRoute } from '@/lib/routePrefetch'
import type { SidebarInfo } from '@/types'

const destinations = [
  { label: 'Home', name: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Accounts', name: 'Accounts', href: '/accounts', icon: CreditCard },
  { label: 'Activity', name: 'Activity', href: '/transactions', icon: History },
  { label: 'Reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Debts', name: 'Debts', href: '/debts', icon: Receipt },
  { label: 'Monitor', name: 'Monitoring', href: '/monitoring', icon: Wallet },
]

type MobileNavigationProps = {
  onOpenAssistant: () => void
  onSignOut: () => void
  sidebarInfo: SidebarInfo
}

export function MobileNavigation({
  onOpenAssistant,
  onSignOut,
  sidebarInfo,
}: MobileNavigationProps) {
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const keyboardOpen = useMobileKeyboard()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const indicatorRef = useRef<HTMLSpanElement | null>(null)
  const didInitIndicatorRef = useRef(false)
  const profileActive = pathname === '/profile'
  const activeIndex = destinations.findIndex(({ href }) => pathname === href)

  const closeMore = () => {
    dialogRef.current?.close()
    setMoreOpen(false)
    moreButtonRef.current?.focus({ preventScroll: true })
  }

  // The sheet is a native dialog (browser-owned top layer and focus), so only
  // the page freeze is delegated to the shared lock manager.
  useScrollLock(moreOpen && !isDesktop)

  const openMore = () => {
    setMoreOpen(true)
  }

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

  useEffect(() => {
    const dialog = dialogRef.current

    if (!moreOpen || !dialog || isDesktop) return

    // A native modal keeps keyboard focus inside the sheet and the page inert.
    if (!dialog.open) dialog.showModal()

    return () => {
      if (dialog.open) dialog.close()
    }
  }, [isDesktop, moreOpen])

  // The sheet is only shown below the desktop breakpoint (the dock hides and the
  // sidebar takes over), so crossing it dismisses the sheet instead of leaving
  // an invisible overlay holding a lock.
  useEffect(() => {
    if (!moreOpen) return

    const desktop = window.matchMedia('(min-width: 768px)')
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMoreOpen(false)
    }

    desktop.addEventListener('change', handleChange)
    return () => desktop.removeEventListener('change', handleChange)
  }, [moreOpen])

  return (
    <>
      <div className="mobile-navigation-shell md:hidden" hidden={keyboardOpen}>
        <nav
          ref={navRef}
          aria-label="Primary mobile navigation"
          className="mobile-dock md:hidden"
        >
          <span ref={indicatorRef} aria-hidden="true" className="mobile-dock-indicator" />
          {destinations.map(({ href, icon: Icon, label, name }, index) => {
            const active = pathname === href

            return (
              <Link
                key={href}
                ref={(element) => {
                  itemRefs.current[index] = element
                }}
                to={href}
                onFocus={() => prefetchRoute(href)}
                onPointerEnter={() => prefetchRoute(href)}
                onTouchStart={() => prefetchRoute(href)}
                aria-label={name === label ? name : `${label} (${name})`}
                aria-current={active ? 'page' : undefined}
                className="mobile-dock-item"
                data-selected={active}
              >
                <span className="mobile-dock-icon" aria-hidden="true">
                  <Icon size={24} strokeWidth={active ? 2.25 : 1.75} />
                </span>
              </Link>
            )
          })}
          <button
            ref={moreButtonRef}
            type="button"
            className="mobile-dock-item"
            aria-label="Open more navigation"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-controls="mobile-more-panel"
            onClick={openMore}
          >
            <span className="mobile-dock-icon" aria-hidden="true">
              <MoreHorizontal size={24} strokeWidth={1.75} />
            </span>
          </button>
        </nav>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-more-panel"
        aria-labelledby="mobile-more-title"
        className="mobile-more-panel md:hidden"
        onClose={() => setMoreOpen(false)}
        onCancel={(event) => {
          event.preventDefault()
          closeMore()
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
          if (!controls.length) return
          event.preventDefault()
          const current = controls.findIndex((control) => control === document.activeElement)
          const next = (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
          controls[next].focus()
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom
          ) closeMore()
        }}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <h2 id="mobile-more-title" className="text-base font-semibold tracking-tight">
            Your space
          </h2>
          <button
            type="button"
            onClick={closeMore}
            aria-label="Close more navigation"
            className="mobile-more-close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <Link
            to="/profile"
            onClick={closeMore}
            aria-current={profileActive ? 'page' : undefined}
            className="mobile-profile-link"
          >
            {sidebarInfo.avatarUrl ? (
              <img src={sidebarInfo.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="mobile-profile-initial" aria-hidden="true">
                {sidebarInfo.displayName.slice(0, 1)}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {sidebarInfo.loading ? 'Loading…' : sidebarInfo.displayName}
              </span>
              <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">
                Profile & settings
              </span>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>

          <button
            type="button"
            className="mobile-more-action"
            onClick={() => {
              closeMore()
              onOpenAssistant()
            }}
          >
            <Bot size={22} aria-hidden="true" />
            <span className="flex-1 text-left">
              <span className="block text-sm font-semibold">AI Assistant</span>
              <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">
                Talk through your finances
              </span>
            </span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="mobile-more-action"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={22} aria-hidden="true" /> : <Sun size={22} aria-hidden="true" />}
            <span className="flex-1 text-left text-sm font-semibold">Appearance</span>
            <span className="mobile-theme-value">{theme === 'light' ? 'Light' : 'Dark'}</span>
          </button>

          <div className="mx-3 my-1 border-t border-pink-100 dark:border-slate-800" />
          <button
            type="button"
            className="mobile-more-action mobile-sign-out"
            onClick={() => {
              closeMore()
              onSignOut()
            }}
          >
            <LogOut size={21} aria-hidden="true" />
            <span className="text-sm font-semibold">Sign out</span>
          </button>
        </div>
      </dialog>
    </>
  )
}
