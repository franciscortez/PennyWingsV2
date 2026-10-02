import { useContext, useEffect } from 'react'
import { useLocation } from 'react-router'

import { MobileActionContext, type MobilePrimaryAction } from '@/context/mobileActionContextValue'

function useMobileActionContext() {
  const context = useContext(MobileActionContext)
  if (!context) throw new Error('Mobile actions require a MobileActionProvider.')
  return context
}

export function useMobilePrimaryAction(action: MobilePrimaryAction | null) {
  const { pathname } = useLocation()
  const { register } = useMobileActionContext()
  const label = action?.label
  const icon = action?.icon
  const onSelect = action?.onSelect

  useEffect(() => {
    if (!label || !icon || !onSelect) return
    return register(pathname, { label, icon, onSelect })
  }, [pathname, register, label, icon, onSelect])
}

export function useCurrentMobileAction() {
  const { pathname } = useLocation()
  const { registration } = useMobileActionContext()
  return registration?.pathname === pathname ? registration.action : null
}
