import { afterEach, describe, expect, it } from 'vitest'

import { applyTheme, syncThemeColor } from '@/lib/theme'

const installMetas = () => {
  document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#c94466" data-theme="light"><meta name="theme-color" content="#020617" data-theme="dark">')
}
afterEach(() => {
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove())
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
  localStorage.clear()
})

describe('browser theme colors', () => {
  it('follows an explicit app theme rather than relying on OS preference', () => {
    installMetas()
    applyTheme('dark')
    expect(document.querySelector('meta[data-theme="dark"]')).toHaveAttribute('media', 'all')
    expect(document.querySelector('meta[data-theme="light"]')).toHaveAttribute('media', 'not all')
    expect(document.querySelector('meta[data-theme="dark"]')).toHaveAttribute('content', '#020617')
    applyTheme('light')
    expect(document.querySelector('meta[data-theme="light"]')).toHaveAttribute('media', 'all')
    expect(document.querySelector('meta[data-theme="dark"]')).toHaveAttribute('media', 'not all')
  })

  it('can display public light chrome without overwriting the saved app preference', () => {
    installMetas()
    applyTheme('dark')
    syncThemeColor('light')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.querySelector('meta[data-theme="light"]')).toHaveAttribute('media', 'all')
  })
})
