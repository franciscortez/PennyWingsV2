import { useId, useState } from 'react'
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
import { SidebarTooltip } from '@/components/ui/SidebarTooltip'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PennyWingsMark } from '@/sections/shared'
import type { SidebarInfo } from '@/types'

type SidebarProps = {
  onOpenAssistant: () => void
  onSignOut: () => void
  onToggleSidebar: () => void
  sidebarInfo: SidebarInfo
  sidebarOpen: boolean
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Accounts', href: '/accounts', icon: CreditCard },
  { name: 'Activity', href: '/transactions', icon: History },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Monitoring', href: '/monitoring', icon: Wallet },
  { name: 'Settings', href: '/profile', icon: Settings },
]

const focusClasses =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:focus-visible:outline-pink-300'
const inactiveClasses =
  'text-slate-600 hover:bg-pink-50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-pink-400'

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
        sidebarInfo={sidebarInfo}
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
  sidebarInfo,
  sidebarOpen,
}: {
  onSignOut: () => void
  onToggleSidebar: () => void
  pathname: string
  sidebarInfo: SidebarInfo
  sidebarOpen: boolean
}) {
  const contentId = useId()
  const toggleLabel = sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'

  return (
    <aside
      aria-label="Desktop sidebar"
      className={`fixed left-0 top-0 z-40 hidden h-dvh flex-col border-r border-pink-100 bg-paper font-geist selection:bg-pink-100 selection:text-pink-900 dark:border-slate-800 dark:bg-slate-950 dark:selection:bg-slate-700 dark:selection:text-pink-200 md:flex ${
        sidebarOpen ? 'w-72 xl:w-80' : 'w-24'
      }`}
    >
      <div className={`flex shrink-0 items-center gap-2 p-6 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
        {sidebarOpen && (
          <Link
            to="/dashboard"
            tabIndex={0}
            className={`flex min-h-11 min-w-0 items-center gap-2 rounded-full text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100 ${focusClasses}`}
          >
            <PennyWingsMark className="h-8 w-11 shrink-0" />
            <span className="truncate">PennyWings</span>
          </Link>
        )}
        <SidebarTooltip enabled={!sidebarOpen} label={toggleLabel}>
          {(tooltipProps) => (
            <AppButton
              {...tooltipProps}
              type="button"
              onClick={onToggleSidebar}
              size="icon"
              variant="ghost"
              aria-label={toggleLabel}
              aria-expanded={sidebarOpen}
              aria-controls={contentId}
              className="h-11 w-11 motion-reduce:transform-none motion-reduce:transition-none dark:hover:text-pink-400"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </AppButton>
          )}
        </SidebarTooltip>
      </div>

      <div id={contentId} data-sidebar-scroll-region className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <nav aria-label="Primary desktop navigation" className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => (
            <SidebarLink key={item.name} item={item} active={pathname === item.href} expanded={sidebarOpen} />
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-pink-100 p-4 dark:border-slate-800">
          <SidebarProfile expanded={sidebarOpen} info={sidebarInfo} />
          <ThemeToggle expanded={sidebarOpen} />
          <SidebarTooltip enabled={!sidebarOpen} label="Sign out">
            {(tooltipProps) => (
              <AppButton
                {...tooltipProps}
                type="button"
                onClick={onSignOut}
                variant="danger"
                aria-label="Sign out"
                className={`w-full motion-reduce:transform-none motion-reduce:transition-none ${sidebarOpen ? 'justify-start gap-3 px-4' : 'px-0'}`}
              >
                <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                {sidebarOpen && <span className="truncate">Sign out</span>}
              </AppButton>
            )}
          </SidebarTooltip>
        </div>
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
    <SidebarTooltip enabled={!expanded} label={item.name}>
      {(tooltipProps) => (
        <Link
          {...tooltipProps}
          to={item.href}
          tabIndex={0}
          aria-label={item.name}
          aria-current={active ? 'page' : undefined}
          className={`flex min-h-12 items-center rounded-full text-sm font-medium transition-colors motion-reduce:transition-none ${focusClasses} ${expanded ? 'gap-3 px-4' : 'justify-center'} ${active
            ? 'bg-pink-700 text-paper hover:bg-pink-800 dark:bg-slate-800 dark:text-pink-400 dark:hover:bg-slate-700'
            : inactiveClasses}`}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {expanded && <span className="truncate">{item.name}</span>}
        </Link>
      )}
    </SidebarTooltip>
  )
}

function SidebarProfile({ expanded, info }: { expanded: boolean; info: SidebarInfo }) {
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null)
  const initial = info.displayName.trim().charAt(0).toUpperCase() || 'P'

  return (
    <SidebarTooltip enabled={!expanded} label="Settings">
      {(tooltipProps) => (
        <Link
          {...tooltipProps}
          to="/profile"
          tabIndex={0}
          aria-label={info.loading ? 'Settings, loading profile' : `Settings for ${info.displayName}`}
          aria-busy={info.loading}
          className={`flex min-h-14 items-center rounded-full py-2 transition-colors motion-reduce:transition-none ${focusClasses} ${inactiveClasses} ${expanded ? 'gap-3 px-3' : 'justify-center'}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-100 text-sm font-semibold text-pink-800 dark:bg-slate-800 dark:text-pink-400" aria-hidden="true">
            {info.loading ? (
              <span className="h-9 w-9 bg-slate-200 dark:bg-slate-700" />
            ) : info.avatarUrl && info.avatarUrl !== failedAvatar ? (
              <img src={info.avatarUrl} alt="" className="h-full w-full object-cover" onError={() => setFailedAvatar(info.avatarUrl)} />
            ) : initial}
          </span>
          {expanded && (
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                {info.loading ? 'Loading profile' : info.displayName}
              </span>
              {!info.loading && info.email && (
                <span className="block truncate text-xs text-slate-600 dark:text-slate-400">{info.email}</span>
              )}
            </span>
          )}
        </Link>
      )}
    </SidebarTooltip>
  )
}
