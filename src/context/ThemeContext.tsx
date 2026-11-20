import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import {
  applyTheme,
  getInitialTheme,
  getSavedTheme,
  getSystemTheme,
  saveTheme,
  type Theme,
} from '@/lib/theme'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  // Until the user toggles, the app follows the OS setting.
  const [followsSystem, setFollowsSystem] = useState(() => getSavedTheme() === null)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (!followsSystem) {
      return
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => setTheme(getSystemTheme())

    query.addEventListener('change', handleChange)

    return () => query.removeEventListener('change', handleChange)
  }, [followsSystem])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'

    saveTheme(next)
    setFollowsSystem(false)
    setTheme(next)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
