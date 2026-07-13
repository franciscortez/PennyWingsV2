export type AssistantRole = 'user' | 'assistant'

export type AssistantMessage = {
  content: string
  id: string
  role: AssistantRole
}

export type AssistantPromptMessage = Pick<AssistantMessage, 'content' | 'role'>

export type AssistantRequest = {
  messages: AssistantPromptMessage[]
  question: string
}

export type AssistantResponse = {
  message: string
  model?: string
}

export type AssistantContextValue = {
  cancelResponse: () => void
  clearConversation: () => void
  closeAssistant: () => void
  error: string | null
  isOpen: boolean
  messages: AssistantMessage[]
  openAssistant: () => void
  question: string
  sendMessage: (question?: string) => Promise<void>
  sending: boolean
  setQuestion: (question: string) => void
}
