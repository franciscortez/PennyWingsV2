import {
  BarChart3,
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

type SidebarProps = {
  mobileMenuOpen: boolean
  onCloseMobileMenu: () => void
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
  { name: 'Monitoring', href: '/monitoring', icon: Wallet, mobile: false },
  { name: 'Settings', href: '/profile', icon: Settings, mobile: false },
]

export function Sidebar({
  mobileMenuOpen,
  onCloseMobileMenu,
  onSignOut,
  onToggleMobileMenu,
  onToggleSidebar,
  sidebarInfo,
  sidebarOpen,
}: SidebarProps) {
  const location = useLocation()
  const visibleMobileItems = navigation.filter((item) => item.mobile)
  const hiddenMobileItems = navigation.filter((item) => !item.mobile)

  return (
    <>
      <DesktopSidebar
        onSignOut={onSignOut}
        onToggleSidebar={onToggleSidebar}
        pathname={location.pathname}
        sidebarInfo={sidebarInfo}
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
  sidebarInfo,
  sidebarOpen,
}: {
  onSignOut: () => void
  onToggleSidebar: () => void
  pathname: string
  sidebarInfo: SidebarInfo
  sidebarOpen: boolean
}) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-pink-100 bg-white transition-[width] duration-300 md:flex ${
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
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500 text-white">
            <PennyWingsMark className="h-7 w-7" />
          </span>
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

      <div className="border-t border-pink-50 p-4">
        <SidebarProfileCard
          expanded={sidebarOpen}
          sidebarInfo={sidebarInfo}
        />
        <AppButton
          type="button"
          onClick={onSignOut}
          variant="danger"
          className={`mt-2 w-full rounded-xl py-3 ${
            sidebarOpen ? 'gap-3 px-4' : 'px-0'
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

function SidebarProfileCard({
  expanded,
  sidebarInfo,
}: {
  expanded: boolean
  sidebarInfo: SidebarInfo
}) {
  return (
    <Link
      to="/profile"
      title={expanded ? undefined : sidebarInfo.displayName}
      className={`flex items-center rounded-2xl border border-pink-50 bg-pink-50/60 py-3 transition hover:bg-pink-50 ${
        expanded ? 'gap-3 px-3' : 'justify-center px-0'
      }`}
    >
      <ProfileAvatar sidebarInfo={sidebarInfo} />
      <span
        className={`min-w-0 transition-all ${
          expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <span className="block truncate text-sm font-black text-gray-800">
          {sidebarInfo.loading ? 'Loading...' : sidebarInfo.displayName}
        </span>
        <span className="block truncate text-xs font-bold text-gray-400">
          {sidebarInfo.email ?? 'Profile'}
        </span>
      </span>
    </Link>
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
          ? 'bg-pink-50 text-pink-600'
          : 'text-gray-400 hover:bg-pink-50/70 hover:text-pink-500'
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-pink-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(236,72,153,0.08)] backdrop-blur-md md:hidden">
      <div className="flex w-full items-stretch">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onCloseMenu}
              className={`flex min-w-0 flex-1 basis-0 flex-col items-center justify-center rounded-2xl px-1 py-2.5 transition ${
                active ? 'bg-pink-50 text-pink-600' : 'text-gray-400'
              }`}
            >
              <Icon className="mb-1 h-5 w-5" aria-hidden="true" />
              <span className="truncate text-[8px] font-black uppercase tracking-tight sm:text-[9px]">
                {item.name}
              </span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={onToggleMenu}
          className={`flex min-w-0 flex-1 basis-0 flex-col items-center justify-center rounded-2xl px-1 py-2.5 transition ${
            menuOpen || secondaryActive
              ? 'bg-pink-50 text-pink-600'
              : 'text-gray-400'
          }`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={menuOpen ? 'Close more navigation' : 'Open more navigation'}
        >
          <MoreHorizontal className="mb-1 h-5 w-5" aria-hidden="true" />
          <span className="text-[8px] font-black uppercase tracking-tight sm:text-[9px]">
            More
          </span>
        </button>
      </div>
    </nav>
  )
}

function MobileMenu({
  items,
  onClose,
  onSignOut,
  open,
  sidebarInfo,
}: {
  items: typeof navigation
  onClose: () => void
  onSignOut: () => void
  open: boolean
  sidebarInfo: SidebarInfo
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-20 top-0 z-40 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close more navigation"
      />
      <section
        className="animate-fade-in absolute bottom-3 left-3 right-3 overflow-hidden rounded-4xl border border-pink-100 bg-white p-3 shadow-2xl shadow-pink-200/40"
        role="menu"
        aria-label="More navigation"
      >
        <Link
          to="/profile"
          onClick={onClose}
          className="mb-2 flex items-center gap-3 rounded-3xl bg-linear-to-r from-pink-50 to-pink-100/60 p-4 transition hover:from-pink-100 hover:to-pink-50"
          role="menuitem"
        >
          <ProfileAvatar sidebarInfo={sidebarInfo} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-gray-800">
              {sidebarInfo.loading ? 'Loading...' : sidebarInfo.displayName}
            </p>
            <p className="truncate text-xs font-bold text-gray-400">
              {sidebarInfo.email ?? 'Profile'}
            </p>
          </div>
          <ProfileLinkIndicator />
        </Link>

        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className="flex w-full min-w-0 flex-col items-center justify-center gap-2 rounded-3xl border border-pink-50 bg-pink-50/40 px-2 py-4 text-center transition hover:border-pink-200 hover:bg-pink-50"
                role="menuitem"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-pink-500 shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="truncate text-[10px] font-black uppercase tracking-tight text-gray-600">
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
    <span className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-pink-400">
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </span>
  )
}
