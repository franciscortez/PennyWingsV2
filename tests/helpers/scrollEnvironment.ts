import { vi } from 'vitest'

/**
 * jsdom has no layout engine: viewport widths, scroll offsets and document
 * metrics are all fixed at 0 unless a test states them. These helpers give the
 * scroll-lock tests the numbers a real browser would report, so the assertions
 * describe browser behaviour instead of jsdom defaults.
 */
export type ScrollEnvironment = {
  /** Records the inline `scroll-behavior` seen by each `window.scrollTo`. */
  scrollBehaviorDuringScroll: string[]
  scrollTo: ReturnType<typeof vi.spyOn>
}

export function stubScrollEnvironment({
  clientWidth = 1009,
  innerHeight = 768,
  innerWidth = 1024,
  scrollHeight = 4000,
  scrollX = 0,
  scrollY = 400,
}: {
  clientWidth?: number
  innerHeight?: number
  innerWidth?: number
  scrollHeight?: number
  scrollX?: number
  scrollY?: number
} = {}): ScrollEnvironment {
  const scrollBehaviorDuringScroll: string[] = []

  const setClientWidth = (value: number) =>
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value,
    })

  setClientWidth(clientWidth)

  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: innerWidth,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: innerHeight,
  })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
  Object.defineProperty(document.documentElement, 'scrollWidth', {
    configurable: true,
    value: innerWidth,
  })

  setScrollPosition(scrollX, scrollY)

  const scrollTo = vi
    .spyOn(window, 'scrollTo')
    .mockImplementation((() => {
      scrollBehaviorDuringScroll.push(
        document.documentElement.style.scrollBehavior,
      )
    }) as typeof window.scrollTo)

  return { scrollBehaviorDuringScroll, scrollTo }
}

export function setScrollPosition(x: number, y: number) {
  Object.defineProperty(window, 'scrollX', { configurable: true, value: x })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y })
}

export function setDocumentHeight(height: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: height,
  })
}

export function setDocumentWidth(width: number) {
  Object.defineProperty(document.documentElement, 'scrollWidth', {
    configurable: true,
    value: width,
  })
}

export function setClientWidth(width: number) {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: width,
  })
}

export function resetDocumentStyles() {
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
}
