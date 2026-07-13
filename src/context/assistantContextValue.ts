import { createContext } from 'react'

import type { AssistantContextValue } from '@/types'

export const AssistantContext = createContext<AssistantContextValue | null>(null)
