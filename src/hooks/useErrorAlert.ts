import { useEffect, useRef } from 'react'

import { alerts } from '@/lib/alert'

export function useErrorAlert(error: string | null) {
  const lastShownError = useRef<string | null>(null)

  useEffect(() => {
    if (!error) {
      lastShownError.current = null
      return
    }

    if (lastShownError.current === error) {
      return
    }

    lastShownError.current = error
    alerts.error(error)
  }, [error])
}
