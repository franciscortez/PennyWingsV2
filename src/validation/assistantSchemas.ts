import { z } from 'zod'

export const ASSISTANT_HISTORY_LIMIT = 12
export const ASSISTANT_MESSAGE_MAX_LENGTH = 4_000
export const ASSISTANT_QUESTION_MAX_LENGTH = 1_200

export const assistantPromptMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Messages cannot be empty.')
    .max(ASSISTANT_MESSAGE_MAX_LENGTH, 'A conversation message is too long.'),
  role: z.enum(['user', 'assistant']),
})

export const assistantQuestionSchema = z
  .string()
  .trim()
  .min(1, 'Enter a question.')
  .max(
    ASSISTANT_QUESTION_MAX_LENGTH,
    `Keep your question under ${ASSISTANT_QUESTION_MAX_LENGTH.toLocaleString()} characters.`,
  )

export const assistantRequestSchema = z.object({
  messages: z
    .array(assistantPromptMessageSchema)
    .max(ASSISTANT_HISTORY_LIMIT, 'The conversation history is too long.'),
  question: assistantQuestionSchema,
})

export const assistantResponseSchema = z.object({
  message: z.string().trim().min(1),
  model: z.string().trim().min(1).optional(),
})
