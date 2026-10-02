import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus } from 'lucide-react'
import { StrictMode, useContext, type ReactNode } from 'react'
import { Link, MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { MobileActionProvider } from '@/context/MobileActionContext'
import { MobileActionContext } from '@/context/mobileActionContextValue'
import { useCurrentMobileAction, useMobilePrimaryAction } from '@/hooks/useMobilePrimaryAction'

function Observer() {
  const action = useCurrentMobileAction()
  return action ? <button onClick={action.onSelect}>{action.label}</button> : <p>No action</p>
}

function Registration({ enabled, onSelect }: { enabled: boolean; onSelect: () => void }) {
  useMobilePrimaryAction(enabled ? { label: 'New transaction', icon: Plus, onSelect } : null)
  return null
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <StrictMode><MemoryRouter><MobileActionProvider>{children}</MobileActionProvider></MemoryRouter></StrictMode>
)

describe('mobile action registration', () => {
  it('uses the latest callback and removes a registration when it becomes unavailable', async () => {
    const first = vi.fn()
    const next = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<><Registration enabled onSelect={first} /><Observer /></>, { wrapper })
    await user.click(screen.getByRole('button', { name: 'New transaction' }))
    expect(first).toHaveBeenCalledOnce()

    rerender(<><Registration enabled onSelect={next} /><Observer /></>)
    await user.click(screen.getByRole('button', { name: 'New transaction' }))
    expect(next).toHaveBeenCalledOnce()
    expect(first).toHaveBeenCalledOnce()

    rerender(<><Registration enabled={false} onSelect={next} /><Observer /></>)
    expect(screen.getByText('No action')).toBeInTheDocument()
  })

  it('never exposes a registration from a different route', async () => {
    // Intentionally keep the registering component mounted across navigation.
    function StaleOwner() {
      const context = useContext(MobileActionContext)!
      return <button onClick={() => context.register('/', { label: 'New transaction', icon: Plus, onSelect: vi.fn() })}>Register</button>
    }
    const user = userEvent.setup()
    render(<><StaleOwner /><Observer /><Link to="/reports">Reports</Link></>, { wrapper })
    await user.click(screen.getByRole('button', { name: 'Register' }))
    expect(screen.getByRole('button', { name: 'New transaction' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Reports' }))
    expect(screen.getByText('No action')).toBeVisible()
  })

  it('keeps the newer action when an older owner cleans up', () => {
    const { result, rerender } = renderHook(() => useContext(MobileActionContext), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MobileActionProvider>{children}</MobileActionProvider>
      ),
    })
    let releaseFirst: () => void
    let releaseNext: () => void
    act(() => { releaseFirst = result.current!.register('/dashboard', { label: 'First', icon: Plus, onSelect: vi.fn() }) })
    act(() => { releaseNext = result.current!.register('/accounts', { label: 'Next', icon: Plus, onSelect: vi.fn() }) })
    act(() => releaseFirst())
    rerender()
    expect(result.current?.registration?.action.label).toBe('Next')
    act(() => releaseNext())
    expect(result.current?.registration).toBeNull()
  })

  it('drops the previous user action when the provider key changes', () => {
    const { rerender } = render(
      <MemoryRouter><MobileActionProvider key="first"><Registration enabled onSelect={vi.fn()} /><Observer /></MobileActionProvider></MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'New transaction' })).toBeVisible()
    rerender(<MemoryRouter><MobileActionProvider key="second"><Observer /></MobileActionProvider></MemoryRouter>)
    expect(screen.getByText('No action')).toBeVisible()
  })
})
