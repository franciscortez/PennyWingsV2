import { createContext } from 'react'

export type ConnectionFeedback = {
  state: 'online' | 'offline' | 'reconnected' | 'uncertain' | 'refreshing' | 'failed'
  message: string
  uncertain: boolean
  refresh: () => Promise<void>
}

export const ConnectionFeedbackContext = createContext<ConnectionFeedback | null>(null)
