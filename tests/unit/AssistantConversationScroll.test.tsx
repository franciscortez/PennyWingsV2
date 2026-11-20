import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AssistantConversation } from '@/sections/assistant/AssistantConversation'
import type { AssistantMessage } from '@/types'

const messages: AssistantMessage[] = [{ id: 'm1', role: 'assistant', content: 'Hello' }]

describe('AssistantConversation scrolling', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView
  })

  afterEach(() => {
    scrollIntoView.mockClear()
    vi.restoreAllMocks()
  })

  it('scrolls smoothly to the latest message without a motion preference', () => {
    render(<AssistantConversation messages={messages} sending={false} />)

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  })

  it('jumps instead of animating when reduced motion is requested', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) => ({ matches: query === '(prefers-reduced-motion: reduce)', media: query }) as MediaQueryList,
    )

    render(<AssistantConversation messages={messages} sending={false} />)

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' })
  })
})
