import { useEffect, useRef } from 'react'

import { useAssistant } from '@/hooks/useAssistant'
import { AssistantComposer } from '@/sections/assistant/AssistantComposer'
import { AssistantConversation } from '@/sections/assistant/AssistantConversation'
import { AssistantHeader } from '@/sections/assistant/AssistantHeader'
import { AssistantLauncher } from '@/sections/assistant/AssistantLauncher'
import { AssistantWelcome } from '@/sections/assistant/AssistantWelcome'

export function AssistantWidget() {
  const {
    cancelResponse,
    clearConversation,
    closeAssistant,
    error,
    isOpen,
    messages,
    openAssistant,
    question,
    sendMessage,
    sending,
    setQuestion,
  } = useAssistant()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    window.requestAnimationFrame(() => inputRef.current?.focus())

    const isMobile = !window.matchMedia('(min-width: 768px)').matches
    if (isMobile) {
      document.body.style.overflow = 'hidden'
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeAssistant()

      if (event.key === 'Tab') {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable?.length) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [closeAssistant, isOpen])

  return (
    <>
      <AssistantLauncher expanded={isOpen} onOpen={openAssistant} />

      {isOpen ? (
        <section
          ref={panelRef}
          className="animate-assistant-panel-in fixed inset-0 z-60 flex flex-col overflow-hidden border-pink-100 bg-white shadow-2xl md:inset-auto md:bottom-24 md:right-6 md:h-[min(42rem,calc(100vh-8rem))] md:w-[min(26rem,calc(100vw-3rem))] md:rounded-2xl md:border dark:border-slate-800 dark:bg-slate-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-title"
        >
          <AssistantHeader
            canClear={messages.length > 0}
            onClear={clearConversation}
            onClose={closeAssistant}
          />

          <div
            className="flex-1 overflow-y-auto px-4 py-5"
            aria-live="polite"
            aria-busy={sending}
          >
            {messages.length === 0 && !sending ? (
              <AssistantWelcome
                disabled={sending}
                onSelect={(suggestion) => void sendMessage(suggestion)}
              />
            ) : (
              <AssistantConversation messages={messages} sending={sending} />
            )}
          </div>

          <AssistantComposer
            error={error}
            inputRef={inputRef}
            onCancel={cancelResponse}
            onQuestionChange={setQuestion}
            onSend={sendMessage}
            question={question}
            sending={sending}
          />
        </section>
      ) : null}
    </>
  )
}
