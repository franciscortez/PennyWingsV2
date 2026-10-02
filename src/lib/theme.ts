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
  syncThemeColor(theme)
  localStorage.setItem(themeStorageKey, theme)
}

// Browser chrome follows the selected app theme, even when it differs from OS.
export const syncThemeColor = (theme: Theme) => {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"][data-theme]').forEach((meta) => {
    meta.setAttribute('media', meta.dataset.theme === theme ? 'all' : 'not all')
  })
}
