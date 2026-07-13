import { useCallback, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'

import { AppError } from '@/lib/errors'
import { sendAssistantMessage } from '@/services/assistantService'
import type { AssistantMessage, AssistantRequest } from '@/types'
import {
  ASSISTANT_HISTORY_LIMIT,
  assistantQuestionSchema,
} from '@/validation/assistantSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

const createMessage = (
  role: AssistantMessage['role'],
  content: string,
): AssistantMessage => ({
  content,
  id: crypto.randomUUID(),
  role,
})

export function useAssistantChat() {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [question, setQuestion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const { isPending, mutateAsync, reset } = useMutation({
    mutationFn: ({
      request,
      signal,
    }: {
      request: AssistantRequest
      signal: AbortSignal
    }) => sendAssistantMessage(request, signal),
  })

  const clearConversation = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    reset()
    setError(null)
    setMessages([])
    setQuestion('')
  }, [reset])

  const cancelResponse = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setError('Response canceled.')
  }, [])

  const sendMessage = useCallback(async (suggestedQuestion?: string) => {
    const parsedQuestion = assistantQuestionSchema.safeParse(
      suggestedQuestion ?? question,
    )

    if (!parsedQuestion.success) {
      setError(
        getZodErrorMessage(parsedQuestion.error, 'Enter a valid question.'),
      )
      return
    }

    const trimmedQuestion = parsedQuestion.data
    const history = messages.slice(-ASSISTANT_HISTORY_LIMIT).map((message) => ({
      content: message.content,
      role: message.role,
    }))
    const controller = new AbortController()
    abortControllerRef.current = controller
    setError(null)
    setMessages((current) => [
      ...current,
      createMessage('user', trimmedQuestion),
    ])
    setQuestion('')

    try {
      const response = await mutateAsync({
        request: { messages: history, question: trimmedQuestion },
        signal: controller.signal,
      })

      if (!controller.signal.aborted) {
        setMessages((current) => [
          ...current,
          createMessage('assistant', response.message),
        ])
      }
    } catch (caughtError) {
      if (!controller.signal.aborted) {
        setError(
          AppError.from(caughtError, 'Unable to get an AI response.').message,
        )
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [messages, mutateAsync, question])

  return {
    cancelResponse,
    clearConversation,
    error,
    messages,
    question,
    sendMessage,
    sending: isPending,
    setQuestion,
  }
}
