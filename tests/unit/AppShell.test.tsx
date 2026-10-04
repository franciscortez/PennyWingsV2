import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AppShell from '@/components/AppShell'

const guardMounts = vi.fn()
const sidebarMounts = vi.fn()

vi.mock('@/components/ProtectedRoute', () => ({
  default: function GuardStub({ children }: { children: React.ReactNode }) {
    useEffect(() => {
      guardMounts()
    }, [])
    return <>{children}</>
  },
}))

vi.mock('@/components/ui', () => ({
  Sidebar: function SidebarStub() {
    useEffect(() => {
      sidebarMounts()
    }, [])
    return <aside data-testid="sidebar" />
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    loading: false,
    profile: null,
    signOut: vi.fn(),
    user: { email: 'ana@example.test' },
  }),
}))
vi.mock('@/hooks/useAssistant', () => ({
  useAssistant: () => ({ openAssistant: vi.fn() }),
}))
vi.mock('@/hooks/useSidebarInfo', () => ({ useSidebarInfo: () => ({}) }))
vi.mock('@/lib/alert', () => ({ alerts: { confirmLogout: vi.fn() } }))
vi.mock('@/sections/assistant', () => ({ AssistantWidget: () => null }))

const renderShell = (initialPath = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="/dashboard"
            element={
              <div>
                <h1>Dashboard page</h1>
                <Link to="/accounts">Go to accounts</Link>
              </div>
            }
          />
          <Route
            path="/accounts"
            element={
              <div>
                <h1>Accounts page</h1>
                <Link to="/dashboard">Go to dashboard</Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('AppShell', () => {
  beforeEach(() => {
    guardMounts.mockClear()
    sidebarMounts.mockClear()
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('renders the routed page inside a single main landmark', async () => {
    renderShell()

    expect(await screen.findByRole('heading', { name: 'Dashboard page' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'Dashboard page' }),
    )
  })

  it('keeps the same sidebar node and mounts the guard once across navigation', async () => {
    const user = userEvent.setup()
    renderShell()

    const sidebarBefore = await screen.findByTestId('sidebar')
    await user.click(screen.getByRole('link', { name: 'Go to accounts' }))
    expect(await screen.findByRole('heading', { name: 'Accounts page' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Go to dashboard' }))
    expect(await screen.findByRole('heading', { name: 'Dashboard page' })).toBeInTheDocument()

    expect(screen.getByTestId('sidebar')).toBe(sidebarBefore)
    expect(sidebarMounts).toHaveBeenCalledTimes(1)
    expect(guardMounts).toHaveBeenCalledTimes(1)
  })

  it('re-keys the page wrapper per route so the enter animation replays', async () => {
    const user = userEvent.setup()
    renderShell()

    const first = (await screen.findByRole('heading', { name: 'Dashboard page' }))
      .closest('.route-enter') as HTMLElement
    expect(first).not.toBeNull()

    await user.click(screen.getByRole('link', { name: 'Go to accounts' }))
    const second = (await screen.findByRole('heading', { name: 'Accounts page' }))
      .closest('.route-enter') as HTMLElement

    expect(second).not.toBeNull()
    expect(second).not.toBe(first)
    expect(first.isConnected).toBe(false)
  })

  it('scrolls to the top when the route changes', async () => {
    const user = userEvent.setup()
    renderShell()
    await screen.findByRole('heading', { name: 'Dashboard page' })
    vi.mocked(window.scrollTo).mockClear()

    await act(async () => {
      await user.click(screen.getByRole('link', { name: 'Go to accounts' }))
    })

    expect(window.scrollTo).toHaveBeenCalledWith({ behavior: 'instant', left: 0, top: 0 })
  })
})
