import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Bot, ChevronRight, Download, LogOut, Moon, Receipt, Sun, Wallet } from 'lucide-react'
import { Link } from 'react-router'

import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/hooks/useAuth'
import { useAssistant } from '@/hooks/useAssistant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSidebarInfo } from '@/hooks/useSidebarInfo'
import { useSignOutConfirmation } from '@/hooks/useSignOutConfirmation'
import { tabDestination } from '@/lib/navigationState'
import { prefetchRoute } from '@/lib/routePrefetch'

const tools = [
  { name: 'Debts', href: '/debts', icon: Receipt },
  { name: 'Monitoring', href: '/monitoring', icon: Wallet },
]

export default function More() {
  const { loading, profile, user } = useAuth()
  const info = useSidebarInfo(loading, user?.email, profile)
  const { theme, toggleTheme } = useTheme()
  const { openAssistant } = useAssistant()
  const signOut = useSignOutConfirmation()
  const standalone = useMediaQuery('(display-mode: standalone)') || ('standalone' in navigator && navigator.standalone === true)
  const heading = useRef<HTMLHeadingElement>(null)
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null)
  const initial = info.displayName.trim().charAt(0).toUpperCase() || 'P'

  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])

  return (
    <div className="more-page">
      <h1 ref={heading} tabIndex={-1}>More</h1>

      <Link to="/profile" className="more-profile more-row"
        onFocus={() => prefetchRoute('/profile')} onPointerEnter={() => prefetchRoute('/profile')} onTouchStart={() => prefetchRoute('/profile')}
        aria-busy={info.loading}>
        <span className="more-avatar" aria-hidden="true">
          {info.loading ? <span className="more-avatar-loading" /> : info.avatarUrl && info.avatarUrl !== failedAvatar ? (
            <img src={info.avatarUrl} alt="" width={44} height={44} onError={() => setFailedAvatar(info.avatarUrl)} />
          ) : initial}
        </span>
        <span className="more-row-copy">
          <span className="more-name">{info.loading ? 'Loading profile…' : info.displayName}</span>
          <span className="more-description">Profile &amp; settings</span>
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>

      <section aria-labelledby="more-tools">
        <h2 id="more-tools">Tools</h2>
        <div className="more-group">
          {tools.map(({ name, href, icon: Icon }) => (
            <Link key={href} to={tabDestination(href)} state={{ restoreTab: true }} className="more-row"
              onFocus={() => prefetchRoute(href)} onPointerEnter={() => prefetchRoute(href)} onTouchStart={() => prefetchRoute(href)}>
              <Icon size={22} aria-hidden="true" />
              <span className="more-row-copy">{name}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          ))}
          <button type="button" className="more-row" onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true })
            openAssistant()
          }}>
            <Bot size={22} aria-hidden="true" />
            <span className="more-row-copy">AI Assistant<span className="more-description">Talk through your finances</span></span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section aria-labelledby="more-preferences">
        <h2 id="more-preferences">Preferences</h2>
        <div className="more-group">
          <button type="button" className="more-row" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? <Moon size={22} aria-hidden="true" /> : <Sun size={22} aria-hidden="true" />}
            <span className="more-row-copy">Appearance</span>
            <span className="more-value">{theme === 'light' ? 'Light' : 'Dark'}</span>
          </button>
          {!standalone && (
            <details className="more-install">
              <summary className="more-row">
                <Download size={22} aria-hidden="true" />
                <span className="more-row-copy">Install on iPhone</span>
                <ChevronRight size={18} aria-hidden="true" />
              </summary>
              <div className="more-install-copy">
                <p>Open PennyWings in Safari. Open the page menu if needed, tap Share, then Add to Home Screen. Turn on Open as Web App if shown, then tap Add.</p>
                <p>An internet connection is needed to load and save your finances.</p>
              </div>
            </details>
          )}
        </div>
      </section>

      <button type="button" className="more-row more-sign-out" onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true })
        void signOut()
      }}>
        <LogOut size={22} aria-hidden="true" /><span>Sign out</span>
      </button>
    </div>
  )
}
