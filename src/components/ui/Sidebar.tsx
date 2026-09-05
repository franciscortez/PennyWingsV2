import {
  BarChart3,
  CreditCard,
  History,
  Home,
  LogOut,
  Menu,
  Settings,
  Wallet,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { AppButton } from '@/components/ui/Button'
import { MobileNavigation } from '@/components/ui/MobileNavigation'
import { PennyWingsMark } from '@/sections/shared'
import type { SidebarInfo } from '@/types'
import { ThemeToggle } from './ThemeToggle'

type SidebarProps = {
  onOpenAssistant: () => void
  onSignOut: () => void
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
  onOpenAssistant,
  onSignOut,
  onToggleSidebar,
  sidebarInfo,
  sidebarOpen,
}: SidebarProps) {
  const location = useLocation()

  return (
    <>
      <DesktopSidebar
        onSignOut={onSignOut}
        onToggleSidebar={onToggleSidebar}
        pathname={location.pathname}
        sidebarOpen={sidebarOpen}
      />
      <MobileNavigation
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
