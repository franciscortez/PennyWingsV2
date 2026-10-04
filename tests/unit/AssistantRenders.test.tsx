import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { AssistantProvider } from '@/context/AssistantContext'
import { useAssistant } from '@/hooks/useAssistant'
import { AssistantWidget } from '@/sections/assistant'

const sendAssistantMessage = vi.fn()
vi.mock('@/services/assistantService', () => ({
  sendAssistantMessage: (...args: unknown[]) => sendAssistantMessage(...args),
}))

// Stands in for Layout: a long-lived consumer of the assistant context.
const renderCounter = vi.fn()
function ContextConsumer() {
  const { openAssistant } = useAssistant()
  renderCounter()
  return (
    <button type="button" onClick={openAssistant}>
      Open assistant for test
    </button>
  )
}

// The widget moves focus on the first animation frame after it opens, so let
// that settle before typing or the first keystroke races with it.
const openAssistantPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Open assistant for test' }))
  const input = await screen.findByLabelText('Message PennyWings AI')
  await act(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  )
  await user.click(input)
  return input
}

const renderAssistant = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AssistantProvider>
        <ContextConsumer />
        <AssistantWidget />
      </AssistantProvider>
    </QueryClientProvider>,
  )

describe('assistant draft state', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView, which the conversation uses.
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('does not re-render context consumers while the user types', async () => {
    const user = userEvent.setup()
    renderAssistant()
    const input = await openAssistantPanel(user)
    renderCounter.mockClear()

    await user.type(input, 'How much did I spend on food?')

    expect(input).toHaveValue('How much did I spend on food?')
    expect(renderCounter).not.toHaveBeenCalled()
  })

  it('sends the typed draft and clears it once accepted', async () => {
    const user = userEvent.setup()
    sendAssistantMessage.mockResolvedValue({ message: 'You spent P1,200.' })
    renderAssistant()
    const input = await openAssistantPanel(user)
    await user.type(input, 'Summary please')
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    expect(input).toHaveValue('')
    expect(await screen.findByText('You spent P1,200.')).toBeInTheDocument()
    expect(sendAssistantMessage).toHaveBeenCalledWith(
      expect.objectContaining({ question: 'Summary please' }),
      expect.any(AbortSignal),
    )
  })

  it('keeps the draft when the question is rejected by validation', async () => {
    const user = userEvent.setup()
    renderAssistant()
    const input = await openAssistantPanel(user)
    await user.type(input, '   ')
    // The send button stays disabled for blank input, so submit via Enter.
    await user.keyboard('{Enter}')

    expect(input).toHaveValue('   ')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('clears the draft with the conversation', async () => {
    const user = userEvent.setup()
    sendAssistantMessage.mockResolvedValue({ message: 'Done.' })
    renderAssistant()
    const input = await openAssistantPanel(user)
    await user.type(input, 'First question')
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    await screen.findByText('Done.')

    await user.type(input, 'half-typed follow up')
    await user.click(screen.getByRole('button', { name: /clear/i }))

    expect(input).toHaveValue('')
  })
})
