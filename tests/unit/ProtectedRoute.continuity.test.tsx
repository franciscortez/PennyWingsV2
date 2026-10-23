import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import PublicRoute from '@/components/PublicRoute'
import { allowReturnCapture, clearNavigationMemory, markSignedOut, readReturnTarget, rememberReturnTarget, savePosition, syncNavigationOwner, tabDestination } from '@/lib/navigationState'

const auth = vi.hoisted(() => ({ loading: false, user: null as { id: string } | null }))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth }))
vi.mock('@/context/ThemeContext', () => ({ ThemeProvider: ({ children }: { children: ReactNode }) => children }))
vi.mock('@/components/ui', () => ({ PageLoader: () => <p>Loading</p> }))

function LocationView() {
  const location = useLocation()
  return <><p data-testid="location">{location.pathname + location.search + location.hash}</p><Link to="/dashboard">Home</Link></>
}
function Harness({ initial }: { initial: string }) {
  return <MemoryRouter initialEntries={[initial]}><Routes>
    <Route path="/login" element={<PublicRoute><LocationView /></PublicRoute>} />
    <Route path="*" element={<ProtectedRoute><LocationView /></ProtectedRoute>} />
  </Routes></MemoryRouter>
}
beforeEach(() => { auth.user = null; sessionStorage.clear(); allowReturnCapture(); clearNavigationMemory() })

it('returns from login to a deep link once, then allows Home navigation', async () => {
  const target = '/transactions?type=expense&page=2#entry'
  const view = render(<Harness initial={target} />)
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'))
  expect(readReturnTarget()).toBe(target)
  auth.user = { id: 'first-user' }
  view.rerender(<Harness initial={target} />)
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(target))
  expect(readReturnTarget()).toBe('/dashboard')
  await userEvent.click(screen.getByRole('link', { name: 'Home' }))
  expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
})

it('resumes the OAuth dashboard callback once without overriding subsequent navigation', async () => {
  rememberReturnTarget('/reports?month=2026-02')
  auth.user = { id: 'first-user' }
  render(<Harness initial="/dashboard" />)
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/reports?month=2026-02'))
  await userEvent.click(screen.getByRole('link', { name: 'Home' }))
  expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
})

it('does not hand the departing user’s filtered URL to the next sign-in', async () => {
  auth.user = { id: 'first-user' }
  const view = render(<Harness initial="/transactions?search=private" />)
  markSignedOut()
  auth.user = null
  view.rerender(<Harness initial="/transactions?search=private" />)
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'))
  expect(readReturnTarget()).toBe('/dashboard')
  allowReturnCapture()
  auth.user = { id: 'second-user' }
  view.rerender(<Harness initial="/transactions?search=private" />)
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard'))
})

it('clears the previous owner’s tab URLs even when session storage is unavailable', () => {
  const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Disabled') })
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Disabled') })
  try {
    syncNavigationOwner('first-user')
    savePosition('entry', '/transactions?search=private', 120)
    syncNavigationOwner('second-user')
    expect(tabDestination('/transactions')).toBe('/transactions')
  } finally { get.mockRestore(); set.mockRestore() }
})
