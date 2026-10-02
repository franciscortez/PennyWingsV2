import { createContext } from 'react'
import type { LucideIcon } from 'lucide-react'

export type MobilePrimaryAction = {
  label: string
  icon: LucideIcon
  onSelect: () => void
}

export type MobileActionRegistration = {
  action: MobilePrimaryAction
  pathname: string
  owner: symbol
}

export const MobileActionContext = createContext<{
  registration: MobileActionRegistration | null
  register: (pathname: string, action: MobilePrimaryAction) => () => void
} | null>(null)
