import { useEffect, useRef } from 'react'

import { AssistantMark } from '@/sections/assistant/AssistantMark'
import { MarkdownText } from '@/components/ui'
import type { AssistantMessage } from '@/types'

type AssistantConversationProps = {
  messages: AssistantMessage[]
  sending: boolean
}

export function AssistantConversation({
  messages,
  sending,
}: AssistantConversationProps) {
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  return (
    <div className="space-y-5">
      {messages.map((message) => {
        const isUser = message.role === 'user'

        return (
          <div
            key={message.id}
            className={`animate-assistant-message-in flex items-end gap-2 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {!isUser ? <AssistantMark size="sm" /> : null}
            <div
              className={`max-w-[84%] break-words rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${
                isUser
                  ? 'whitespace-pre-wrap rounded-br-md bg-pink-600 text-white'
                  : 'rounded-bl-md border border-pink-100 bg-pink-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {isUser ? (
                message.content
              ) : (
                <MarkdownText content={message.content} />
              )}
            </div>
          </div>
        )
      })}

      {sending ? <AssistantThinking /> : null}
      <div ref={messageEndRef} />
    </div>
  )
}

function AssistantThinking() {
  return (
    <div className="animate-assistant-message-in flex items-end gap-2" role="status">
      <AssistantMark size="sm" />
      <div className="rounded-2xl rounded-bl-md border border-pink-100 bg-pink-50 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
          Reviewing your financial snapshot
        </p>
        <span className="mt-2 flex h-3 items-center gap-1" aria-hidden="true">
          <span className="animate-assistant-dot h-1.5 w-1.5 rounded-full bg-pink-500" />
          <span className="animate-assistant-dot h-1.5 w-1.5 rounded-full bg-pink-500 [animation-delay:140ms]" />
          <span className="animate-assistant-dot h-1.5 w-1.5 rounded-full bg-pink-500 [animation-delay:280ms]" />
        </span>
        <span className="sr-only">PennyWings AI is preparing a response.</span>
      </div>
    </div>
  )
}


