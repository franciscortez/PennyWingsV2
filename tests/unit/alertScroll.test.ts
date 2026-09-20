import Swal from 'sweetalert2'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { alerts } from '@/lib/alert'
import { getOverlayCount, registerOverlay } from '@/lib/overlayStack'
import {
  acquireScrollLock,
  getScrollLockOwnerCount,
} from '@/lib/scrollLock'
import {
  resetDocumentStyles,
  stubScrollEnvironment,
} from '../helpers/scrollEnvironment'

describe('alert scroll lock and overlay integration', () => {
  beforeEach(() => {
    resetDocumentStyles()
    stubScrollEnvironment()
  })

  afterEach(() => {
    Swal.close()
    resetDocumentStyles()
    vi.restoreAllMocks()
  })

  it('acquires a scroll lock and registers as overlay when confirming, releasing on cancel', async () => {
    expect(getScrollLockOwnerCount()).toBe(0)
    expect(getOverlayCount()).toBe(0)

    const confirmPromise = alerts.confirm({
      title: 'Confirm action?',
      text: 'Are you sure?',
    })

    expect(getScrollLockOwnerCount()).toBe(1)
    expect(getOverlayCount()).toBe(1)
    expect(document.body.style.position).toBe('fixed')

    Swal.clickCancel()
    const result = await confirmPromise

    expect(result).toBe(false)
    expect(getScrollLockOwnerCount()).toBe(0)
    expect(getOverlayCount()).toBe(0)
    expect(document.body.style.position).toBe('')
  })

  it('keeps the page locked when closed underneath an existing modal owner', async () => {
    const modalOverlay = registerOverlay(document)
    const releaseModalLock = acquireScrollLock(document)

    expect(getScrollLockOwnerCount()).toBe(1)
    expect(getOverlayCount()).toBe(1)
    expect(modalOverlay.isTopmost()).toBe(true)

    const confirmPromise = alerts.confirmDelete('Member', 'Remove this member?')

    // Alert joins the lock and becomes topmost
    expect(getScrollLockOwnerCount()).toBe(2)
    expect(getOverlayCount()).toBe(2)
    expect(modalOverlay.isTopmost()).toBe(false)

    Swal.clickConfirm()
    const result = await confirmPromise

    expect(result).toBe(true)
    // Alert released, but modal remains locked and is topmost again
    expect(getScrollLockOwnerCount()).toBe(1)
    expect(getOverlayCount()).toBe(1)
    expect(modalOverlay.isTopmost()).toBe(true)
    expect(document.body.style.position).toBe('fixed')

    releaseModalLock()
    modalOverlay.release()

    expect(getScrollLockOwnerCount()).toBe(0)
    expect(getOverlayCount()).toBe(0)
    expect(document.body.style.position).toBe('')
  })
})
