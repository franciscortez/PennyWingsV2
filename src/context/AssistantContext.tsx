import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { AssistantContext } from '@/context/assistantContextValue'
import { useAssistantChat } from '@/hooks/useAssistantChat'
import type { AssistantContextValue } from '@/types'

type AssistantProviderProps = {
  children: ReactNode
}

export function AssistantProvider({ children }: AssistantProviderProps) {
  const chat = useAssistantChat()
  const [isOpen, setIsOpen] = useState(false)

  const closeAssistant = useCallback(() => setIsOpen(false), [])
  const openAssistant = useCallback(() => setIsOpen(true), [])

  const value = useMemo<AssistantContextValue>(
    () => ({
      ...chat,
      closeAssistant,
      isOpen,
      openAssistant,
    }),
    [chat, closeAssistant, isOpen, openAssistant],
  )

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}
