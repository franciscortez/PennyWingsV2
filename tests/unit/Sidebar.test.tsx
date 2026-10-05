import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Sidebar } from '@/components/ui/Sidebar'
import { SidebarTooltip } from '@/components/ui/SidebarTooltip'
import { ThemeProvider } from '@/context/ThemeContext'
import type { SidebarInfo } from '@/types'

vi.mock('@/components/ui/MobileNavigation', () => ({ MobileNavigation: () => null }))

const destinations = [
  ['Dashboard', '/dashboard'],
  ['Accounts', '/accounts'],
  ['Activity', '/transactions'],
  ['Reports', '/reports'],
  ['Debts', '/debts'],
  ['Monitoring', '/monitoring'],
  ['Settings', '/profile'],
] as const

const profile: SidebarInfo = {
  avatarUrl: null,
  displayName: 'Test User',
  email: 'test@example.com',
  loading: false,
}

function Harness({ expanded, info, onSignOut }: {
  expanded: boolean
  info: SidebarInfo
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(expanded)
  return (
    <Sidebar
      sidebarOpen={open}
      sidebarInfo={info}
      onToggleSidebar={() => setOpen((current) => !current)}
      onSignOut={onSignOut}
      onOpenAssistant={() => undefined}
    />
  )
}

const renderSidebar = (expanded = false, info = profile, route = '/dashboard') => {
  const onSignOut = vi.fn()
  render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <Harness expanded={expanded} info={info} onSignOut={onSignOut} />
      </ThemeProvider>
    </MemoryRouter>,
  )
  return {
    onSignOut,
    sidebar: screen.getByRole('complementary', { name: 'Desktop sidebar' }),
    nav: screen.getByRole('navigation', { name: 'Primary desktop navigation' }),
  }
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(16, 80, 64, 48))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('desktop sidebar', () => {
  it.each(destinations)('names collapsed links and marks only %s current', (name, route) => {
    const { nav } = renderSidebar(false, profile, route)
    expect(within(nav).getAllByRole('link')).toHaveLength(7)
    for (const [label, href] of destinations) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
    expect(within(nav).getByRole('link', { name })).toHaveAttribute('aria-current', 'page')
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Settings for Test User' })).toHaveAttribute('href', '/profile')
    expect(screen.queryByRole('link', { name: 'PennyWings' })).not.toBeInTheDocument()
  })

  it('preserves exact route matching', () => {
    const { nav } = renderSidebar(false, profile, '/accounts/archived')
    expect(nav.querySelector('[aria-current]')).toBeNull()
  })

  it('announces expansion and retains keyboard focus through both toggles', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.tab()
    const toggle = screen.getByRole('button', { name: 'Expand sidebar' })
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(toggle.getAttribute('aria-controls')!)).not.toBeNull()

    await user.keyboard(' ')
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAccessibleName('Collapse sidebar')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'PennyWings' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.keyboard(' ')
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAccessibleName('Expand sidebar')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps the theme action named and invokes sign-out', async () => {
    const user = userEvent.setup()
    const { onSignOut } = renderSidebar()
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('renders profile identity and falls back when an avatar fails', () => {
    const { sidebar } = renderSidebar(true, { ...profile, avatarUrl: '/missing-avatar.png' })
    const profileLink = sidebar.querySelector('[aria-busy]')!
    expect(profileLink).toHaveAccessibleName('Settings for Test User')
    expect(profileLink).toHaveAttribute('href', '/profile')
    expect(profileLink).toHaveTextContent('Test User')
    expect(profileLink).toHaveTextContent('test@example.com')
    const image = profileLink.querySelector('img')!
    expect(image).toHaveAttribute('alt', '')
    fireEvent.error(image)
    expect(profileLink.querySelector('img')).toBeNull()
    expect(profileLink).toHaveTextContent('T')
  })

  it('provides a static loading state and omits missing email', () => {
    const { sidebar } = renderSidebar(true, { ...profile, loading: true, email: null })
    const profileLink = sidebar.querySelector('[aria-busy]')!
    expect(profileLink).toHaveAttribute('aria-busy', 'true')
    expect(profileLink).toHaveAccessibleName('Settings, loading profile')
    expect(profileLink).toHaveTextContent('Loading profile')
    expect(profileLink).not.toHaveTextContent('test@example.com')
    expect(profileLink.querySelector('[class*="animate-"]')).toBeNull()
  })

  it('portals collapsed tooltips beyond the scroll region and dismisses on scroll', async () => {
    const user = userEvent.setup()
    const { sidebar, nav } = renderSidebar()
    const accounts = within(nav).getByRole('link', { name: 'Accounts' })
    await user.hover(accounts)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Accounts')
    expect(accounts).toHaveAttribute('aria-describedby', tooltip.id)
    expect(sidebar.contains(tooltip)).toBe(false)
    fireEvent.scroll(sidebar.querySelector('[data-sidebar-scroll-region]')!)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('sidebar tooltip', () => {
  const renderTooltip = () => render(
    <>
      <SidebarTooltip enabled label="Accounts">
        {(props) => <button {...props}>Open accounts</button>}
      </SidebarTooltip>
      <button>Next control</button>
    </>,
  )

  it('shows on keyboard focus and dismisses with Escape without moving focus', async () => {
    const user = userEvent.setup()
    renderTooltip()
    await user.tab()
    const trigger = screen.getByRole('button', { name: 'Open accounts' })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Accounts')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(trigger).not.toHaveAttribute('aria-describedby')
    await user.tab()
    await user.tab({ shift: true })
    expect(screen.getByRole('tooltip')).toHaveTextContent('Accounts')
  })

  it('stays visible when the pointer moves onto its content', async () => {
    const user = userEvent.setup()
    renderTooltip()
    await user.hover(screen.getByRole('button', { name: 'Open accounts' }))
    await user.hover(screen.getByRole('tooltip'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Accounts')
    await user.unhover(screen.getByRole('tooltip'))
    await screen.findByRole('button', { name: 'Next control' })
    await vi.waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })
})
