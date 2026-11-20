import { afterEach, describe, expect, it, vi } from 'vitest'

import { prefersReducedMotion, scrollBehavior } from '@/lib/motion'

const stubReducedMotion = (reduce: boolean) =>
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: reduce && query === '(prefers-reduced-motion: reduce)',
        media: query,
      }) as MediaQueryList,
  )

describe('motion preference helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports reduced motion and picks auto scrolling', () => {
    stubReducedMotion(true)

    expect(prefersReducedMotion()).toBe(true)
    expect(scrollBehavior()).toBe('auto')
  })

  it('allows smooth scrolling without a preference', () => {
    stubReducedMotion(false)

    expect(prefersReducedMotion()).toBe(false)
    expect(scrollBehavior()).toBe('smooth')
  })

  it('falls back to no reduced motion when matchMedia is missing', () => {
    const original = window.matchMedia

    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: undefined })

    try {
      expect(prefersReducedMotion()).toBe(false)
      expect(scrollBehavior()).toBe('smooth')
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: original })
    }
  })
})
