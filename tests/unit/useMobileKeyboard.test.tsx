import { act, renderHook } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'

class Viewport extends EventTarget {
  height = 800
  scale = 1
  resize(height: number, scale = 1) {
    this.height = height
    this.scale = scale
    this.dispatchEvent(new Event('resize'))
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('mobile keyboard visibility', () => {
  it('ignores browser chrome and zoom, hides for keyboard, and restores with hysteresis', () => {
    const viewport = new Viewport()
    vi.stubGlobal('innerHeight', 800)
    vi.stubGlobal('visualViewport', viewport)
    const { result } = renderHook(() => useMobileKeyboard())

    act(() => viewport.resize(730))
    expect(result.current).toBe(false)
    act(() => viewport.resize(400, 2))
    expect(result.current).toBe(false)
    act(() => viewport.resize(500))
    expect(result.current).toBe(true)
    act(() => viewport.resize(675))
    expect(result.current).toBe(true)
    act(() => viewport.resize(730))
    expect(result.current).toBe(false)

    vi.stubGlobal('innerHeight', 320)
    act(() => viewport.resize(320))
    expect(result.current).toBe(false)
    act(() => viewport.resize(140))
    expect(result.current).toBe(true)
    act(() => viewport.resize(320))
    expect(result.current).toBe(false)
  })

  it('cleans resize listeners under StrictMode and never registers scroll listeners', () => {
    const viewport = new Viewport()
    vi.stubGlobal('innerHeight', 800)
    vi.stubGlobal('visualViewport', viewport)
    const add = vi.spyOn(viewport, 'addEventListener')
    const remove = vi.spyOn(viewport, 'removeEventListener')
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
    const { unmount } = renderHook(() => useMobileKeyboard(), { wrapper })
    unmount()
    expect(add.mock.calls.every(([type]) => type === 'resize')).toBe(true)
    expect(remove.mock.calls).toHaveLength(add.mock.calls.length)
    for (const [type, listener] of add.mock.calls) expect(remove).toHaveBeenCalledWith(type, listener)
  })

  it('keeps navigation available when VisualViewport is unsupported', () => {
    vi.stubGlobal('visualViewport', undefined)
    const { result } = renderHook(() => useMobileKeyboard())
    expect(result.current).toBe(false)
  })
})
