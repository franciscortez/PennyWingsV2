import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { acquireScrollLock, getScrollLockOwnerCount } from '@/lib/scrollLock'

import {
  resetDocumentStyles,
  setClientWidth,
  setDocumentHeight,
  setDocumentWidth,
  setScrollPosition,
  stubScrollEnvironment,
} from '../helpers/scrollEnvironment'

describe('scrollLock', () => {
  let scrollBehaviorDuringScroll: string[]

  beforeEach(() => {
    resetDocumentStyles()
    scrollBehaviorDuringScroll = stubScrollEnvironment().scrollBehaviorDuringScroll
  })

  afterEach(() => {
    resetDocumentStyles()
    vi.restoreAllMocks()
  })

  it('freezes the page on the first acquire and compensates a classic scrollbar', () => {
    const release = acquireScrollLock()

    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.top).toBe('-400px')
    expect(document.body.style.left).toBe('0px')
    expect(document.body.style.width).toBe('100%')
    // innerWidth (1024) - clientWidth (1009): a 15px gutter the frozen body no
    // longer occupies, so the content would jump wider without this.
    expect(document.body.style.paddingRight).toBe('15px')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(getScrollLockOwnerCount()).toBe(1)

    release()
  })

  it('does not compensate when the page has no space-reserving scrollbar', () => {
    setClientWidth(1024)

    const release = acquireScrollLock()

    expect(document.body.style.paddingRight).toBe('')

    release()
  })

  it('restores the page position, styles and scroll behaviour on the final release', () => {
    setDocumentWidth(1400)
    setScrollPosition(30, 400)
    const release = acquireScrollLock()

    expect(document.body.style.left).toBe('-30px')

    release()

    expect(document.body.style.position).toBe('')
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.top).toBe('')
    expect(document.body.style.left).toBe('')
    expect(document.body.style.width).toBe('')
    expect(document.body.style.paddingRight).toBe('')
    expect(document.documentElement.style.overflow).toBe('')
    // The stylesheet's `html { scroll-behavior: smooth }` must apply again.
    expect(document.documentElement.style.scrollBehavior).toBe('')
    expect(getScrollLockOwnerCount()).toBe(0)
    expect(window.scrollTo).toHaveBeenCalledWith(30, 400)
    expect(scrollBehaviorDuringScroll).toEqual(['auto'])
  })

  it('preserves pre-existing inline styles, priorities and offsets', () => {
    document.body.style.setProperty('overflow', 'clip', 'important')
    document.body.style.setProperty('padding-right', '2rem')
    document.documentElement.style.setProperty('scroll-behavior', 'smooth')

    const release = acquireScrollLock()

    // An inline padding-right is already compensating; adding the measured
    // gutter on top would double-compensate.
    expect(document.body.style.paddingRight).toBe('2rem')

    release()

    expect(document.body.style.getPropertyValue('overflow')).toBe('clip')
    expect(document.body.style.getPropertyPriority('overflow')).toBe('important')
    expect(document.body.style.paddingRight).toBe('2rem')
    expect(document.documentElement.style.scrollBehavior).toBe('smooth')
  })

  it('joins an in-flight lock without overwriting the original offset', () => {
    const releaseFirst = acquireScrollLock()

    // Whatever moved the page while an overlay was open must not become the
    // restoration target for the next owner.
    setScrollPosition(0, 1200)
    const releaseSecond = acquireScrollLock()

    expect(document.body.style.top).toBe('-400px')
    expect(getScrollLockOwnerCount()).toBe(2)

    releaseSecond()

    expect(document.body.style.position).toBe('fixed')
    expect(document.body.style.top).toBe('-400px')
    expect(getScrollLockOwnerCount()).toBe(1)

    releaseFirst()

    expect(document.body.style.position).toBe('')
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 400)
  })

  it('is idempotent, keeps ownership until the last owner releases, and restores once', () => {
    const releaseFirst = acquireScrollLock()
    const releaseSecond = acquireScrollLock()

    // Release the later owner first: the lock outlives it, and repeated
    // releases must not release another owner's lock or restore the page twice.
    releaseSecond()
    releaseSecond()

    expect(document.body.style.position).toBe('fixed')
    expect(getScrollLockOwnerCount()).toBe(1)

    releaseFirst()
    releaseFirst()

    expect(document.body.style.position).toBe('')
    expect(getScrollLockOwnerCount()).toBe(0)
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
  })

  it('clamps restoration so a shorter destination page is not scrolled', () => {
    const release = acquireScrollLock()

    setDocumentHeight(120)
    release()

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
