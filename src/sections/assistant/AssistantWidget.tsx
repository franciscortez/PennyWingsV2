import { useEffect, useRef } from 'react'

import { useAssistant } from '@/hooks/useAssistant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useScrollLock } from '@/hooks/useScrollLock'
import { getTabbableElements } from '@/lib/focusable'
import { registerOverlay } from '@/lib/overlayStack'
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
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // The desktop panel is a companion to the page and must not freeze it; the
  // mobile panel is full screen, so there it owns the page like any overlay.
  useScrollLock(isOpen && !isDesktop)

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const isMobileViewport = !window.matchMedia('(min-width: 768px)').matches
    const focusFrame = window.requestAnimationFrame(() => {
      if (isMobileViewport) {
        panelRef.current
          ?.querySelector<HTMLElement>('button:not([disabled])')
          ?.focus()
      } else {
        inputRef.current?.focus()
      }
    })

    const panel = panelRef.current
    const overlay = registerOverlay(document)

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      // Escape and Tab belong to the topmost overlay, so a modal above the
      // assistant keeps its keystrokes; a key a modal already consumed on the
      // document is not handled again here.
      if (event.defaultPrevented || !overlay.isTopmost()) return

      if (event.key === 'Escape') {
        event.preventDefault()
        closeAssistant()
      }

      if (event.key === 'Tab') {
        const focusable = panelRef.current
          ? getTabbableElements(panelRef.current)
          : []
        if (!focusable.length) return

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
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
      overlay.release()

      // Only return focus the assistant still owns; another overlay may have
      // taken it since.
      const active = document.activeElement
      const ownsFocus =
        !active ||
        active === document.body ||
        Boolean(panel?.contains(active))
      if (ownsFocus) previousFocusRef.current?.focus({ preventScroll: true })
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
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 py-5 [-webkit-overflow-scrolling:touch] md:touch-auto md:overscroll-contain md:[-webkit-overflow-scrolling:auto]"
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
