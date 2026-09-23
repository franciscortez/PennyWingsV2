import { afterEach, describe, expect, it } from 'vitest'

import {
  canReceiveFocus,
  focusFallback,
  getTabbableElements,
} from '@/lib/focusable'

describe('focusable', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('lists tabbable controls in document order and skips unreachable ones', () => {
    document.body.innerHTML = `
      <div id="root">
        <button id="first">First</button>
        <button disabled>Disabled</button>
        <div tabindex="-1">Programmatic only</div>
        <input type="hidden" />
        <div hidden><button>Hidden</button></div>
        <div inert><button>Inert</button></div>
        <a>No href</a>
        <select id="select"></select>
        <div id="custom" tabindex="0">Custom</div>
        <a id="link" href="#x">Link</a>
      </div>
    `

    const ids = getTabbableElements(document.getElementById('root')!).map(
      (element) => element.id,
    )

    expect(ids).toEqual(['first', 'select', 'custom', 'link'])
  })

  it('rejects disconnected, disabled and body elements as focus targets', () => {
    document.body.innerHTML = '<button id="live">Live</button><button id="off" disabled>Off</button>'

    expect(canReceiveFocus(document.getElementById('live'))).toBe(true)
    expect(canReceiveFocus(document.getElementById('off'))).toBe(false)
    expect(canReceiveFocus(document.createElement('button'))).toBe(false)
    expect(canReceiveFocus(document.body)).toBe(false)
    expect(canReceiveFocus(null)).toBe(false)
  })

  it('falls back to the page heading with a temporary tabindex', () => {
    document.body.innerHTML = '<main><h1>Transactions</h1></main><button id="other">Other</button>'
    const heading = document.querySelector('h1')!

    expect(focusFallback()).toBe(heading)
    expect(document.activeElement).toBe(heading)
    expect(heading).toHaveAttribute('tabindex', '-1')

    document.getElementById('other')!.focus()

    expect(heading).not.toHaveAttribute('tabindex')
  })

  it('falls back to main when the page has no heading, and to nothing when inert', () => {
    document.body.innerHTML = '<main id="main"></main>'

    expect(focusFallback()).toBe(document.getElementById('main'))

    document.body.innerHTML = '<div inert><main><h1>Title</h1></main></div>'

    expect(focusFallback()).toBeNull()
  })
})
