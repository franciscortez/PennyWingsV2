import { useCallback, useMemo, useRef, useState } from 'react'
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
  }, [reset])

  const cancelResponse = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setError('Response canceled.')
  }, [])

  // The draft lives with the composer, not here: keeping it in this shared
  // state re-rendered the provider and every consumer on each keystroke.
  // `onAccepted` fires once the question passes validation so the composer can
  // clear its own draft.
  const sendMessage = useCallback(async (
    nextQuestion: string,
    onAccepted?: () => void,
  ) => {
    const parsedQuestion = assistantQuestionSchema.safeParse(nextQuestion)

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
    onAccepted?.()

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
  }, [messages, mutateAsync])

  return useMemo(
    () => ({
      cancelResponse,
      clearConversation,
      error,
      messages,
      sendMessage,
      sending: isPending,
    }),
    [cancelResponse, clearConversation, error, isPending, messages, sendMessage],
  )
}
