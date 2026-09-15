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
  Sun,
  Wallet,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useTheme } from '@/context/ThemeContext'
import type { SidebarInfo } from '@/types'

const destinations = [
  { label: 'Home', name: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Accounts', name: 'Accounts', href: '/accounts', icon: CreditCard },
  { label: 'Activity', name: 'Activity', href: '/transactions', icon: History },
  { label: 'Reports', name: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Monitor', name: 'Monitoring', href: '/monitoring', icon: Wallet },
]

// Each route renders its own Layout, so this component remounts on every
// navigation. Without this cache the pill would snap to the new tab on first
// paint; starting it at the previous tab's geometry lets the CSS transform
// transition glide it left-to-right instead.
let lastDockIndicatorGeometry: { x: number; w: number } | null = null

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

  const openMore = () => {
    setMoreOpen(true)
  }

  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) return

    let raf = 0
    const place = (x: number, w: number) => {
      indicator.style.transform = `translateX(${x}px)`
      indicator.style.width = `${w}px`
      indicator.style.opacity = '1'
      lastDockIndicatorGeometry = { x, w }
    }

    const update = () => {
      const item = activeIndex >= 0 ? itemRefs.current[activeIndex] : null
      if (!item) {
        indicator.style.opacity = '0'
        return
      }
      const x = item.offsetLeft
      const w = item.offsetWidth
      if (!didInitIndicatorRef.current) {
        didInitIndicatorRef.current = true
        const cached = lastDockIndicatorGeometry
        if (cached && (cached.x !== x || cached.w !== w)) {
          // Start at the previous tab so the transition glides across.
          indicator.style.transition = 'none'
          indicator.style.transform = `translateX(${cached.x}px)`
          indicator.style.width = `${cached.w}px`
          indicator.style.opacity = '1'
          void indicator.offsetWidth
          indicator.style.transition = ''
          raf = requestAnimationFrame(() => place(x, w))
        } else {
          indicator.style.transition = 'none'
          place(x, w)
          void indicator.offsetWidth
          indicator.style.transition = ''
        }
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
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [activeIndex])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!moreOpen || !dialog) return

    const desktop = window.matchMedia('(min-width: 768px)')
    // A native modal keeps keyboard focus inside the sheet and the page inert.
    if (!desktop.matches) dialog.showModal()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleResize = () => {
      if (desktop.matches) {
        dialog.close()
        setMoreOpen(false)
      }
    }
    desktop.addEventListener('change', handleResize)

    return () => {
      desktop.removeEventListener('change', handleResize)
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [moreOpen])

  return (
    <>
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
          <h2 id="mobile-more-title" className="text-base font-bold tracking-tight">
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
              <span className="block truncate text-sm font-bold">
                {sidebarInfo.loading ? 'Loading…' : sidebarInfo.displayName}
              </span>
              <span className="mt-0.5 block text-xs text-gray-600 dark:text-slate-400">
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
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">
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
