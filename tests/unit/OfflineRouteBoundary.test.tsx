import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { OfflineRouteBoundary } from '@/components/OfflineRouteBoundary'

afterEach(() => { Object.defineProperty(navigator, 'onLine', { configurable: true, value: true }); vi.restoreAllMocks() })

function BrokenChunk(): never { throw new TypeError('Failed to fetch dynamically imported module: /assets/Reports.js') }

it('contains an offline chunk failure and offers manual reload only after connectivity returns', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
  render(<><nav>Persistent navigation</nav><OfflineRouteBoundary><BrokenChunk /></OfflineRouteBoundary></>)
  expect(screen.getByRole('navigation')).toHaveTextContent('Persistent navigation')
  expect(screen.getByRole('heading', { name: 'Reconnect to open this page' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Reload page' })).toBeDisabled()
  act(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    window.dispatchEvent(new Event('online'))
  })
  expect(screen.getByRole('button', { name: 'Reload page' })).toBeEnabled()
  expect(screen.getByText(/Reloading clears unsaved entries/)).toBeVisible()
})

it('propagates unrelated rendering bugs to the existing application error boundary', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
  function BrokenView(): never { throw new Error('Unexpected calculation failure') }
  expect(() => render(<OfflineRouteBoundary><BrokenView /></OfflineRouteBoundary>)).toThrow('Unexpected calculation failure')
})

it('keeps a cached lazy-import rejection route-local after reconnect', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  render(<OfflineRouteBoundary><BrokenChunk /></OfflineRouteBoundary>)
  expect(screen.getByRole('heading', { name: "This page couldn't load" })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Reload page' })).toBeEnabled()
})
