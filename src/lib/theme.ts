export type Theme = 'light' | 'dark'

const themeStorageKey = 'theme'

/** The theme the user chose explicitly, or null while following the OS. */
export const getSavedTheme = (): Theme | null => {
  const saved = localStorage.getItem(themeStorageKey)

  return saved === 'light' || saved === 'dark' ? saved : null
}

export const getSystemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const getInitialTheme = (): Theme => getSavedTheme() ?? getSystemTheme()

/**
 * Paints a theme without remembering it. Only an explicit choice is saved
 * (`saveTheme`); persisting the OS-derived theme would freeze it as if the
 * user had picked it and stop the app following later OS changes.
 */
export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  syncThemeColor(theme)
}

export const saveTheme = (theme: Theme) => {
  localStorage.setItem(themeStorageKey, theme)
}

// Browser chrome follows the selected app theme, even when it differs from OS.
export const syncThemeColor = (theme: Theme) => {
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"][data-theme]').forEach((meta) => {
    meta.setAttribute('media', meta.dataset.theme === theme ? 'all' : 'not all')
  })
}
