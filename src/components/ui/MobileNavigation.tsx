import { useEffect, useRef, useState } from 'react'
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
  const profileActive = pathname === '/profile'

  const closeMore = () => {
    dialogRef.current?.close()
    setMoreOpen(false)
    moreButtonRef.current?.focus({ preventScroll: true })
  }

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
      <nav aria-label="Primary mobile navigation" className="mobile-dock md:hidden">
        {destinations.map(({ href, icon: Icon, label, name }) => {
          const active = pathname === href

          return (
            <Link
              key={href}
              to={href}
              aria-label={name === label ? name : `${label} (${name})`}
              aria-current={active ? 'page' : undefined}
              className="mobile-dock-item"
              data-selected={active}
            >
              <span className="mobile-dock-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              </span>
              <span className="mobile-dock-label">{label}</span>
            </Link>
          )
        })}
        <button
          ref={moreButtonRef}
          type="button"
          className="mobile-dock-item"
          data-selected={moreOpen || profileActive}
          aria-label="Open more navigation"
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          aria-controls="mobile-more-panel"
          onClick={() => setMoreOpen(true)}
        >
          <span className="mobile-dock-icon" aria-hidden="true">
            <MoreHorizontal size={22} strokeWidth={1.75} />
          </span>
          <span className="mobile-dock-label">More</span>
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
