import { supabase } from '@/lib/supabase'
import { AppError } from '@/lib/errors'
import type { AssistantRequest, AssistantResponse } from '@/types'
import {
  assistantRequestSchema,
  assistantResponseSchema,
} from '@/validation/assistantSchemas'

const getFunctionErrorMessage = (status: number | undefined) => {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 402) return 'The AI service has reached its usage limit.'
  if (status === 413) return 'This conversation is too long. Clear it and try again.'
  if (status === 429) return 'The AI service is busy. Please wait and try again.'
  if (status && status >= 500) return 'The AI service is temporarily unavailable.'

  return 'Unable to reach the AI assistant.'
}

export const sendAssistantMessage = async (
  request: AssistantRequest,
  signal?: AbortSignal,
): Promise<AssistantResponse> => {
  const input = assistantRequestSchema.parse(request)
  const { data, error } = await supabase.functions.invoke('finance-assistant', {
    body: input,
    signal,
  })

  if (error) {
    const status = error.context instanceof Response ? error.context.status : undefined
    throw new AppError(getFunctionErrorMessage(status), {
      cause: error,
      code: status ? String(status) : undefined,
    })
  }

  const result = assistantResponseSchema.safeParse(data)

  if (!result.success) {
    throw new AppError('The AI assistant returned an invalid response.')
  }

  return result.data
}
