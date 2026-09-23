import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getModalLayerCount, registerModalLayer } from '@/lib/modalLayers'

const appendToBody = (id: string) => {
  const element = document.createElement('div')
  element.id = id
  document.body.appendChild(element)
  return element
}

describe('modalLayers', () => {
  let root: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    root = appendToBody('root')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('inerts the rest of the body but not the layer itself', () => {
    const script = document.createElement('script')
    document.body.appendChild(script)
    const layer = appendToBody('layer')

    const handle = registerModalLayer(layer)

    expect(root).toHaveAttribute('inert')
    expect(layer).not.toHaveAttribute('inert')
    expect(script).not.toHaveAttribute('inert')
    expect(getModalLayerCount()).toBe(1)

    handle.release()

    expect(root).not.toHaveAttribute('inert')
    expect(getModalLayerCount()).toBe(0)
  })

  it('keeps only the topmost layer interactive and restores in order', () => {
    const first = appendToBody('first')
    const firstHandle = registerModalLayer(first)
    const second = appendToBody('second')
    const secondHandle = registerModalLayer(second)

    expect(first).toHaveAttribute('inert')
    expect(second).not.toHaveAttribute('inert')
    expect(root).toHaveAttribute('inert')

    secondHandle.release()

    // Closing the nested layer must not release the page early.
    expect(first).not.toHaveAttribute('inert')
    expect(root).toHaveAttribute('inert')

    firstHandle.release()

    expect(root).not.toHaveAttribute('inert')
  })

  it('restores the original inert state of each background node', () => {
    const alreadyInert = appendToBody('already-inert')
    alreadyInert.setAttribute('inert', '')
    const layer = appendToBody('layer')

    registerModalLayer(layer).release()

    expect(alreadyInert).toHaveAttribute('inert')
    expect(root).not.toHaveAttribute('inert')
  })

  it('treats a repeated release as a no-op', () => {
    const first = appendToBody('first')
    const firstHandle = registerModalLayer(first)
    const second = appendToBody('second')
    const secondHandle = registerModalLayer(second)

    secondHandle.release()
    secondHandle.release()

    expect(getModalLayerCount()).toBe(1)
    expect(root).toHaveAttribute('inert')

    firstHandle.release()
  })

  it('never inerts nodes appended after the layer opened, such as alerts', () => {
    const layer = appendToBody('layer')
    const handle = registerModalLayer(layer)
    const alert = appendToBody('swal-container')

    expect(alert).not.toHaveAttribute('inert')

    handle.release()

    expect(alert).not.toHaveAttribute('inert')
  })
})
