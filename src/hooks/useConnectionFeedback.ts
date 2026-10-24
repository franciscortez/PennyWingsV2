import { useContext } from 'react'
import { ConnectionFeedbackContext } from '@/context/connectionFeedback'

// Forms rendered outside the signed-in shell do not need connection presentation.
export function useConnectionFeedback() {
  return useContext(ConnectionFeedbackContext)
}
