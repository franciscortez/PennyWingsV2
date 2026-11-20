import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { applyTheme, getInitialTheme, getSavedTheme, saveTheme } from '@/lib/theme'

type Listener = () => void

// A controllable prefers-color-scheme query so the tests can flip the OS theme.
const installSystemTheme = (initial: 'light' | 'dark') => {
  let dark = initial === 'dark'
  const listeners = new Set<Listener>()
  const original = window.matchMedia

  window.matchMedia = ((query: string) => ({
    get matches() {
      return query === '(prefers-color-scheme: dark)' && dark
    },
    media: query,
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
  })) as unknown as typeof window.matchMedia

  return {
    listenerCount: () => listeners.size,
    setSystemTheme: (next: 'light' | 'dark') => {
      dark = next === 'dark'
      listeners.forEach((listener) => listener())
    },
    restore: () => {
      window.matchMedia = original
    },
  }
}

function Probe() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  )
}

describe('theme persistence and OS following', () => {
  let system: ReturnType<typeof installSystemTheme>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = ''
  })

  afterEach(() => {
    system?.restore()
    localStorage.clear()
  })

  it('reads an explicit choice first and the OS otherwise', () => {
    system = installSystemTheme('dark')

    expect(getSavedTheme()).toBeNull()
    expect(getInitialTheme()).toBe('dark')

    saveTheme('light')

    expect(getSavedTheme()).toBe('light')
    expect(getInitialTheme()).toBe('light')
  })

  it('ignores unknown saved values', () => {
    system = installSystemTheme('light')
    localStorage.setItem('theme', 'sepia')

    expect(getSavedTheme()).toBeNull()
    expect(getInitialTheme()).toBe('light')
  })

  it('paints a theme without remembering it', () => {
    system = installSystemTheme('light')

    applyTheme('dark')

    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('follows OS changes while nothing is saved, and never saves them', () => {
    system = installSystemTheme('light')
    render(<ThemeProvider><Probe /></ThemeProvider>)

    expect(screen.getByRole('button')).toHaveTextContent('light')

    act(() => system.setSystemTheme('dark'))

    expect(screen.getByRole('button')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('stops following the OS once the user toggles, and saves the choice', async () => {
    const user = userEvent.setup()
    system = installSystemTheme('light')
    render(<ThemeProvider><Probe /></ThemeProvider>)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toHaveTextContent('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(system.listenerCount()).toBe(0)

    act(() => system.setSystemTheme('light'))

    expect(screen.getByRole('button')).toHaveTextContent('dark')
  })

  it('does not follow the OS when a theme was already saved', () => {
    system = installSystemTheme('light')
    saveTheme('light')
    render(<ThemeProvider><Probe /></ThemeProvider>)

    expect(system.listenerCount()).toBe(0)

    act(() => system.setSystemTheme('dark'))

    expect(screen.getByRole('button')).toHaveTextContent('light')
  })
})
