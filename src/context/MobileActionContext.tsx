import { useCallback, useMemo, useState, type ReactNode } from 'react'

import {
  MobileActionContext,
  type MobileActionRegistration,
  type MobilePrimaryAction,
} from '@/context/mobileActionContextValue'

export function MobileActionProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<MobileActionRegistration | null>(null)
  const register = useCallback((pathname: string, action: MobilePrimaryAction) => {
    const owner = Symbol('mobile-action')
    setRegistration({ action, pathname, owner })

    return () => {
      setRegistration((current) => current?.owner === owner ? null : current)
    }
  }, [])
  const value = useMemo(() => ({ registration, register }), [registration, register])

  return <MobileActionContext.Provider value={value}>{children}</MobileActionContext.Provider>
}
