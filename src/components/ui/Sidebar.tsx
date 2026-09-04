import {
  BarChart3,
  Bot,
  ChevronRight,
  CreditCard,
  History,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  Settings,
  Wallet,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { AppButton } from '@/components/ui/Button'
import { PennyWingsMark } from '@/sections/shared'
import type { SidebarInfo } from '@/types'
import { ThemeToggle } from './ThemeToggle'

type SidebarProps = {
  mobileMenuOpen: boolean
  onCloseMobileMenu: () => void
  onOpenAssistant: () => void
  onSignOut: () => void
  onToggleMobileMenu: () => void
  onToggleSidebar: () => void
  sidebarInfo: SidebarInfo
  sidebarOpen: boolean
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, mobile: true },
  { name: 'Accounts', href: '/accounts', icon: CreditCard, mobile: true },
  { name: 'Activity', href: '/transactions', icon: History, mobile: true },
  { name: 'Reports', href: '/reports', icon: BarChart3, mobile: true },
  { name: 'Monitoring', href: '/monitoring', icon: Wallet, mobile: true },
  { name: 'Settings', href: '/profile', icon: Settings, mobile: false, mobileMenu: false },
]

export function Sidebar({
  mobileMenuOpen,
  onCloseMobileMenu,
  onOpenAssistant,
  onSignOut,
  onToggleMobileMenu,
  onToggleSidebar,
  sidebarInfo,
  sidebarOpen,
}: SidebarProps) {
  const location = useLocation()
  const visibleMobileItems = navigation.filter((item) => item.mobile)
  const hiddenMobileItems = navigation.filter(
    (item) => !item.mobile && item.mobileMenu !== false,
  )

  return (
    <>
      <DesktopSidebar
        onSignOut={onSignOut}
        onToggleSidebar={onToggleSidebar}
        pathname={location.pathname}
        sidebarOpen={sidebarOpen}
      />
      <MobileNavigation
        items={visibleMobileItems}
        menuOpen={mobileMenuOpen}
        pathname={location.pathname}
        secondaryItems={hiddenMobileItems}
        onCloseMenu={onCloseMobileMenu}
        onToggleMenu={onToggleMobileMenu}
      />
      <MobileMenu
        items={hiddenMobileItems}
        open={mobileMenuOpen}
        onClose={onCloseMobileMenu}
        onOpenAssistant={onOpenAssistant}
        onSignOut={onSignOut}
        sidebarInfo={sidebarInfo}
      />
    </>
  )
}

function DesktopSidebar({
  onSignOut,
  onToggleSidebar,
  pathname,
  sidebarOpen,
}: {
  onSignOut: () => void
  onToggleSidebar: () => void
  pathname: string
  sidebarOpen: boolean
}) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-pink-100 bg-white transition-[width] duration-300 dark:border-slate-800 dark:bg-slate-900 md:flex ${
        sidebarOpen ? 'w-72 xl:w-80' : 'w-24'
      }`}
    >
      <div
        className={`flex items-center p-6 ${
          sidebarOpen ? 'justify-between' : 'justify-center'
        }`}
      >
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 overflow-hidden transition-all ${
            sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'
          }`}
        >
          <PennyWingsMark className="h-12 w-16 shrink-0" />
          <span className="bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-xl font-black text-transparent">
            PennyWings
          </span>
        </Link>
        <AppButton
          type="button"
          onClick={onToggleSidebar}
          size="icon"
          variant="ghost"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="dark:text-slate-400 dark:hover:text-pink-400 dark:hover:bg-slate-800/60"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </AppButton>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {navigation.map((item) => (
          <SidebarLink
            key={item.name}
            item={item}
            active={pathname === item.href}
            expanded={sidebarOpen}
          />
        ))}
      </nav>

      <div className="border-t border-pink-50 dark:border-slate-800/80 p-4 space-y-2">
        <ThemeToggle expanded={sidebarOpen} />
        <AppButton
          type="button"
          onClick={onSignOut}
          variant="danger"
          className={`w-full rounded-xl py-3 ${
            sidebarOpen ? 'justify-start gap-3 px-4' : 'justify-center px-0'
          }`}
          title={sidebarOpen ? undefined : 'Sign out'}
        >
          <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span
            className={`truncate transition-all ${
              sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'
            }`}
          >
            Sign Out
          </span>
        </AppButton>
      </div>
    </aside>
  )
}


function ProfileAvatar({ sidebarInfo }: { sidebarInfo: SidebarInfo }) {
  if (sidebarInfo.avatarUrl) {
    return (
      <img
        src={sidebarInfo.avatarUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl object-cover"
      />
    )
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500 text-sm font-black uppercase text-white">
      {sidebarInfo.displayName.slice(0, 1)}
    </span>
  )
}

function SidebarLink({
  active,
  expanded,
  item,
}: {
  active: boolean
  expanded: boolean
  item: (typeof navigation)[number]
}) {
  const Icon = item.icon

  return (
    <Link
      to={item.href}
      title={expanded ? undefined : item.name}
      className={`flex items-center rounded-xl py-3 font-bold transition ${
        expanded ? 'gap-3 px-4' : 'justify-center px-0'
      } ${
        active
          ? 'bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400'
          : 'text-gray-400 hover:bg-pink-50/70 hover:text-pink-500 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-pink-400'
      }`}
    >
      <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
      <span
        className={`truncate transition-all ${
          expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
        }`}
      >
        {item.name}
      </span>
    </Link>
  )
}

function MobileNavigation({
  items,
  menuOpen,
  onCloseMenu,
  onToggleMenu,
  pathname,
  secondaryItems,
}: {
  items: typeof navigation
  menuOpen: boolean
  onCloseMenu: () => void
  onToggleMenu: () => void
  pathname: string
  secondaryItems: typeof navigation
}) {
  const secondaryActive = secondaryItems.some((item) => item.href === pathname)
  const moreActive = menuOpen || secondaryActive

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 min-h-[calc(5rem+env(safe-area-inset-bottom))] border-t border-pink-100 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
    >
      <div className="flex min-h-16 w-full items-stretch">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onCloseMenu}
              aria-label={item.name}
              aria-current={active ? 'page' : undefined}
              title={item.name}
              className={`group relative flex min-h-15 min-w-0 flex-1 basis-0 items-center justify-center rounded-2xl px-1 py-2 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                active
                  ? 'text-white'
                  : 'text-gray-400 hover:text-pink-600 dark:text-slate-400 dark:hover:text-pink-300'
              }`}
            >
              <span
                data-active-indicator={active ? 'true' : undefined}
                className={`flex h-12 w-14 items-center justify-center rounded-full transition-all duration-200 motion-reduce:transition-none ${
                  active
                    ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-300/50 ring-1 ring-inset ring-white/30 dark:from-pink-500 dark:to-rose-600 dark:shadow-pink-950/70'
                    : 'group-hover:bg-pink-50 group-hover:shadow-sm group-active:scale-95 dark:group-hover:bg-slate-800'
                }`}
                aria-hidden="true"
              >
                <Icon
                  className={`h-7 w-7 transition-transform duration-200 motion-reduce:transition-none ${
                    active ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-110'
                  }`}
                />
              </span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={onToggleMenu}
          className={`group relative flex min-h-15 min-w-0 flex-1 basis-0 items-center justify-center rounded-2xl px-1 py-2 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            moreActive
              ? 'text-white'
              : 'text-gray-400 hover:text-pink-600 dark:text-slate-400 dark:hover:text-pink-300'
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={menuOpen ? 'Close more navigation' : 'Open more navigation'}
          title="More"
        >
          <span
            data-active-indicator={moreActive ? 'true' : undefined}
            className={`flex h-12 w-14 items-center justify-center rounded-full transition-all duration-200 motion-reduce:transition-none ${
              moreActive
                ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-300/50 ring-1 ring-inset ring-white/30 dark:from-pink-500 dark:to-rose-600 dark:shadow-pink-950/70'
                : 'group-hover:bg-pink-50 group-hover:shadow-sm group-active:scale-95 dark:group-hover:bg-slate-800'
            }`}
            aria-hidden="true"
          >
            <MoreHorizontal
              className={`h-7 w-7 transition-transform duration-200 motion-reduce:transition-none ${
                moreActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-110'
              }`}
            />
          </span>
        </button>
      </div>
    </nav>
  )
}

function MobileMenu({
  items,
  onClose,
  onOpenAssistant,
  onSignOut,
  open,
  sidebarInfo,
}: {
  items: typeof navigation
  onClose: () => void
  onOpenAssistant: () => void
  onSignOut: () => void
  open: boolean
  sidebarInfo: SidebarInfo
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] top-0 z-40 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close more navigation"
      />
      <section
        className="animate-fade-in absolute bottom-3 left-3 right-3 overflow-hidden rounded-4xl border border-pink-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
        role="menu"
        aria-label="More navigation"
      >
        <Link
          to="/profile"
          onClick={onClose}
          className="mb-2 flex items-center gap-3 rounded-3xl bg-linear-to-r from-pink-50 to-pink-100/60 p-4 transition hover:from-pink-100 hover:to-pink-50 dark:from-slate-800 dark:to-slate-800/60 dark:hover:from-slate-800/80 dark:hover:to-slate-800"
          role="menuitem"
        >
          <ProfileAvatar sidebarInfo={sidebarInfo} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-gray-800 dark:text-slate-200">
              {sidebarInfo.loading ? 'Loading...' : sidebarInfo.displayName}
            </p>
            <p className="truncate text-xs font-bold text-gray-400 dark:text-slate-500">
              {sidebarInfo.email ?? 'Profile'}
            </p>
          </div>
          <ProfileLinkIndicator />
        </Link>

        {/* Theme Toggle in Mobile Menu */}
        <div className="mb-2 p-2 border border-pink-50 dark:border-slate-800/60 rounded-3xl bg-pink-50/20 dark:bg-slate-800/20">
          <ThemeToggle expanded={true} />
        </div>

        <button
          type="button"
          onClick={onOpenAssistant}
          className="mb-2 flex w-full items-center gap-3 rounded-3xl border border-pink-100 bg-pink-50/40 p-3 text-left transition hover:border-pink-200 hover:bg-pink-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          role="menuitem"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-pink-500 dark:bg-slate-900 dark:text-pink-400">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black text-gray-700 dark:text-slate-200">
              AI Assistant
            </span>
            <span className="block truncate text-xs font-bold text-gray-400 dark:text-slate-500">
              Financial guidance
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-pink-400" aria-hidden="true" />
        </button>

        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
          {items.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className="flex w-full min-w-0 flex-col items-center justify-center gap-2 rounded-3xl border border-pink-50 bg-pink-50/40 px-2 py-4 text-center transition hover:border-pink-200 hover:bg-pink-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                role="menuitem"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-pink-500 dark:bg-slate-900 dark:text-pink-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="truncate text-[10px] font-black uppercase tracking-tight text-gray-600 dark:text-slate-400">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        <AppButton
          type="button"
          onClick={onSignOut}
          variant="danger"
          className="mt-2 w-full justify-center gap-3 rounded-3xl px-5 py-3"
          role="menuitem"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sign Out
        </AppButton>
      </section>
    </div>
  )
}

function ProfileLinkIndicator() {
  return (
    <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-pink-400 dark:bg-slate-900 dark:text-pink-500">
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </span>
  )
}
