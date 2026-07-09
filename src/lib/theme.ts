export type Theme = 'light' | 'dark'

const themeStorageKey = 'theme'

export const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem(themeStorageKey) as Theme | null

  if (saved === 'light' || saved === 'dark') {
    return saved
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  localStorage.setItem(themeStorageKey, theme)
}
