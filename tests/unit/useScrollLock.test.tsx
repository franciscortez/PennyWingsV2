import { renderHook } from '@testing-library/react'
import { StrictMode, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useScrollLock } from '@/hooks/useScrollLock'
import { acquireScrollLock, getScrollLockOwnerCount } from '@/lib/scrollLock'

import {
  resetDocumentStyles,
  setScrollPosition,
  stubScrollEnvironment,
} from '../helpers/scrollEnvironment'

const strictWrapper = ({ children }: { children: ReactNode }) => (
  <StrictMode>{children}</StrictMode>
)

describe('useScrollLock', () => {
  beforeEach(() => {
    resetDocumentStyles()
    stubScrollEnvironment()
  })

  afterEach(() => {
    resetDocumentStyles()
    vi.restoreAllMocks()
  })

  it('locks the page while enabled and restores it on unmount', () => {
    const { unmount } = renderHook(() => useScrollLock(true))

    expect(document.body.style.position).toBe('fixed')
    expect(getScrollLockOwnerCount()).toBe(1)

    unmount()

    expect(document.body.style.position).toBe('')
    expect(getScrollLockOwnerCount()).toBe(0)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 400)
  })

  it('holds one lock while the enabled flag stays true across re-renders', () => {
    const { rerender } = renderHook(({ enabled }) => useScrollLock(enabled), {
      initialProps: { enabled: true },
    })

    // A re-render must not release and re-snapshot the page: the original offset
    // has to survive typing or switching the transaction type.
    setScrollPosition(0, 1200)
    rerender({ enabled: true })

    expect(document.body.style.top).toBe('-400px')
    expect(getScrollLockOwnerCount()).toBe(1)
  })

  it('owns nothing while disabled and locks and releases as it toggles', () => {
    const { rerender } = renderHook(({ enabled }) => useScrollLock(enabled), {
      initialProps: { enabled: false },
    })

    expect(document.body.style.position).toBe('')
    expect(getScrollLockOwnerCount()).toBe(0)

    rerender({ enabled: true })
    expect(document.body.style.position).toBe('fixed')

    rerender({ enabled: false })
    expect(document.body.style.position).toBe('')
    expect(getScrollLockOwnerCount()).toBe(0)
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('survives the StrictMode setup/cleanup/setup cycle', () => {
    const { unmount } = renderHook(() => useScrollLock(true), {
      wrapper: strictWrapper,
    })

    expect(document.body.style.position).toBe('fixed')
    expect(getScrollLockOwnerCount()).toBe(1)

    unmount()

    expect(document.body.style.position).toBe('')
    expect(getScrollLockOwnerCount()).toBe(0)
  })

  it('keeps the page locked while another owner is still active', () => {
    const releaseOtherOwner = acquireScrollLock()
    const { unmount } = renderHook(() => useScrollLock(true))

    expect(getScrollLockOwnerCount()).toBe(2)

    unmount()

    expect(document.body.style.position).toBe('fixed')
    expect(getScrollLockOwnerCount()).toBe(1)
    expect(window.scrollTo).not.toHaveBeenCalled()

    releaseOtherOwner()

    expect(document.body.style.position).toBe('')
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
  })
})
