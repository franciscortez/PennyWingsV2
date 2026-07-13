import { Send, Square } from 'lucide-react'
import type {
  FormEvent,
  KeyboardEvent,
  RefObject,
} from 'react'

import { AppButton } from '@/components/ui'
import { ASSISTANT_QUESTION_MAX_LENGTH } from '@/validation/assistantSchemas'

type AssistantComposerProps = {
  error: string | null
  inputRef: RefObject<HTMLTextAreaElement | null>
  onCancel: () => void
  onQuestionChange: (question: string) => void
  onSend: () => Promise<void>
  question: string
  sending: boolean
}

export function AssistantComposer({
  error,
  inputRef,
  onCancel,
  onQuestionChange,
  onSend,
  question,
  sending,
}: AssistantComposerProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!sending) void onSend()
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!sending) void onSend()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-pink-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900 md:pb-3"
    >
      {error ? (
        <p
          className="animate-assistant-message-in mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="flex items-end gap-2">
        <label htmlFor="assistant-question" className="sr-only">
          Message PennyWings AI
        </label>
        <textarea
          ref={inputRef}
          id="assistant-question"
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          onKeyDown={handleInputKeyDown}
          maxLength={ASSISTANT_QUESTION_MAX_LENGTH}
          rows={1}
          placeholder={sending ? 'You can prepare your next question' : 'Ask about your finances'}
          className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border-2 border-pink-100 bg-pink-50/30 px-4 py-3 text-base font-medium text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 md:text-sm dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:focus:border-pink-500"
        />
        {sending ? (
          <AppButton
            type="button"
            onClick={onCancel}
            size="icon"
            variant="secondary"
            className="h-12 w-12 shrink-0 rounded-2xl"
            aria-label="Stop generating response"
            title="Stop response"
          >
            <Square className="h-4 w-4 fill-current" aria-hidden="true" />
          </AppButton>
        ) : (
          <AppButton
            type="submit"
            size="icon"
            className="group/send h-12 w-12 shrink-0 rounded-2xl shadow-sm shadow-pink-200 dark:shadow-none"
            disabled={!question.trim()}
            aria-label="Send message"
            title="Send message"
          >
            <Send
              className="h-5 w-5 transition-transform duration-200 group-hover/send:-translate-y-0.5 group-hover/send:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </AppButton>
        )}
      </div>
    </form>
  )
}
